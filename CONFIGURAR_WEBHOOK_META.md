# 🔧 Configurar Webhook en Meta for Developers

## 🎯 Problema Actual

Los mensajes llegan a Meta pero **NO se envían a tu backend** porque el webhook no está configurado correctamente.

---

## ✅ Solución: Configurar el Webhook

### Paso 1: Ir a Meta for Developers

1. Ve a: https://developers.facebook.com/apps
2. Selecciona tu aplicación de WhatsApp

### Paso 2: Configurar el Webhook

1. En el menú lateral izquierdo, busca **"WhatsApp"**
2. Haz clic en **"Configuration"** (Configuración)
3. Busca la sección **"Webhook"**
4. Haz clic en el botón **"Edit"** (Editar)

### Paso 3: Ingresar la URL del Webhook

**Callback URL:**
```
https://dwana-shoreless-bewitchingly.ngrok-free.dev/api/webhook/whatsapp
```

**Verify Token:**
```
whatsapp_verify_token_123
```

### Paso 4: Verificar y Guardar

1. Haz clic en **"Verify and Save"**
2. Meta intentará verificar el webhook
3. Si todo está bien, verás un mensaje de éxito ✅

### Paso 5: Suscribirse a Eventos

1. En la misma página, busca **"Webhook fields"**
2. Asegúrate de que **"messages"** esté **MARCADO/SUSCRITO**
3. Si no lo está, haz clic en **"Subscribe"** o marca la casilla

---

## 🧪 Verificar que Funciona

### Opción 1: Enviar Mensaje de Prueba desde Meta

En la página de "API Setup" de Meta, hay una sección para enviar mensajes de prueba. Úsala para verificar.

### Opción 2: Enviar Mensaje Real desde WhatsApp

1. Envía un mensaje desde el número autorizado: **+57 324 2181400**
2. Monitorea los logs del backend:
   ```bash
   docker-compose logs -f backend
   ```
3. Deberías ver:
   ```
   📨 POST Webhook received from WhatsApp
   ✅ Received WhatsApp message: ...
   ```

### Opción 3: Ver Peticiones en ngrok

Abre: http://127.0.0.1:4040

Deberías ver peticiones POST llegando desde Meta cuando envías mensajes.

---

## ⚠️ Notas Importantes

### 1. ngrok debe estar corriendo

Verifica que ngrok esté activo:
```bash
ps aux | grep ngrok | grep -v grep
```

Si no está corriendo:
```bash
ngrok http 3000
```

### 2. La URL de ngrok puede cambiar

Si reinicias ngrok, la URL puede cambiar. Si eso pasa:
1. Obtén la nueva URL: http://127.0.0.1:4040
2. Actualiza el webhook en Meta con la nueva URL

### 3. Para Producción

ngrok es solo para desarrollo. Para producción necesitas:
- Un dominio propio
- Certificado SSL (HTTPS)
- Servidor con IP pública

---

## 📸 Captura de Pantalla de Referencia

La configuración debería verse así:

```
┌─────────────────────────────────────────┐
│ Webhook                                 │
├─────────────────────────────────────────┤
│ Callback URL:                           │
│ https://dwana-shoreless-bewitchingly... │
│                                         │
│ Verify Token:                           │
│ whatsapp_verify_token_123               │
│                                         │
│ [Verify and Save]                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Webhook Fields                          │
├─────────────────────────────────────────┤
│ ☑ messages          [Subscribed]       │
│ ☐ message_status                        │
│ ☐ messaging_postbacks                   │
└─────────────────────────────────────────┘
```

---

## 🆘 Troubleshooting

### Si la verificación falla:

1. **Verifica que ngrok esté corriendo**
   ```bash
   curl https://dwana-shoreless-bewitchingly.ngrok-free.dev/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=whatsapp_verify_token_123&hub.challenge=test
   ```
   Debería responder: `test`

2. **Verifica que el backend esté corriendo**
   ```bash
   docker-compose ps backend
   ```

3. **Revisa los logs**
   ```bash
   docker-compose logs backend --tail=50
   ```

### Si los mensajes no llegan después de configurar:

1. Verifica que "messages" esté suscrito en Webhook Fields
2. Envía un mensaje de prueba desde WhatsApp
3. Revisa los logs de ngrok: http://127.0.0.1:4040
4. Revisa los logs del backend: `docker-compose logs -f backend`

---

## ✅ Checklist Final

- [ ] Webhook configurado en Meta con la URL correcta
- [ ] Verify token correcto: `whatsapp_verify_token_123`
- [ ] Webhook verificado exitosamente (✅ en Meta)
- [ ] "messages" suscrito en Webhook Fields
- [ ] ngrok corriendo
- [ ] Backend corriendo
- [ ] Enviar mensaje de prueba desde WhatsApp
- [ ] Verificar que llega al backend (logs)
- [ ] Recibir respuesta del bot en WhatsApp

Una vez completado todo, el bot debería responder automáticamente a tus mensajes. 🎉

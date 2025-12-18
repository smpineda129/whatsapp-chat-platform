# 🧪 Probar Flujo Completo de WhatsApp Bot

## ✅ Estado Actual
- Token temporal generado: ✅
- Número de prueba agregado: +57 324 2181400 ✅
- Webhook activado: ✅
- Envío de mensajes funcionando: ✅

---

## 📱 Flujo Completo a Probar

```
Usuario envía mensaje → WhatsApp API → Webhook (Backend) → n8n → OpenAI → Respuesta automática
```

---

## 🚀 Pasos para Probar

### 1. Enviar Mensaje desde WhatsApp

Desde tu teléfono (+57 324 2181400):
1. Abre WhatsApp
2. Inicia conversación con: **+1 555 622 6415**
3. Envía un mensaje: "Hola"

### 2. Verificar Logs del Backend en Render

1. Ve a https://dashboard.render.com
2. Selecciona **whatsapp-backend**
3. Ve a la pestaña **Logs**
4. Busca líneas como:
   ```
   📨 POST Webhook received from WhatsApp
   ✅ Received WhatsApp message: Hola
   📤 Forwarding to n8n...
   ```

### 3. Verificar n8n

1. Ve a tu instancia de n8n: `https://whatsapp-n8n-XXX.onrender.com`
2. Login con tus credenciales
3. Abre el workflow de WhatsApp
4. Verifica que se haya ejecutado (debe aparecer en el historial)
5. Revisa cada nodo para ver el flujo de datos

### 4. Verificar Respuesta

El bot debería responder automáticamente a tu mensaje en WhatsApp.

---

## 🔍 Troubleshooting

### Si no recibes el mensaje en el backend:

**Verificar webhook:**
```bash
curl "https://whatsapp-chat-platform-backend.onrender.com/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=whatsapp_verify_token_123&hub.challenge=test123"
```
Debe responder: `test123`

**Verificar que el webhook esté suscrito a "messages":**
1. Meta for Developers → Tu app → WhatsApp → Configuration
2. En Webhook, verifica que esté marcado: ✅ messages

### Si el mensaje llega pero no hay respuesta:

**Verificar n8n:**
1. Revisa que el workflow esté **activado** (toggle en ON)
2. Verifica la URL del webhook de n8n en las variables de entorno:
   ```
   N8N_WEBHOOK_URL=https://whatsapp-n8n-XXX.onrender.com/webhook/whatsapp-bot
   ```
3. Prueba el webhook de n8n directamente:
   ```bash
   curl -X POST https://whatsapp-n8n-XXX.onrender.com/webhook/whatsapp-bot \
     -H "Content-Type: application/json" \
     -d '{"from":"573242181400","message":"Hola de prueba"}'
   ```

**Verificar OpenAI:**
1. Confirma que `OPENAI_API_KEY` esté configurado en n8n
2. Verifica que tengas créditos en tu cuenta de OpenAI
3. Revisa los logs de n8n para ver errores

### Si el backend no puede enviar la respuesta:

**Verificar token de WhatsApp:**
1. Confirma que `WHATSAPP_API_TOKEN` esté actualizado en Render
2. El token temporal expira en 60 minutos
3. Genera uno nuevo si es necesario

**Verificar FACEBOOK_APP_SECRET:**
1. Debe estar configurado en Render
2. Sin espacios extra
3. Debe coincidir con el de Meta for Developers

---

## 📊 Verificación Paso a Paso

### Paso 1: Webhook recibe el mensaje
```
✅ Backend logs: "POST Webhook received from WhatsApp"
✅ Backend logs: "Received WhatsApp message: [tu mensaje]"
```

### Paso 2: Backend reenvía a n8n
```
✅ Backend logs: "Forwarding to n8n..."
✅ Backend logs: "n8n response: 200"
```

### Paso 3: n8n procesa con OpenAI
```
✅ n8n logs: Webhook triggered
✅ n8n logs: OpenAI node executed
✅ n8n logs: Response generated
```

### Paso 4: Backend envía respuesta
```
✅ Backend logs: "Sending WhatsApp message to: [tu número]"
✅ Backend logs: "Message sent successfully"
```

### Paso 5: Recibes respuesta en WhatsApp
```
✅ Tu teléfono recibe mensaje del bot
```

---

## 🎯 Comandos Útiles

### Ver logs del backend en tiempo real:
```bash
# En Render Dashboard → whatsapp-backend → Logs
# O usa la API de Render si tienes acceso
```

### Probar endpoint de salud:
```bash
curl https://whatsapp-chat-platform-backend.onrender.com/api/health
```

### Probar envío manual desde el backend:
```bash
curl -X POST https://whatsapp-chat-platform-backend.onrender.com/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_JWT_TOKEN" \
  -d '{
    "to": "573242181400",
    "message": "Mensaje de prueba manual"
  }'
```

---

## 📋 Checklist de Verificación

- [ ] Token temporal copiado y actualizado en Render
- [ ] FACEBOOK_APP_SECRET agregado en Render
- [ ] Backend reiniciado (debe estar en estado "Live")
- [ ] Webhook configurado en Meta for Developers
- [ ] Webhook suscrito al evento "messages"
- [ ] Número de prueba agregado (+57 324 2181400)
- [ ] n8n workflow activado
- [ ] OpenAI API Key configurado en n8n
- [ ] Enviar mensaje desde WhatsApp al número de prueba
- [ ] Verificar logs del backend
- [ ] Verificar ejecución en n8n
- [ ] Recibir respuesta automática en WhatsApp

---

## 💡 Notas Importantes

1. **Token temporal expira en 60 minutos**: Genera uno nuevo cuando expire
2. **Números de prueba**: Solo puedes enviar a los 5 números agregados
3. **Modo desarrollo**: Estás en modo de prueba, no producción
4. **Verificación del negocio**: Necesaria para usar en producción con cualquier número

---

## 🎉 Éxito

Si ves esto en los logs y recibes respuesta en WhatsApp:
```
📨 POST Webhook received from WhatsApp
✅ Received WhatsApp message: Hola
📤 Forwarding to n8n...
✅ n8n processed successfully
📤 Sending response to WhatsApp...
✅ Message sent successfully: wamid.XXX
```

**¡Tu bot está funcionando correctamente!** 🎊

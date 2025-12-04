# 🔗 Configuración del Webhook en Meta for Developers

## ✅ Tu URL de ngrok está activa

**URL del Webhook**: `https://dwana-shoreless-bewitchingly.ngrok-free.dev/api/webhook/whatsapp`

**Verify Token**: `whatsapp_verify_token_123`

---

## 📋 Pasos para Configurar en Meta for Developers

### 1. Accede a Meta for Developers
Ve a: https://developers.facebook.com/apps

### 2. Selecciona tu App de WhatsApp
- Busca tu aplicación en el dashboard
- Haz clic para abrirla

### 3. Configura el Webhook

1. En el menú lateral, ve a: **WhatsApp > Configuration**

2. En la sección **Webhook**, haz clic en **Edit** o **Configure**

3. Ingresa los siguientes datos:

   **Callback URL:**
   ```
   https://dwana-shoreless-bewitchingly.ngrok-free.dev/api/webhook/whatsapp
   ```

   **Verify Token:**
   ```
   whatsapp_verify_token_123
   ```

4. Haz clic en **Verify and Save**

   ✅ Si todo está bien, verás un mensaje de éxito

5. **Suscríbete a los eventos de mensajes:**
   - Marca la casilla de **messages**
   - Guarda los cambios

### 4. Verifica que funciona

Envía un mensaje de WhatsApp al número configurado en tu app.

### 5. Monitorea los logs

En otra terminal, ejecuta:

```bash
docker-compose logs -f backend
```

Deberías ver algo como:

```
📨 POST Webhook received from WhatsApp
Request body: {
  "entry": [...]
}
✅ Received WhatsApp message: ...
```

---

## 🔍 Verificación Manual

### Probar el endpoint GET (verificación)
```bash
curl "https://dwana-shoreless-bewitchingly.ngrok-free.dev/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=whatsapp_verify_token_123&hub.challenge=test123"
```

**Respuesta esperada:** `test123`

### Ver la interfaz de ngrok
Abre en tu navegador: http://127.0.0.1:4041

Aquí podrás ver todas las peticiones que llegan a tu webhook en tiempo real.

---

## ⚠️ Notas Importantes

1. **Esta URL es temporal**: Si reinicias ngrok, la URL cambiará y tendrás que actualizar el webhook en Meta.

2. **Para URL permanente**: Necesitas una cuenta de pago de ngrok o desplegar en producción.

3. **Mantén ngrok corriendo**: No cierres la terminal donde está corriendo ngrok.

---

## 🐛 Troubleshooting

### Si el webhook no verifica:
- Verifica que el token sea exactamente: `whatsapp_verify_token_123`
- Asegúrate de que el backend esté corriendo: `docker-compose ps`
- Revisa los logs: `docker-compose logs backend`

### Si no recibes mensajes:
- Verifica que te suscribiste al evento `messages` en Meta
- Revisa los logs del backend
- Verifica la interfaz de ngrok en http://127.0.0.1:4041

### Si ngrok se desconecta:
```bash
# Detener ngrok
pkill ngrok

# Reiniciar
ngrok http 3000
```

Luego actualiza la nueva URL en Meta for Developers.

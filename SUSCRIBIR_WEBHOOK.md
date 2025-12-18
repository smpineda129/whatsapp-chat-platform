# 🔔 Suscribir Webhook a Eventos de WhatsApp

## 🎯 Problema

Meta recibe los mensajes pero NO los reenvía al backend.

## ✅ Solución: Suscribir el Webhook

### Opción 1: Desde Meta for Developers (Recomendado)

1. Ve a https://developers.facebook.com/apps
2. Selecciona tu app
3. Ve a **WhatsApp** → **Configuration**
4. En la sección **"Webhook fields"**:
   - Busca el campo **"messages"**
   - **Activa el toggle** (debe ponerse azul)
   - Haz clic en **"Save"** o **"Subscribe"**

### Opción 2: Usando la API de Meta

Ejecuta este comando (reemplaza `TU_TOKEN_AQUI` con tu token de WhatsApp):

```bash
curl -X POST "https://graph.facebook.com/v18.0/823070810514558/subscribed_apps" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d "subscribed_fields=messages"
```

**Respuesta esperada:**
```json
{
  "success": true
}
```

### Verificar Suscripción

Para verificar que está suscrito correctamente:

```bash
curl -X GET "https://graph.facebook.com/v18.0/823070810514558/subscribed_apps?access_token=TU_TOKEN_AQUI"
```

**Deberías ver:**
```json
{
  "data": [
    {
      "whatsapp_business_api_data": {
        "subscribed_fields": ["messages"]
      }
    }
  ]
}
```

---

## 🧪 Probar Después de Suscribir

1. Envía un mensaje desde WhatsApp al número de prueba
2. Revisa los logs de Render
3. Deberías ver:
   ```
   📨 POST Webhook received from WhatsApp
   ✅ Received WhatsApp message: ...
   ```

---

## 📸 Captura de Pantalla Necesaria

Por favor toma una captura de la sección **"Webhook"** en Meta for Developers donde se ve:
- La URL del webhook
- Los campos suscritos (debe mostrar "messages" con toggle azul)

Esto nos ayudará a diagnosticar el problema exacto.

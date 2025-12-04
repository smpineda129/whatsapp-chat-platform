# 🔧 Configuración del Webhook de WhatsApp

## Problema Identificado

WhatsApp Cloud API **requiere una URL pública con HTTPS** para enviar webhooks. Tu backend está corriendo en `localhost:3000`, que no es accesible desde internet.

## ✅ Solución: Usar ngrok para Exponer el Webhook

### Opción 1: ngrok (Recomendado)

#### 1. Instalar ngrok

```bash
# macOS con Homebrew
brew install ngrok

# O descargar desde https://ngrok.com/download
```

#### 2. Crear cuenta gratuita en ngrok
- Ve a https://ngrok.com/signup
- Obtén tu authtoken

#### 3. Configurar ngrok

```bash
ngrok config add-authtoken TU_AUTHTOKEN_AQUI
```

#### 4. Exponer el puerto 3000

```bash
ngrok http 3000
```

Esto te dará una URL como: `https://abc123.ngrok.io`

#### 5. Configurar el Webhook en Meta for Developers

1. Ve a https://developers.facebook.com/
2. Selecciona tu app de WhatsApp
3. Ve a **WhatsApp > Configuration**
4. En **Webhook**, haz clic en **Edit**
5. Configura:
   - **Callback URL**: `https://TU-URL-NGROK.ngrok.io/api/webhook/whatsapp`
   - **Verify Token**: `whatsapp_verify_token_123` (el mismo del .env)
6. Haz clic en **Verify and Save**
7. Suscríbete a los eventos: `messages`

### Opción 2: localtunnel (Alternativa gratuita)

```bash
# Instalar
npm install -g localtunnel

# Ejecutar
lt --port 3000 --subdomain whatsapp-chat-platform
```

URL resultante: `https://whatsapp-chat-platform.loca.lt`

### Opción 3: Cloudflare Tunnel (Más estable)

```bash
# Instalar cloudflared
brew install cloudflare/cloudflare/cloudflared

# Ejecutar
cloudflared tunnel --url http://localhost:3000
```

## 📝 Pasos Completos para Configurar

### 1. Levantar el backend (ya está corriendo)
```bash
docker-compose up -d backend
```

### 2. Exponer con ngrok
```bash
ngrok http 3000
```

**Copia la URL HTTPS que te da ngrok** (ejemplo: `https://abc123.ngrok.io`)

### 3. Actualizar Webhook en Meta

Ve a Meta for Developers y configura:
- **Callback URL**: `https://abc123.ngrok.io/api/webhook/whatsapp`
- **Verify Token**: `whatsapp_verify_token_123`

### 4. Verificar que funciona

Envía un mensaje de WhatsApp al número configurado y verifica los logs:

```bash
docker-compose logs -f backend
```

Deberías ver:
```
📨 POST Webhook received from WhatsApp
✅ Received WhatsApp message: ...
```

## 🔍 Verificar Configuración Actual

### Ver logs del backend
```bash
docker-compose logs -f backend
```

### Probar el endpoint GET (verificación)
```bash
curl "http://localhost:3000/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=whatsapp_verify_token_123&hub.challenge=test123"
```

Debería responder: `test123`

### Probar el endpoint POST (recepción de mensajes)
```bash
curl -X POST http://localhost:3000/api/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "1234567890",
            "id": "test_msg_id",
            "timestamp": "1234567890",
            "type": "text",
            "text": {
              "body": "Hola, esto es una prueba"
            }
          }]
        }
      }]
    }]
  }'
```

## ⚠️ Notas Importantes

1. **ngrok gratuito**: La URL cambia cada vez que reinicias ngrok. Tendrás que actualizar el webhook en Meta cada vez.
2. **ngrok de pago**: Puedes tener un subdominio fijo.
3. **Producción**: Usa un servidor con dominio real y certificado SSL.

## 🚀 Para Producción

En producción, deberías:
1. Desplegar el backend en un servidor (Heroku, Railway, DigitalOcean, AWS)
2. Configurar un dominio con HTTPS
3. Actualizar el webhook con la URL permanente

Ejemplo: `https://api.tudominio.com/api/webhook/whatsapp`

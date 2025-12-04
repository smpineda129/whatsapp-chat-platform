# ⚙️ Configurar Variables de Entorno

## ❌ Error Detectado

Falta la variable `WHATSAPP_PHONE_NUMBER_ID` en tu archivo `.env`

## ✅ Solución

### 1. Abre el archivo `.env` en la raíz del proyecto

### 2. Asegúrate de que tenga estas líneas:

```env
# Database
DATABASE_URL=postgresql://whatsapp_user:whatsapp_pass@postgres:5432/whatsapp_db

# JWT
JWT_SECRET=tu-secreto-super-seguro-cambia-esto

# WhatsApp Cloud API
WHATSAPP_API_TOKEN=TU_NUEVO_TOKEN_AQUI
WHATSAPP_PHONE_NUMBER_ID=944824135370280
WHATSAPP_WEBHOOK_VERIFY_TOKEN=whatsapp_verify_token_123

# OpenAI
OPENAI_API_KEY=tu-api-key-de-openai

# n8n
N8N_WEBHOOK_URL=http://n8n:5678/webhook/whatsapp-bot

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Valores que necesitas actualizar:

**WHATSAPP_API_TOKEN**: 
- Ve a https://developers.facebook.com/apps
- Selecciona tu app
- Ve a WhatsApp > API Setup
- Copia el "Temporary access token" o genera uno permanente

**WHATSAPP_PHONE_NUMBER_ID**: 
- Ya lo tienes: `944824135370280`
- O encuéntralo en WhatsApp > API Setup > "Phone number ID"

**OPENAI_API_KEY** (opcional para el bot):
- Ve a https://platform.openai.com/api-keys
- Crea una nueva API key

### 4. Guarda el archivo `.env`

### 5. Reinicia el backend

```bash
docker-compose down backend
docker-compose up -d backend
```

### 6. Verifica que funciona

```bash
docker-compose logs -f backend
```

Deberías ver:
```
✅ Database connected successfully
🚀 Server running on port 3000
```

## 📋 Checklist

- [ ] Abrir archivo `.env`
- [ ] Agregar/verificar WHATSAPP_PHONE_NUMBER_ID
- [ ] Actualizar WHATSAPP_API_TOKEN con el nuevo token
- [ ] Guardar el archivo
- [ ] Reiniciar backend: `docker-compose down backend && docker-compose up -d backend`
- [ ] Verificar logs: `docker-compose logs -f backend`

---

## 🔍 Verificar Variables

Para ver qué variables tiene el contenedor:

```bash
docker exec whatsapp-backend env | grep WHATSAPP
```

Deberías ver las 3 variables de WhatsApp configuradas.

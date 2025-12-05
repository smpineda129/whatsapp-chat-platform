# 🚀 Inicio Rápido - Despliegue en Producción

## ✅ Archivos Preparados

He creado todos los archivos necesarios para desplegar en producción:

- ✅ `render.yaml` - Configuración para Render
- ✅ `Dockerfile.n8n` - Dockerfile para n8n
- ✅ `frontend/vercel.json` - Configuración para Vercel
- ✅ `DEPLOY_PRODUCTION.md` - Guía completa paso a paso
- ✅ `/api/health` - Endpoint de health check agregado al backend

---

## 🎯 Resumen de 5 Pasos

### 1️⃣ Subir a GitHub

```bash
cd /Users/mac/Documents/WhatsappChatApp/whatsapp-chat-platform

# Si no has inicializado git
git init
git add .
git commit -m "Preparar para despliegue en producción"

# Crear repo en GitHub y conectar
git remote add origin https://github.com/smpineda129/whatsapp-chat-platform
git branch -M main
git push -u origin main
```

### 2️⃣ Desplegar en Render

1. **PostgreSQL**:
   - New + → PostgreSQL
   - Name: `whatsapp-postgres`
   - Plan: Free

2. **n8n**:
   - New + → Web Service
   - Conecta GitHub repo
   - Environment: Docker
   - Dockerfile: `./Dockerfile.n8n`
   - Plan: Free
   - Agrega disco persistente: `/home/node/.n8n` (1GB)

3. **Backend**:
   - New + → Web Service
   - Conecta GitHub repo
   - Root Directory: `backend`
   - Environment: Docker
   - Plan: Free
   - Configura variables de entorno (ver abajo)

### 3️⃣ Desplegar en Vercel

1. Ve a https://vercel.com/new
2. Importa tu repo de GitHub
3. Framework: Vite
4. Root Directory: `frontend`
5. Configura variables de entorno:
   ```
   VITE_API_URL=https://whatsapp-backend-XXX.onrender.com
   VITE_WS_URL=wss://whatsapp-backend-XXX.onrender.com
   ```

### 4️⃣ Configurar Webhook en Meta

1. Ve a https://developers.facebook.com/apps
2. Tu app → WhatsApp → Configuration
3. Webhook URL: `https://whatsapp-backend-XXX.onrender.com/api/webhook/whatsapp`
4. Verify Token: `whatsapp_verify_token_123`
5. Suscríbete a "messages"

### 5️⃣ Configurar n8n

1. Abre `https://whatsapp-n8n-XXX.onrender.com`
2. Login: admin / tu_password
3. Importa workflow desde `/n8n-workflows/whatsapp-bot.json`
4. Configura credenciales de OpenAI
5. Activa el workflow (switch verde)

---

## 🔑 Variables de Entorno para Backend (Render)

```
NODE_ENV=production
PORT=3000
DATABASE_URL=<INTERNAL_URL_DE_POSTGRES>
JWT_SECRET=<GENERA_UNO_ALEATORIO>
WHATSAPP_API_TOKEN=<TU_TOKEN_DE_META>
WHATSAPP_PHONE_NUMBER_ID=944824135370280
WHATSAPP_WEBHOOK_VERIFY_TOKEN=whatsapp_verify_token_123
N8N_WEBHOOK_URL=https://whatsapp-n8n-XXX.onrender.com/webhook/whatsapp-bot
FRONTEND_URL=https://whatsapp-chat-XXX.vercel.app
CORS_ORIGIN=https://whatsapp-chat-XXX.vercel.app
```

**Generar JWT_SECRET:**
```bash
openssl rand -base64 32
```

---

## 🔑 Variables de Entorno para n8n (Render)

```
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=<TU_PASSWORD_SEGURO>
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://whatsapp-n8n-XXX.onrender.com/
```

---

## 🗄️ Ejecutar Migraciones

Después de desplegar el backend:

```bash
cd backend

# Usa la External Database URL de Render
export DATABASE_URL="postgresql://user:pass@host/db"

npm run migrate
npm run seed  # Opcional
```

---

## ✅ Verificar Despliegue

### Backend
```bash
curl https://whatsapp-backend-XXX.onrender.com/api/health
# Debe responder: {"status":"ok","timestamp":"..."}
```

### Frontend
Abre `https://whatsapp-chat-XXX.vercel.app` en tu navegador

### n8n
Abre `https://whatsapp-n8n-XXX.onrender.com` en tu navegador

### Webhook
Envía un mensaje desde WhatsApp (+57 324 2181400) y verifica que el bot responda

---

## ⚠️ Importante: Plan Gratuito

**Render Free Tier:**
- Los servicios se duermen después de 15 min de inactividad
- El primer request puede tardar 30-60 segundos (cold start)
- PostgreSQL se elimina después de 90 días

**Solución:**
- Usa [UptimeRobot](https://uptimerobot.com) para hacer ping cada 5 minutos
- O upgrade a plan pago ($7/mes por servicio)

---

## 📚 Documentación Completa

Para instrucciones detalladas paso a paso, consulta:
👉 **`DEPLOY_PRODUCTION.md`**

---

## 🆘 Ayuda

Si tienes problemas:
1. Revisa los logs en Render Dashboard
2. Verifica que todas las variables de entorno estén correctas
3. Asegúrate de que el workflow de n8n esté activo (no en modo test)
4. Consulta la sección de Troubleshooting en `DEPLOY_PRODUCTION.md`

---

## 🎉 Resultado Final

Después de completar estos pasos tendrás:

✅ URLs estáticas (sin ngrok)
✅ Backend en Render
✅ Frontend en Vercel
✅ n8n en Render
✅ PostgreSQL en Render
✅ Webhook configurado en Meta
✅ Bot respondiendo automáticamente

**¡Tu plataforma estará en producción!** 🚀

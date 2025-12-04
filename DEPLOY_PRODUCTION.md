# 🚀 Guía de Despliegue en Producción

Esta guía te ayudará a desplegar el proyecto en Render (backend + n8n) y Vercel (frontend) para tener URLs estáticas y eliminar la dependencia de ngrok.

---

## 📋 Requisitos Previos

- Cuenta en [Render](https://render.com) (gratis)
- Cuenta en [Vercel](https://vercel.com) (gratis)
- Cuenta en [GitHub](https://github.com) (para conectar repositorios)
- Token de API de WhatsApp de Meta
- API Key de OpenAI

---

## 🗂️ Estructura de Despliegue

```
┌─────────────────────────────────────────────┐
│                                             │
│  WhatsApp Cloud API (Meta)                 │
│                                             │
└──────────────────┬──────────────────────────┘
                   │
                   │ Webhook POST
                   ▼
┌─────────────────────────────────────────────┐
│  Backend (Render)                           │
│  - Express API                              │
│  - Socket.IO                                │
│  - Webhook Handler                          │
│  URL: https://whatsapp-backend-xxx.onrender.com
└──────────────┬──────────────┬───────────────┘
               │              │
               │              │ HTTP Request
               │              ▼
               │   ┌─────────────────────────┐
               │   │  n8n (Render)           │
               │   │  - Workflow Automation  │
               │   │  - OpenAI Integration   │
               │   │  URL: https://whatsapp-n8n-xxx.onrender.com
               │   └─────────────────────────┘
               │
               │ WebSocket + REST
               ▼
┌─────────────────────────────────────────────┐
│  Frontend (Vercel)                          │
│  - React + Vite                             │
│  - Material UI                              │
│  URL: https://whatsapp-chat-xxx.vercel.app  │
└─────────────────────────────────────────────┘
               ▲
               │
               │ HTTPS
               │
┌─────────────────────────────────────────────┐
│  PostgreSQL (Render)                        │
│  - Managed Database                         │
└─────────────────────────────────────────────┘
```

---

## 🔧 Paso 1: Preparar el Repositorio en GitHub

### 1.1 Crear repositorio (si no existe)

```bash
cd /Users/mac/Documents/WhatsappChatApp/whatsapp-chat-platform
git init
git add .
git commit -m "Initial commit - WhatsApp Chat Platform"
```

### 1.2 Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre: `whatsapp-chat-platform`
3. Visibilidad: Private (recomendado)
4. NO inicialices con README, .gitignore o licencia

### 1.3 Conectar y subir

```bash
git remote add origin https://github.com/TU_USUARIO/whatsapp-chat-platform.git
git branch -M main
git push -u origin main
```

---

## 🗄️ Paso 2: Desplegar PostgreSQL en Render

### 2.1 Crear Base de Datos

1. Ve a https://dashboard.render.com
2. Haz clic en **"New +"** → **"PostgreSQL"**
3. Configura:
   - **Name**: `whatsapp-postgres`
   - **Database**: `whatsapp_db`
   - **User**: `whatsapp_user`
   - **Region**: Oregon (US West)
   - **Plan**: Free
4. Haz clic en **"Create Database"**

### 2.2 Guardar Credenciales

Render te dará:
- **Internal Database URL**: Para conectar desde otros servicios de Render
- **External Database URL**: Para conectar desde fuera de Render

Guarda ambas URLs, las necesitarás.

### 2.3 Ejecutar Migraciones

Una vez desplegado el backend, ejecutarás:

```bash
# Desde tu máquina local, conectándote a la DB de Render
DATABASE_URL="postgresql://..." npm run migrate
```

---

## 🤖 Paso 3: Desplegar n8n en Render

### 3.1 Crear Web Service para n8n

1. En Render Dashboard, haz clic en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Name**: `whatsapp-n8n`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: (dejar vacío)
   - **Environment**: Docker
   - **Dockerfile Path**: `./Dockerfile.n8n`
   - **Plan**: Free

### 3.2 Variables de Entorno para n8n

Agrega estas variables de entorno:

```
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=TU_PASSWORD_SEGURO
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://whatsapp-n8n-XXX.onrender.com/
```

Reemplaza `XXX` con tu URL de Render.

### 3.3 Agregar Disco Persistente

1. En la configuración del servicio, ve a **"Disks"**
2. Haz clic en **"Add Disk"**
3. Configura:
   - **Name**: `n8n-data`
   - **Mount Path**: `/home/node/.n8n`
   - **Size**: 1 GB
4. Guarda

### 3.4 Desplegar

Haz clic en **"Create Web Service"**

Render comenzará a construir y desplegar n8n. Esto puede tomar 5-10 minutos.

---

## 🔙 Paso 4: Desplegar Backend en Render

### 4.1 Crear Web Service para Backend

1. En Render Dashboard, haz clic en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Name**: `whatsapp-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: Docker
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Plan**: Free

### 4.2 Variables de Entorno para Backend

Agrega estas variables de entorno:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=<URL_INTERNA_DE_POSTGRES>
JWT_SECRET=<GENERA_UNO_ALEATORIO>
WHATSAPP_API_TOKEN=<TU_TOKEN_DE_META>
WHATSAPP_PHONE_NUMBER_ID=944824135370280
WHATSAPP_WEBHOOK_VERIFY_TOKEN=whatsapp_verify_token_123
N8N_WEBHOOK_URL=https://whatsapp-n8n-XXX.onrender.com/webhook/whatsapp-bot
FRONTEND_URL=https://whatsapp-chat-XXX.vercel.app
CORS_ORIGIN=https://whatsapp-chat-XXX.vercel.app
```

**Importante:**
- Usa la **Internal Database URL** de PostgreSQL
- Genera un JWT_SECRET seguro: `openssl rand -base64 32`
- Reemplaza las URLs con tus URLs reales de Render y Vercel

### 4.3 Health Check

Render automáticamente usará `/api/health` para verificar que el servicio esté funcionando.

### 4.4 Desplegar

Haz clic en **"Create Web Service"**

---

## 🎨 Paso 5: Desplegar Frontend en Vercel

### 5.1 Importar Proyecto

1. Ve a https://vercel.com/new
2. Importa tu repositorio de GitHub
3. Configura:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 5.2 Variables de Entorno

Agrega estas variables de entorno:

```
VITE_API_URL=https://whatsapp-backend-XXX.onrender.com
VITE_WS_URL=wss://whatsapp-backend-XXX.onrender.com
```

Reemplaza `XXX` con tu URL de Render del backend.

### 5.3 Desplegar

Haz clic en **"Deploy"**

Vercel construirá y desplegará tu frontend en ~2 minutos.

---

## 🔗 Paso 6: Configurar Webhook en Meta

### 6.1 Actualizar URL del Webhook

1. Ve a https://developers.facebook.com/apps
2. Tu app → WhatsApp → **Configuration**
3. En "Webhook", haz clic en **"Edit"**
4. **Callback URL**: `https://whatsapp-backend-XXX.onrender.com/api/webhook/whatsapp`
5. **Verify Token**: `whatsapp_verify_token_123`
6. Haz clic en **"Verify and Save"**

### 6.2 Suscribirse a Eventos

1. En "Webhook fields", marca **"messages"**
2. Guarda los cambios

---

## 🤖 Paso 7: Configurar n8n

### 7.1 Acceder a n8n

1. Ve a `https://whatsapp-n8n-XXX.onrender.com`
2. Inicia sesión con:
   - Usuario: `admin`
   - Contraseña: (la que configuraste)

### 7.2 Importar Workflow

1. En n8n, haz clic en el menú → **"Import from File"**
2. Selecciona `/n8n-workflows/whatsapp-bot.json`
3. Haz clic en **"Import"**

### 7.3 Configurar Credenciales de OpenAI

1. Haz clic en el nodo **"OpenAI GPT"**
2. En "Credential to connect with", crea una nueva credencial
3. Ingresa tu **OpenAI API Key**
4. Guarda

### 7.4 Activar Workflow

1. Asegúrate de que el workflow esté **guardado**
2. Activa el switch en la esquina superior derecha (debe estar verde)
3. **NO** uses el modo "Test" - debe estar en modo producción

---

## 🗄️ Paso 8: Ejecutar Migraciones de Base de Datos

### 8.1 Desde tu máquina local

```bash
cd backend

# Usa la External Database URL de Render
export DATABASE_URL="postgresql://whatsapp_user:PASSWORD@HOST/whatsapp_db"

# Ejecutar migraciones
npm run migrate

# Ejecutar seeds (opcional)
npm run seed
```

---

## ✅ Paso 9: Verificar Despliegue

### 9.1 Verificar Backend

```bash
curl https://whatsapp-backend-XXX.onrender.com/api/health
```

Debería responder:
```json
{"status":"ok","timestamp":"2025-12-04T..."}
```

### 9.2 Verificar n8n

Abre `https://whatsapp-n8n-XXX.onrender.com` en tu navegador.

### 9.3 Verificar Frontend

Abre `https://whatsapp-chat-XXX.vercel.app` en tu navegador.

### 9.4 Probar Webhook

Envía un mensaje desde WhatsApp con el número autorizado y verifica que el bot responda.

---

## 🔄 Paso 10: Configurar Auto-Deploy

### 10.1 Render

Render automáticamente despliega cuando haces push a la rama `main`.

### 10.2 Vercel

Vercel automáticamente despliega cuando haces push a la rama `main`.

Para desplegar manualmente:
```bash
git add .
git commit -m "Update"
git push origin main
```

---

## 📊 Monitoreo y Logs

### Render Logs

1. Ve a tu servicio en Render Dashboard
2. Haz clic en **"Logs"**
3. Verás los logs en tiempo real

### Vercel Logs

1. Ve a tu proyecto en Vercel Dashboard
2. Haz clic en **"Deployments"**
3. Selecciona un deployment → **"View Function Logs"**

---

## ⚠️ Limitaciones del Plan Gratuito

### Render Free Tier

- **Web Services**: Se duermen después de 15 minutos de inactividad
- **Primer request**: Puede tardar 30-60 segundos (cold start)
- **Horas mensuales**: 750 horas/mes por servicio
- **PostgreSQL**: 90 días de retención, luego se elimina

### Vercel Free Tier

- **Bandwidth**: 100 GB/mes
- **Builds**: 6000 minutos/mes
- **Serverless Functions**: 100 GB-Hrs

### Soluciones

1. **Mantener servicios activos**: Usa un servicio como [UptimeRobot](https://uptimerobot.com) para hacer ping cada 5 minutos
2. **Upgrade a plan pago**: Render Starter ($7/mes), Vercel Pro ($20/mes)

---

## 🔒 Seguridad en Producción

### 1. Variables de Entorno

✅ **NUNCA** subas archivos `.env` a GitHub
✅ Usa variables de entorno en Render y Vercel
✅ Genera secretos aleatorios fuertes

### 2. CORS

Asegúrate de que `CORS_ORIGIN` solo permita tu dominio de Vercel.

### 3. Rate Limiting

El backend ya tiene rate limiting configurado (100 requests/15 min).

### 4. HTTPS

Render y Vercel proveen HTTPS automáticamente.

---

## 🐛 Troubleshooting

### Backend no inicia

1. Revisa los logs en Render
2. Verifica que `DATABASE_URL` sea correcta
3. Verifica que las migraciones se ejecutaron

### n8n no responde

1. Verifica que el workflow esté **activo** (no en modo test)
2. Revisa los logs de n8n en Render
3. Verifica las credenciales de OpenAI

### Frontend no se conecta al backend

1. Verifica que `VITE_API_URL` sea correcta
2. Verifica que `CORS_ORIGIN` en el backend incluya tu URL de Vercel
3. Abre la consola del navegador para ver errores

### Webhook no recibe mensajes

1. Verifica que la URL del webhook en Meta sea correcta
2. Verifica que el backend esté corriendo (no dormido)
3. Revisa los logs del backend en Render

---

## 📝 Checklist Final

- [ ] PostgreSQL desplegado en Render
- [ ] n8n desplegado en Render
- [ ] Backend desplegado en Render
- [ ] Frontend desplegado en Vercel
- [ ] Migraciones ejecutadas
- [ ] Workflow de n8n importado y activo
- [ ] Credenciales de OpenAI configuradas en n8n
- [ ] Webhook configurado en Meta
- [ ] Número de WhatsApp autorizado en Meta
- [ ] Prueba enviando un mensaje desde WhatsApp
- [ ] Bot responde correctamente

---

## 🎉 ¡Listo!

Tu plataforma de chat de WhatsApp ahora está desplegada en producción con URLs estáticas. Ya no necesitas ngrok.

**URLs de tu proyecto:**
- Frontend: `https://whatsapp-chat-XXX.vercel.app`
- Backend: `https://whatsapp-backend-XXX.onrender.com`
- n8n: `https://whatsapp-n8n-XXX.onrender.com`

**Próximos pasos:**
1. Configura un dominio personalizado (opcional)
2. Configura monitoreo con UptimeRobot
3. Implementa backups de la base de datos
4. Considera upgrade a planes pagos para mejor rendimiento

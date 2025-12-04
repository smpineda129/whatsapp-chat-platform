# WhatsApp Chat Platform

Plataforma completa de gestión de chats de WhatsApp con bot automatizado (n8n + GPT) y atención humana, incluyendo dashboard de estadísticas en tiempo real.

## 🚀 Características

- **Doble Sistema de Chat:**
  - Bot automatizado con IA (n8n + GPT-4)
  - Atención humana por agentes
  - Transferencia automática bot → humano

- **Roles de Usuario:**
  - Administrador: Acceso completo + dashboard de estadísticas
  - Usuario (Agente): Gestión de conversaciones

- **Dashboard de Estadísticas:**
  - Tiempo promedio de respuesta
  - Duración promedio de conversaciones
  - Ratio bot vs humano
  - Métricas por agente
  - Gráficos en tiempo real

- **Integración WhatsApp Cloud API:**
  - Envío/recepción de mensajes
  - Soporte para multimedia (imágenes, documentos)
  - Estados de mensajes (enviado, entregado, leído)

- **Tiempo Real:**
  - Socket.io para mensajería instantánea
  - Indicadores de escritura
  - Actualizaciones automáticas

## 📋 Requisitos Previos

- Docker y Docker Compose
- Node.js 18+ (para desarrollo local)
- Cuenta de Meta for Developers
- API Key de OpenAI
- PostgreSQL (incluido en Docker)

## 🛠️ Stack Tecnológico

### Backend
- Node.js + TypeScript
- Express.js
- Socket.io
- PostgreSQL
- JWT Authentication

### Frontend
- React 18 + TypeScript
- Vite
- Material UI
- Tailwind CSS
- Zustand (state management)
- Socket.io client

### Infraestructura
- Docker & Docker Compose
- n8n (workflow automation)
- WhatsApp Cloud API
- OpenAI GPT-4

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd whatsapp-chat-platform
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y configura las credenciales:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
# Database
DATABASE_URL=postgresql://whatsapp_user:whatsapp_pass@postgres:5432/whatsapp_db

# JWT
JWT_SECRET=tu-secreto-super-seguro-cambia-esto

# WhatsApp Cloud API (obtener de Meta for Developers)
WHATSAPP_API_TOKEN=tu-token-de-whatsapp
WHATSAPP_PHONE_NUMBER_ID=tu-phone-number-id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=tu-token-de-verificacion

# OpenAI
OPENAI_API_KEY=tu-api-key-de-openai

# n8n
N8N_WEBHOOK_URL=http://n8n:5678/webhook/whatsapp-bot
```

### 3. Configurar WhatsApp Cloud API

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Crea una app y configura WhatsApp Business
3. Obtén tu `WHATSAPP_API_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID`
4. Configura el webhook:
   - URL: `https://tu-dominio.com/api/webhook/whatsapp`
   - Verify Token: El mismo que pusiste en `.env`
   - Suscríbete a eventos: `messages`

### 4. Iniciar con Docker

```bash
# Construir e iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

Servicios disponibles:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- n8n: http://localhost:5678 (usuario: admin, contraseña: admin123)
- PostgreSQL: localhost:5432

### 5. Configurar n8n

1. Accede a http://localhost:5678
2. Inicia sesión con: `admin` / `admin123`
3. Importa el workflow:
   - Menú → Import from File
   - Selecciona `n8n-workflows/whatsapp-bot.json`
4. Configura OpenAI credentials:
   - Agrega credencial de OpenAI con tu API key
5. Activa el workflow

### 6. Inicializar base de datos

```bash
# Acceder al contenedor de backend
docker exec -it whatsapp-backend sh

# Ejecutar migraciones
npm run migrate
```

## 👥 Usuarios de Prueba

Por defecto, la base de datos incluye:

**Administrador:**
- Email: `admin@whatsapp-platform.com`
- Password: `admin123`
- Acceso: Dashboard + Gestión de chats

**Agente:**
- Email: `agent@whatsapp-platform.com`
- Password: `agent123`
- Acceso: Solo gestión de chats

## 🔧 Desarrollo Local

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Conversaciones
- `GET /api/conversations` - Listar conversaciones
- `GET /api/conversations/:id` - Obtener conversación
- `PATCH /api/conversations/:id` - Actualizar conversación
- `POST /api/conversations/:id/transfer` - Transferir a humano

### Mensajes
- `GET /api/messages/:conversationId` - Obtener mensajes
- `POST /api/messages` - Enviar mensaje
- `POST /api/messages/:conversationId/read` - Marcar como leído

### Estadísticas (Admin)
- `GET /api/statistics/overview` - Estadísticas globales
- `GET /api/statistics/agents` - Métricas de agentes
- `GET /api/statistics/conversations/:id` - Métricas de conversación

### Webhooks
- `GET /api/webhook/whatsapp` - Verificación de webhook
- `POST /api/webhook/whatsapp` - Recepción de mensajes

## 🔄 Flujo de Mensajes

1. **Cliente envía mensaje por WhatsApp**
2. WhatsApp Cloud API → Webhook Backend
3. Backend crea/actualiza conversación y mensaje en DB
4. Si es conversación de bot:
   - Backend → n8n webhook
   - n8n → OpenAI GPT (con políticas)
   - GPT genera respuesta
   - n8n → Backend
   - Backend → WhatsApp Cloud API
5. Si requiere humano:
   - Backend cambia tipo a "humano"
   - Notificación en tiempo real a agentes (Socket.io)
   - Agente responde desde plataforma web

## 📊 Políticas del Bot

Las políticas para el bot GPT están en `policies/customer-support.md`. Incluyen:
- Información de la empresa
- Productos y servicios
- FAQs
- Criterios de escalamiento a humano
- Tono y estilo de comunicación

Puedes editar este archivo para personalizar el comportamiento del bot.

## 🐳 Comandos Docker Útiles

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend

# Reiniciar un servicio
docker-compose restart backend

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (¡CUIDADO! Borra la DB)
docker-compose down -v

# Reconstruir contenedores
docker-compose up -d --build
```

## 🔒 Seguridad

- Las contraseñas se hashean con bcrypt (10 rounds)
- JWT para autenticación stateless
- CORS configurado
- Rate limiting en API
- Helmet.js para headers de seguridad
- Variables sensibles en `.env` (nunca en código)

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📝 Notas Importantes

1. **Webhook en Producción:** Necesitas un dominio con HTTPS para que WhatsApp acepte tu webhook
2. **n8n Credentials:** Guarda las credenciales de OpenAI de forma segura
3. **WhatsApp Business:** El número debe estar verificado como WhatsApp Business
4. **Límites de WhatsApp:** Revisa los límites de mensajería de tu tier de WhatsApp Business

## 🚀 Deployment en Producción

### Variables a cambiar:
- `JWT_SECRET`: Genera uno seguro
- `DATABASE_URL`: Usa base de datos en la nube (ej: AWS RDS, DigitalOcean)
- `CORS_ORIGIN`: Tu dominio frontend
- Configura SSL/TLS
- Usa variables de entorno del servidor (no .env file)

### Servicios recomendados:
- **Backend**: Heroku, Railway, DigitalOcean App Platform
- **Frontend**: Vercel, Netlify
- **Database**: AWS RDS, DigitalOcean Managed PostgreSQL
- **n8n**: n8n Cloud o servidor dedicado

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

MIT License

## 📞 Soporte

Para preguntas o issues, abre un issue en GitHub.

---

Hecho con ❤️ usando React + Node.js + n8n + GPT

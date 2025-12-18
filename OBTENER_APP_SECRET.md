# 🔐 Obtener Facebook App Secret

## ❌ Error: "Invalid app:secret_proof provided in the API argument"

Este error aparece cuando intentas generar un **token permanente** en Meta for Developers. Meta requiere el **App Secret** para validar las llamadas a la API de WhatsApp con mayor seguridad.

---

## ✅ Solución: Configurar Facebook App Secret

### 1. Obtener el App Secret de tu Aplicación

1. Ve a **Meta for Developers**: https://developers.facebook.com/apps

2. Selecciona tu aplicación de WhatsApp

3. En el menú lateral izquierdo, haz clic en **App Settings** → **Basic**

4. Busca la sección **App Secret**
   - Verás algo como: `••••••••••••••••••••••••••••••••`
   - Haz clic en **Show** para revelar el secreto
   - **IMPORTANTE**: Necesitarás ingresar tu contraseña de Facebook para verlo

5. Copia el **App Secret** (es una cadena alfanumérica larga)

---

### 2. Agregar el App Secret a tu archivo .env

1. Abre el archivo `.env` en la raíz del proyecto

2. Agrega la siguiente línea (reemplaza con tu App Secret real):
   ```env
   FACEBOOK_APP_SECRET=tu_app_secret_aqui
   ```

3. Guarda el archivo

**Ejemplo de .env completo:**
```env
# WhatsApp Cloud API Configuration
WHATSAPP_API_TOKEN=EAAxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_WEBHOOK_VERIFY_TOKEN=whatsapp_verify_token_123
FACEBOOK_APP_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# Database Configuration
DATABASE_URL=postgresql://whatsapp_user:whatsapp_pass@localhost:5432/whatsapp_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

---

### 3. Reiniciar el Backend

Para que los cambios surtan efecto, reinicia el backend:

```bash
docker-compose restart backend
```

O si prefieres ver los logs:
```bash
docker-compose down
docker-compose up -d
docker-compose logs -f backend
```

---

### 4. Generar el Token Permanente

Ahora que tienes el App Secret configurado, puedes generar el token permanente:

1. Ve a **Meta for Developers**: https://developers.facebook.com/apps

2. Selecciona tu aplicación

3. Ve a **WhatsApp** → **API Setup** (o **Getting Started**)

4. En la sección **System Users**, haz clic en **Create System User** (si no tienes uno)
   - Nombre: `WhatsApp Bot System User`
   - Role: **Admin**

5. Una vez creado el System User:
   - Haz clic en **Generate New Token**
   - Selecciona tu aplicación
   - Marca los permisos:
     - ✅ `whatsapp_business_management`
     - ✅ `whatsapp_business_messaging`
   - Haz clic en **Generate Token**

6. **Copia el token permanente** (este NO expira)

7. Actualiza tu `.env`:
   ```env
   WHATSAPP_API_TOKEN=tu_nuevo_token_permanente_aqui
   ```

8. Reinicia el backend nuevamente:
   ```bash
   docker-compose restart backend
   ```

---

## 🔍 Verificar que Funciona

### Opción 1: Enviar un mensaje de prueba

Envía un mensaje de WhatsApp al número configurado y verifica los logs:

```bash
docker-compose logs -f backend
```

Deberías ver:
```
📨 POST Webhook received from WhatsApp
✅ Received WhatsApp message: ...
```

### Opción 2: Probar el endpoint de envío

Desde tu aplicación frontend o usando curl:

```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_JWT_TOKEN" \
  -d '{
    "to": "521234567890",
    "message": "Hola, este es un mensaje de prueba"
  }'
```

---

## ⚠️ Notas de Seguridad

1. **NUNCA compartas tu App Secret públicamente**
   - No lo subas a GitHub
   - No lo pegues en chats públicos
   - Mantenlo en el archivo `.env` (que está en `.gitignore`)

2. **El App Secret es como una contraseña maestra**
   - Con él, alguien podría generar tokens de acceso para tu app
   - Trátalo con el mismo cuidado que una contraseña

3. **Si crees que tu App Secret fue comprometido:**
   - Ve a **App Settings** → **Basic**
   - Haz clic en **Reset App Secret**
   - Actualiza el nuevo secreto en tu `.env`

---

## 📋 Checklist Completo

- [ ] Obtener App Secret de Meta for Developers
- [ ] Agregar `FACEBOOK_APP_SECRET` al archivo `.env`
- [ ] Reiniciar backend con `docker-compose restart backend`
- [ ] Crear System User en Meta for Developers
- [ ] Generar token permanente con permisos correctos
- [ ] Actualizar `WHATSAPP_API_TOKEN` en `.env`
- [ ] Reiniciar backend nuevamente
- [ ] Enviar mensaje de prueba desde WhatsApp
- [ ] Verificar logs con `docker-compose logs -f backend`
- [ ] Confirmar que el bot responde correctamente

---

## 🎯 ¿Qué hace el App Secret?

El **App Secret** se usa para generar un `appsecret_proof` en cada llamada a la API de WhatsApp. Este proof es un hash HMAC-SHA256 que demuestra que:

1. Tienes acceso al App Secret (solo tú y Meta lo conocen)
2. El token de acceso es legítimo y no ha sido robado
3. La llamada proviene de tu aplicación autorizada

**Fórmula del appsecret_proof:**
```
appsecret_proof = HMAC-SHA256(app_secret, access_token)
```

Esto añade una capa extra de seguridad a las llamadas de la API.

---

## 🐛 Troubleshooting

### Error: "Invalid app:secret_proof provided"
- ✅ Verifica que el `FACEBOOK_APP_SECRET` en `.env` sea correcto
- ✅ Asegúrate de haber reiniciado el backend después de agregar el secreto
- ✅ Confirma que no hay espacios extra al copiar el secreto

### Error: "The access token could not be decrypted"
- ✅ Verifica que el `WHATSAPP_API_TOKEN` sea válido
- ✅ Genera un nuevo token permanente
- ✅ Asegúrate de que el token tenga los permisos correctos

### El token permanente sigue sin generarse
- ✅ Verifica que hayas agregado un método de pago en Meta Business Suite
- ✅ Confirma que tu cuenta de Meta Business esté verificada
- ✅ Asegúrate de que el System User tenga rol de Admin

---

## 📚 Referencias

- [Meta for Developers - App Security](https://developers.facebook.com/docs/graph-api/securing-requests/)
- [WhatsApp Business API - Authentication](https://developers.facebook.com/docs/whatsapp/business-management-api/get-started)
- [System Users - Meta Business](https://business.facebook.com/settings/system-users)

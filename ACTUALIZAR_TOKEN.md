# 🔑 Actualizar Token de WhatsApp

## ❌ Problema Detectado

Tu token de acceso de WhatsApp ha **expirado**.

Error:
```
Error validating access token: Session has expired on Tuesday, 02-Dec-25 23:00:00 PST
```

## ✅ Solución: Generar Nuevo Token

### 1. Ve a Meta for Developers
https://developers.facebook.com/apps

### 2. Selecciona tu App de WhatsApp

### 3. Genera un Nuevo Token de Acceso

**Opción A: Token Temporal (24 horas)**
1. Ve a **WhatsApp > API Setup** o **Getting Started**
2. En la sección "Temporary access token", copia el token
3. Este token expira en 24 horas

**Opción B: Token Permanente (Recomendado)**
1. Ve a **WhatsApp > API Setup**
2. Busca la sección "Access Tokens"
3. Haz clic en "Generate permanent token" o "Create System User"
4. Sigue los pasos para crear un System User
5. Genera un token permanente con los permisos:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`

### 4. Actualiza el Token en tu .env

1. Abre el archivo `.env` en la raíz del proyecto

2. Actualiza la línea:
   ```env
   WHATSAPP_API_TOKEN=TU_NUEVO_TOKEN_AQUI
   ```

3. Guarda el archivo

### 5. Reinicia el Backend

```bash
docker-compose restart backend
```

O si prefieres ver los logs:
```bash
docker-compose up -d backend
docker-compose logs -f backend
```

## 🔍 Verificar que Funciona

Después de actualizar el token, envía un mensaje de WhatsApp y verifica los logs:

```bash
docker-compose logs -f backend
```

Deberías ver:
```
📨 POST Webhook received from WhatsApp
✅ Received WhatsApp message: ...
```

Y el bot debería responder automáticamente.

## ⚠️ Notas Importantes

1. **Token Temporal**: Expira en 24 horas. Útil para pruebas.
2. **Token Permanente**: No expira. Recomendado para producción.
3. **Permisos**: Asegúrate de que el token tenga los permisos correctos.
4. **Seguridad**: Nunca compartas tu token públicamente.

## 📋 Checklist

- [ ] Generar nuevo token en Meta for Developers
- [ ] Actualizar WHATSAPP_API_TOKEN en .env
- [ ] Reiniciar backend con `docker-compose restart backend`
- [ ] Enviar mensaje de prueba desde WhatsApp
- [ ] Verificar logs con `docker-compose logs -f backend`
- [ ] Confirmar que el bot responde

---

## 🎯 Estado Actual

✅ Webhook configurado correctamente
✅ Mensajes llegando al backend
❌ Token de acceso expirado (necesita actualización)

Una vez actualices el token, todo debería funcionar perfectamente.

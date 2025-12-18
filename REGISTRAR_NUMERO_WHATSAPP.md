# 📱 Registrar Número de WhatsApp Business

## 🎯 Objetivo

Registrar tu número de teléfono en WhatsApp Business API usando el PIN de autenticación de dos factores (2FA) para poder enviar mensajes a tus clientes.

## ⚠️ IMPORTANTE: PIN de 2FA vs Regcode

- **PIN de 2FA:** Código de **6 dígitos** que TÚ configuras (ej: `123456`)
- **Regcode:** Código largo de ~200 caracteres que aparece en Meta (NO se usa para registro)

**Para registrar el número necesitas el PIN de 2FA, NO el regcode.**

---

## 📋 Requisitos Previos

1. ✅ Tener un número de teléfono configurado en Meta for Developers
2. ✅ Tener el `WHATSAPP_PHONE_NUMBER_ID` en tu archivo `.env`
3. ✅ Tener un `WHATSAPP_API_TOKEN` válido en tu archivo `.env`
4. ✅ **Haber configurado el PIN de 2FA** (6 dígitos) en WhatsApp Business Manager

**Si no has configurado 2FA, ve primero a:** `CONFIGURAR_2FA_WHATSAPP.md`

---

## 🔑 ¿Qué es el PIN de 2FA?

El **PIN de autenticación de dos factores (2FA)** es un código de **6 dígitos** que TÚ configuras en WhatsApp Business Manager para proteger tu cuenta.

### Características del PIN:
- ✅ **Longitud:** Exactamente 6 dígitos
- ✅ **Formato:** Solo números (0-9)
- ✅ **Ejemplo válido:** `123456`, `987654`
- ❌ **NO es el regcode** (código largo de ~200 caracteres)

### ¿Dónde configurar el PIN?

**Opción 1: WhatsApp Business Manager**
1. Ve a: https://business.facebook.com
2. Business Settings → WhatsApp Accounts → Security
3. Configura "Two-step verification PIN"

**Opción 2: Meta for Developers**
1. Ve a: https://developers.facebook.com/apps
2. Tu App → WhatsApp → API Setup
3. Manage Phone Number → Two-step verification

**Ver guía completa:** `CONFIGURAR_2FA_WHATSAPP.md`

---

## 🚀 Método 1: Usar el Script Automático (Recomendado)

### Paso 1: Dar permisos de ejecución al script

```bash
chmod +x register-phone-number.sh
```

### Paso 2: Ejecutar el script

```bash
./register-phone-number.sh
```

### Paso 3: Ingresar el PIN de 2FA

Cuando el script te lo pida, ingresa tu PIN de 6 dígitos (solo números).

**Ejemplo:**
```
PIN (6 dígitos): 123456
```

### Paso 4: Verificar el resultado

Si todo sale bien, verás:
```
✅ ¡Número registrado exitosamente!
🎉 Tu número de WhatsApp ahora está listo para enviar mensajes
```

---

## 🔧 Método 2: Registro Manual con curl

Si prefieres hacerlo manualmente, usa este comando:

```bash
curl -X POST \
  "https://graph.facebook.com/v18.0/TU_PHONE_NUMBER_ID/register" \
  -H "Authorization: Bearer TU_WHATSAPP_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "pin": "123456"
  }'
```

**Reemplaza:**
- `TU_PHONE_NUMBER_ID` → Tu Phone Number ID (de `.env`)
- `TU_WHATSAPP_API_TOKEN` → Tu token de WhatsApp (de `.env`)
- `123456` → Tu PIN de 2FA de 6 dígitos

---

## 📊 Respuestas Posibles

### ✅ Éxito (HTTP 200)

```json
{
  "success": true
}
```

Tu número está registrado y listo para usar.

### ❌ Error 400 - Código Incorrecto

```json
{
  "error": {
    "message": "Invalid parameter",
    "type": "OAuthException",
    "code": 100
  }
}
```

**Solución:**
- Verifica que el PIN tenga exactamente 6 dígitos
- Verifica que el PIN solo contenga números (0-9)
- Asegúrate de que hayas configurado 2FA en WhatsApp Business Manager
- Ver: `CONFIGURAR_2FA_WHATSAPP.md`

### ❌ Error 401 - Token Inválido

```json
{
  "error": {
    "message": "Invalid OAuth access token",
    "type": "OAuthException",
    "code": 190
  }
}
```

**Solución:**
- Tu token ha expirado
- Genera un nuevo token en Meta for Developers
- Actualiza el `WHATSAPP_API_TOKEN` en tu archivo `.env`
- Ver: `ACTUALIZAR_TOKEN.md`

### ❌ Error 403 - Sin Permisos

```json
{
  "error": {
    "message": "Insufficient permissions",
    "type": "OAuthException",
    "code": 10
  }
}
```

**Solución:**
- Tu token no tiene los permisos necesarios
- Verifica que el token tenga permisos de `whatsapp_business_management`

---

## 🔍 Verificar que el Registro Funcionó

### 1. Verificar en Meta for Developers

1. Ve a Meta for Developers → Tu App → WhatsApp → API Setup
2. En "Nombre para mostrar" debería aparecer:
   - ✅ **Sin el símbolo de advertencia ⚠️**
   - ✅ **Tu nombre de negocio (ej: "GDI")**
   - ✅ **Estado: Aprobado** o **Activo**

### 2. Probar enviando un mensaje

Usa el script de prueba:

```bash
# Desde la carpeta del proyecto
cd backend
node src/test/test-whatsapp-send.js
```

O manualmente:

```bash
curl -X POST \
  "https://graph.facebook.com/v18.0/TU_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "573242181400",
    "type": "text",
    "text": {
      "body": "¡Hola! Este es un mensaje de prueba."
    }
  }'
```

---

## 🐛 Problemas Comunes

### Problema 1: "Param pin must be 6 characters long"

**Causa:** Estás usando el regcode (código largo) en lugar del PIN de 2FA.

**Solución:**
1. El **regcode** es el código largo que aparece en "Nombre para mostrar"
2. El **PIN de 2FA** es el código de 6 dígitos que TÚ configuras
3. Configura el PIN de 2FA: Ver `CONFIGURAR_2FA_WHATSAPP.md`
4. Usa el PIN de 6 dígitos en el script, NO el regcode

### Problema 2: "Token expirado"

**Causa:** Los tokens temporales expiran cada 24 horas.

**Solución:**
1. Genera un nuevo token en Meta for Developers
2. Actualiza el `.env` con el nuevo token
3. Vuelve a ejecutar el script
4. Ver: `ACTUALIZAR_TOKEN.md`

### Problema 3: "Invalid PIN" o "Incorrect PIN"

**Causa:** El PIN que ingresaste no coincide con el configurado.

**Solución:**
1. Ve a WhatsApp Business Manager → Security
2. Restablece el PIN de 2FA
3. Configura un nuevo PIN de 6 dígitos
4. Usa ese nuevo PIN en el script

### Problema 4: "Ya registré el número pero no puedo enviar mensajes"

**Causa:** El registro está completo pero falta configurar el webhook.

**Solución:**
1. Verifica que el webhook esté configurado en Meta
2. Ver: `CONFIGURAR_WEBHOOK_META.md`
3. Suscríbete al campo "messages"
4. Ver: `SUSCRIBIR_WEBHOOK.md`

---

## 📋 Checklist de Verificación

Después de registrar el número, verifica:

- [ ] El código de registro se ejecutó sin errores
- [ ] En Meta, el nombre para mostrar ya no tiene ⚠️
- [ ] Puedes enviar mensajes de prueba con curl
- [ ] El webhook está configurado en Meta
- [ ] El webhook está suscrito a "messages"
- [ ] Los mensajes de prueba llegan al backend

---

## 🎯 Próximos Pasos

Una vez registrado el número:

1. **Configurar el Webhook**
   - Ver: `CONFIGURAR_WEBHOOK_META.md`

2. **Suscribirse a Eventos**
   - Ver: `SUSCRIBIR_WEBHOOK.md`

3. **Probar el Flujo Completo**
   - Ver: `PROBAR_FLUJO_COMPLETO.md`

4. **Desplegar a Producción**
   - Ver: `DEPLOY_PRODUCTION.md`

---

## 📚 Referencias

- [WhatsApp Business API - Register Phone](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/registration)
- [WhatsApp Business API - Account Management](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/account)

---

## 💡 Notas Importantes

- ⚠️ **El PIN de 2FA es de 6 dígitos**, NO el código largo (regcode)
- ⚠️ **Debes configurar 2FA ANTES** de intentar registrar el número
- ⚠️ **No confundas el PIN de 2FA con el verify token** del webhook
- ⚠️ **El token debe tener permisos de** `whatsapp_business_management`
- ⚠️ **En modo desarrollo**, solo puedes enviar mensajes a números autorizados

## 📊 Tabla de Referencia Rápida

| Concepto | Descripción | Longitud | Ejemplo |
|----------|-------------|----------|----------|
| **PIN de 2FA** | Para registrar el número | 6 dígitos | `123456` |
| **Regcode** | Certificado de identidad | ~200 caracteres | `CmAKHAjbv8Hro+...` |
| **Verify Token** | Para webhook | Variable | `whatsapp_verify_token_123` |
| **Access Token** | Para API calls | Variable | `EAAxxxxx...` |

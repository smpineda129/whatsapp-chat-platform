# 🔐 Configurar Autenticación de Dos Factores (2FA) en WhatsApp Business

## 🎯 ¿Por Qué Necesitas 2FA?

Para registrar tu número de WhatsApp Business en la API y poder enviar mensajes, **DEBES** configurar la autenticación de dos factores (2FA) con un PIN de 6 dígitos.

Este PIN es **diferente** del código largo (regcode) que aparece en Meta for Developers.

---

## 📋 Requisitos Previos

- ✅ Tener acceso a **WhatsApp Business Manager** (business.facebook.com)
- ✅ Tener un número de WhatsApp Business configurado
- ✅ Tener permisos de administrador en tu cuenta de negocio

---

## 🚀 Método 1: Configurar 2FA desde WhatsApp Business Manager

### Paso 1: Acceder a Business Settings

1. Ve a: https://business.facebook.com
2. Haz clic en **"Business Settings"** (Configuración empresarial)
3. En el menú lateral izquierdo, busca **"Accounts"** (Cuentas)
4. Haz clic en **"WhatsApp Accounts"** (Cuentas de WhatsApp)

### Paso 2: Seleccionar tu Cuenta de WhatsApp

1. Verás una lista de tus cuentas de WhatsApp
2. Haz clic en la cuenta que deseas configurar
3. Busca la pestaña **"Security"** (Seguridad) o **"Phone Numbers"** (Números de teléfono)

### Paso 3: Configurar el PIN de 2FA

1. Busca la opción **"Two-step verification"** o **"Verificación en dos pasos"**
2. Haz clic en **"Set up PIN"** o **"Configurar PIN"**
3. Ingresa un PIN de **6 dígitos** (solo números)
4. Confirma el PIN ingresándolo nuevamente
5. Guarda los cambios

**⚠️ IMPORTANTE: Guarda este PIN en un lugar seguro. Lo necesitarás para registrar el número.**

---

## 🚀 Método 2: Configurar 2FA desde Meta for Developers

### Paso 1: Acceder a tu App

1. Ve a: https://developers.facebook.com/apps
2. Selecciona tu aplicación de WhatsApp
3. En el menú lateral, haz clic en **"WhatsApp"** → **"API Setup"**

### Paso 2: Configurar 2FA

1. Busca tu número de teléfono en la lista
2. Haz clic en **"Manage"** (Administrar) o el ícono de configuración ⚙️
3. Busca la opción **"Two-step verification PIN"**
4. Ingresa un PIN de **6 dígitos**
5. Confirma el PIN
6. Guarda los cambios

---

## 🔧 Método 3: Configurar 2FA via API

Si prefieres usar la API directamente:

```bash
curl -X POST \
  "https://graph.facebook.com/v18.0/PHONE_NUMBER_ID/register" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "pin": "123456"
  }'
```

**Reemplaza:**
- `PHONE_NUMBER_ID` → Tu Phone Number ID
- `YOUR_ACCESS_TOKEN` → Tu token de acceso
- `123456` → Tu PIN de 6 dígitos

---

## ✅ Verificar que 2FA Está Configurado

### Opción 1: Desde WhatsApp Business Manager

1. Ve a Business Settings → WhatsApp Accounts
2. Selecciona tu cuenta
3. En la sección de seguridad, deberías ver:
   - ✅ **"Two-step verification: Enabled"**
   - ✅ **"PIN configured"**

### Opción 2: Intentar Registrar el Número

Usa el script de registro:

```bash
./register-phone-number.sh
```

Si 2FA está configurado correctamente, el registro será exitoso.

---

## 🔑 Características del PIN de 2FA

- ✅ **Longitud:** Exactamente 6 dígitos
- ✅ **Caracteres:** Solo números (0-9)
- ✅ **Ejemplo válido:** `123456`, `987654`, `000000`
- ❌ **Ejemplo inválido:** `12345` (5 dígitos), `abcdef` (letras), `12 34 56` (espacios)

---

## 🐛 Problemas Comunes

### Problema 1: "Param pin must be 6 characters long"

**Causa:** Estás usando el código largo (regcode) en lugar del PIN de 6 dígitos.

**Solución:**
- El **regcode** es el código largo que aparece en "Nombre para mostrar"
- El **PIN de 2FA** es el código de 6 dígitos que TÚ configuras
- Usa el PIN de 6 dígitos, NO el regcode

### Problema 2: "Invalid PIN"

**Causa:** El PIN que ingresaste no coincide con el configurado.

**Solución:**
1. Ve a WhatsApp Business Manager
2. Restablece el PIN de 2FA
3. Configura un nuevo PIN
4. Usa ese nuevo PIN en el script de registro

### Problema 3: "Two-step verification not enabled"

**Causa:** No has configurado 2FA en tu cuenta.

**Solución:**
1. Sigue los pasos del Método 1 o Método 2
2. Configura un PIN de 6 dígitos
3. Guarda los cambios
4. Espera unos minutos para que se propague
5. Intenta registrar el número nuevamente

### Problema 4: No encuentro la opción de 2FA

**Causa:** Puede estar en diferentes lugares según tu configuración.

**Solución:**
Busca en estos lugares:
- Business Settings → WhatsApp Accounts → Security
- Meta for Developers → WhatsApp → API Setup → Phone Numbers → Manage
- Meta for Developers → WhatsApp → Configuration → Phone Numbers

---

## 📊 Diferencias: Regcode vs PIN de 2FA

| Característica | Regcode | PIN de 2FA |
|----------------|---------|------------|
| **Longitud** | ~200 caracteres | 6 dígitos |
| **Formato** | Alfanumérico (letras + números) | Solo números |
| **Dónde aparece** | Meta for Developers → "Nombre para mostrar" | Lo configuras tú |
| **Para qué sirve** | Certificado de identidad | Registrar el número en la API |
| **Ejemplo** | `CmAKHAjbv8Hro+KaAx...` | `123456` |

---

## 🎯 Próximos Pasos

Una vez configurado el PIN de 2FA:

1. **Registrar el Número**
   ```bash
   ./register-phone-number.sh
   ```

2. **Verificar el Registro**
   - En Meta for Developers, el símbolo ⚠️ debería desaparecer
   - El "Nombre para mostrar" debería mostrar tu nombre de negocio

3. **Configurar el Webhook**
   - Ver: `CONFIGURAR_WEBHOOK_META.md`

4. **Probar el Envío de Mensajes**
   - Ver: `PROBAR_FLUJO_COMPLETO.md`

---

## 💡 Consejos de Seguridad

- 🔒 **Guarda el PIN en un lugar seguro** (gestor de contraseñas)
- 🔒 **No compartas el PIN** con nadie
- 🔒 **Usa un PIN único** que no uses en otros servicios
- 🔒 **Cambia el PIN periódicamente** para mayor seguridad
- 🔒 **No uses PINs obvios** como `000000`, `123456`, `111111`

---

## 📚 Referencias

- [WhatsApp Business API - Two-Step Verification](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/add-a-phone-number#two-step-verification)
- [WhatsApp Business Manager - Security Settings](https://business.facebook.com)
- [WhatsApp Cloud API - Registration](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/registration)

---

## ❓ Preguntas Frecuentes

### ¿Puedo cambiar el PIN después de configurarlo?

Sí, puedes cambiar el PIN en cualquier momento desde WhatsApp Business Manager → Security.

### ¿El PIN expira?

No, el PIN no expira. Sin embargo, es recomendable cambiarlo periódicamente por seguridad.

### ¿Qué pasa si olvido el PIN?

Puedes restablecerlo desde WhatsApp Business Manager → Security → Reset PIN.

### ¿Necesito configurar 2FA para cada número?

Sí, cada número de WhatsApp Business debe tener su propio PIN de 2FA configurado.

### ¿El PIN es el mismo que el código de verificación de WhatsApp?

No, son diferentes:
- **PIN de 2FA:** Lo configuras tú (6 dígitos)
- **Código de verificación:** Te llega por SMS al registrar un número (6 dígitos)
- **Regcode:** Código largo generado por Meta (~200 caracteres)

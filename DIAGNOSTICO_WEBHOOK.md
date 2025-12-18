# 🔍 Diagnóstico: Mensajes de WhatsApp No Llegan al Backend

## 📊 Situación Actual

- ✅ **Pruebas con curl:** Funcionan correctamente
- ✅ **Backend:** Respondiendo y procesando
- ✅ **Meta recibe el mensaje:** Aparece en los logs de Meta
- ❌ **Backend NO recibe mensajes reales:** No aparecen logs en Render

## 🎯 Causa Probable

**Meta NO está reenviando los mensajes al webhook del backend.**

---

## ✅ Soluciones a Verificar

### 1. Verificar Suscripción al Webhook en Meta

Ve a Meta for Developers:

1. Tu app → **WhatsApp** → **Configuration**
2. En la sección **Webhook**:
   - Verifica que esté **suscrito a "messages"** ✅
   - El toggle debe estar **AZUL/ACTIVADO**
3. Haz clic en **"Test"** junto a "messages"
   - Esto enviará un mensaje de prueba
   - Deberías ver logs en Render

### 2. Verificar Campos de Webhook Suscritos

En la misma página de Configuration:

1. Busca la sección **"Webhook fields"** o **"Campos de webhook"**
2. Asegúrate de que esté marcado:
   - ✅ **messages** (DEBE estar marcado)
   - ⚠️ **message_template_status_update** (opcional)
3. Si no está marcado, márcalo y guarda

### 3. Verificar URL del Webhook

Confirma que la URL sea exactamente:
```
https://whatsapp-chat-platform-backend.onrender.com/api/webhook/whatsapp
```

**NO debe tener:**
- Espacios al inicio o final
- Barras adicionales al final
- Caracteres extra

### 4. Probar el Botón "Test" de Meta

1. En Meta for Developers → WhatsApp → Configuration
2. Junto al campo "messages" hay un botón **"Test"**
3. Haz clic en él
4. Meta enviará un mensaje de prueba al webhook
5. **Verifica los logs de Render** - deberías ver:
   ```
   📨 POST Webhook received from WhatsApp
   ```

### 5. Verificar el Verify Token

Asegúrate de que el **Verify Token** en Meta sea exactamente:
```
whatsapp_verify_token_123
```

---

## 🔧 Pasos de Verificación

### Paso 1: Probar el Botón Test de Meta

1. Ve a la configuración del webhook en Meta
2. Haz clic en **"Test"** junto a "messages"
3. **Inmediatamente** ve a los logs de Render
4. ¿Aparece algo? 
   - **SÍ:** El webhook funciona, el problema es otro
   - **NO:** El webhook no está configurado correctamente

### Paso 2: Verificar Suscripciones

Ejecuta este comando para ver qué campos están suscritos:

```bash
curl -X GET "https://graph.facebook.com/v18.0/823070810514558/subscribed_apps?access_token=TU_TOKEN_AQUI"
```

Deberías ver algo como:
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

### Paso 3: Re-suscribir al Webhook

Si no está suscrito, ejecuta:

```bash
curl -X POST "https://graph.facebook.com/v18.0/823070810514558/subscribed_apps" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d "subscribed_fields=messages"
```

---

## 🐛 Problemas Comunes

### Problema 1: Webhook Verificado pero No Suscrito

**Síntoma:** El webhook se verificó correctamente, pero no recibe mensajes.

**Solución:** 
1. Ve a Configuration
2. Busca la sección de suscripciones
3. Marca **"messages"**
4. Guarda

### Problema 2: Token Expirado Durante la Configuración

**Síntoma:** El webhook dejó de funcionar después de un tiempo.

**Solución:**
1. Genera un nuevo token temporal
2. Actualízalo en Render
3. NO necesitas re-verificar el webhook

### Problema 3: Webhook en Modo "Development"

**Síntoma:** Solo funciona con números de prueba específicos.

**Solución:**
- Esto es normal en modo desarrollo
- Solo los números agregados en "Phone numbers" recibirán/enviarán mensajes
- Para producción, necesitas verificar el negocio

---

## 📋 Checklist de Verificación

- [ ] Webhook URL correcta en Meta
- [ ] Verify Token correcto
- [ ] Webhook verificado (check verde)
- [ ] Suscrito al campo "messages" (toggle azul)
- [ ] Botón "Test" de Meta funciona
- [ ] Logs de Render muestran el test
- [ ] Número de prueba agregado correctamente
- [ ] Token de WhatsApp no expirado

---

## 🎯 Siguiente Paso

**Por favor verifica en Meta for Developers:**

1. Ve a tu app → WhatsApp → Configuration
2. Toma una captura de pantalla de la sección **Webhook**
3. Muéstrame si el campo "messages" tiene un **toggle azul activado**
4. Haz clic en **"Test"** y dime si aparecen logs en Render

Esto nos dirá exactamente dónde está el problema.

# 🤖 Solucionar Problema del Bot

## 🔍 Problemas Identificados

### 1. ❌ Número de WhatsApp No Autorizado

**Error:**
```
(#131030) Recipient phone number not in allowed list
```

**Solución:**

1. Ve a https://developers.facebook.com/apps
2. Selecciona tu app de WhatsApp
3. Ve a **WhatsApp > API Setup**
4. En la sección "**To**" o "**Send and receive messages**"
5. Busca "**Add recipient phone number**" o "**Manage phone number list**"
6. Agrega tu número de WhatsApp (con código de país, sin +)
   - Ejemplo: `573001234567` (para Colombia)
7. Verifica el número (te llegará un código por WhatsApp)
8. Guarda los cambios

### 2. ✅ n8n Ya Está Corriendo

n8n se ha levantado correctamente. Ahora necesitas configurar el workflow.

---

## 🔧 Configurar n8n

### 1. Accede a n8n

Abre en tu navegador: http://localhost:5678

**Credenciales:**
- Usuario: `admin`
- Contraseña: `admin123`

### 2. Importar el Workflow

1. En n8n, haz clic en el menú (☰) > **Import from File**
2. Selecciona el archivo: `/n8n-workflows/whatsapp-bot.json`
3. Si no existe, crea un workflow nuevo con estos nodos:

#### Estructura del Workflow:

```
Webhook Trigger → Extract Context → OpenAI GPT → Format Response → Webhook Response
```

#### Configuración de Nodos:

**A. Webhook Trigger**
- Path: `whatsapp-bot`
- HTTP Method: POST
- Response Mode: "Respond to Webhook"

**B. Extract Context (Code Node)**
```javascript
// Extract conversation context
const data = $input.item.json;
const conversationHistory = data.conversationHistory || [];
const lastMessages = conversationHistory.slice(-5).map(msg => 
  `${msg.sender}: ${msg.message}`
).join('\n');

return {
  json: {
    contactName: data.contactName || 'Cliente',
    message: data.message,
    history: lastMessages,
    conversationId: data.conversationId
  }
};
```

**C. OpenAI GPT (Chat Model)**
- Model: `gpt-4` o `gpt-3.5-turbo`
- System Message:
```
Eres un asistente virtual de WhatsApp para atención al cliente. Tu objetivo es:
- Atender al cliente de manera amigable y profesional
- Responder preguntas sobre productos y servicios
- Escalar a humano si el cliente lo solicita o si la consulta es compleja

Usa las políticas de customer-support.md como referencia.

Si detectas que necesitas escalar a humano, responde con:
{"needsHuman": true, "response": "Tu mensaje aquí"}

De lo contrario:
{"needsHuman": false, "response": "Tu mensaje aquí"}
```

- User Message:
```
Conversación previa:
{{ $json.history }}

Nuevo mensaje del cliente:
{{ $json.message }}
```

**D. Format Response (Code Node)**
```javascript
const gptResponse = $input.item.json.message.content;

try {
  // Try to parse as JSON
  const parsed = JSON.parse(gptResponse);
  return {
    json: {
      response: parsed.response,
      needsHuman: parsed.needsHuman || false
    }
  };
} catch {
  // If not JSON, return as plain text
  return {
    json: {
      response: gptResponse,
      needsHuman: false
    }
  };
}
```

**E. Webhook Response**
- Response Code: 200
- Response Body: `{{ $json }}`

### 3. Configurar Credenciales de OpenAI

1. En n8n, ve a **Credentials** (en el menú lateral)
2. Haz clic en **+ Add Credential**
3. Busca "OpenAI"
4. Ingresa tu API Key de OpenAI
5. Guarda

### 4. Activar el Workflow

1. En la esquina superior derecha, activa el switch "**Active**"
2. Verifica que la URL del webhook sea: `http://n8n:5678/webhook/whatsapp-bot`

---

## 🧪 Probar el Sistema

### Opción 1: Prueba con Número Autorizado

1. Agrega tu número en Meta for Developers (ver arriba)
2. Envía un mensaje desde WhatsApp
3. El bot debería responder automáticamente

### Opción 2: Prueba Manual (Sin WhatsApp)

```bash
curl -X POST http://localhost:3000/api/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "8230708105",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "15550000000",
            "phone_number_id": "944824135370280"
          },
          "contacts": [{
            "profile": {
              "name": "Test User"
            },
            "wa_id": "TU_NUMERO_AUTORIZADO"
          }],
          "messages": [{
            "from": "TU_NUMERO_AUTORIZADO",
            "id": "wamid.test123",
            "timestamp": "1733274500",
            "type": "text",
            "text": {
              "body": "Hola"
            }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

Reemplaza `TU_NUMERO_AUTORIZADO` con el número que agregaste en Meta.

---

## 📊 Verificar que Todo Funciona

### 1. Ver logs del backend
```bash
docker-compose logs -f backend
```

Deberías ver:
```
📨 POST Webhook received from WhatsApp
✅ Received WhatsApp message: ...
```

### 2. Ver logs de n8n
```bash
docker-compose logs -f n8n
```

### 3. Verificar en la interfaz web

- Frontend: http://localhost:5173
- Deberías ver la conversación aparecer en tiempo real

---

## ⚠️ Troubleshooting

### Si n8n no responde:
```bash
docker-compose restart n8n
docker-compose logs n8n
```

### Si el bot no responde:
1. Verifica que el workflow esté activo en n8n
2. Verifica que tengas créditos en OpenAI
3. Revisa los logs de n8n para ver errores

### Si WhatsApp no acepta el número:
- El número debe estar en formato internacional sin +
- Ejemplo: `573001234567` (no `+57 300 123 4567`)
- Debe ser un número real de WhatsApp

---

## ✅ Checklist Final

- [ ] n8n corriendo: `docker-compose ps n8n`
- [ ] Workflow importado y activo en n8n
- [ ] Credenciales de OpenAI configuradas
- [ ] Número agregado a lista permitida en Meta
- [ ] Token de WhatsApp actualizado en `.env`
- [ ] Backend corriendo sin errores
- [ ] Enviar mensaje de prueba desde WhatsApp

Una vez completado todo, el bot debería responder automáticamente.

# 🔄 Resetear Conversación a Modo Bot

## 🔍 Problema Detectado

La conversación está marcada como `chat_type: 'human'`, por lo que el bot no responde automáticamente.

**Log:**
```
Message requires human attention
```

## ✅ Solución: Cambiar a Modo Bot

### Opción 1: Ejecutar SQL en Render

1. Ve a https://dashboard.render.com
2. Selecciona **whatsapp-postgres** (tu base de datos)
3. Haz clic en **Connect** → **External Connection**
4. Usa un cliente SQL (como pgAdmin o DBeaver) para conectarte
5. Ejecuta este query:

```sql
UPDATE conversations 
SET chat_type = 'bot' 
WHERE contact_id IN (
  SELECT id FROM contacts WHERE phone_number = '573242181400'
);
```

### Opción 2: Crear Script de Reset

Crea un archivo `reset-conversation.sql`:

```sql
-- Cambiar todas las conversaciones activas a modo bot
UPDATE conversations 
SET chat_type = 'bot' 
WHERE status = 'active';

-- Ver el resultado
SELECT 
  c.id,
  c.phone_number,
  conv.chat_type,
  conv.status
FROM conversations conv
JOIN contacts c ON c.id = conv.contact_id
WHERE conv.status = 'active';
```

### Opción 3: Enviar Mensaje desde Otro Número

Si tienes otro número de prueba disponible, agrégalo en Meta y envía un mensaje desde ese número (creará una nueva conversación en modo bot).

## 🧪 Probar Después del Reset

Una vez cambiada la conversación a modo bot:

1. Envía un mensaje desde WhatsApp
2. El bot debería procesar y responder automáticamente
3. Verifica los logs:
   ```
   ✅ Received WhatsApp message: ...
   📤 Forwarding to n8n...
   ✅ Message sent successfully
   ```

## 📝 Prevenir Este Problema

Para evitar que las conversaciones se queden en modo humano:

1. **No uses palabras clave de escalamiento** en pruebas:
   - "hablar con humano"
   - "hablar con persona"
   - "hablar con agente"
   - "agente"
   - "operador"

2. **Resetea las conversaciones de prueba** periódicamente

3. **Usa diferentes números** para pruebas de bot vs. pruebas de escalamiento

## 🔍 Verificar Estado Actual

Para ver el estado de tus conversaciones, ejecuta:

```sql
SELECT 
  c.phone_number,
  conv.chat_type,
  conv.status,
  conv.started_at,
  conv.last_message_at
FROM conversations conv
JOIN contacts c ON c.id = conv.contact_id
ORDER BY conv.last_message_at DESC
LIMIT 10;
```

---

## 🎯 Próximos Pasos

1. Ejecuta el query SQL para cambiar a modo bot
2. Envía un nuevo mensaje desde WhatsApp
3. El bot debería responder automáticamente

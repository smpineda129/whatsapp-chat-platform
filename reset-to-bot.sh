#!/bin/bash

# Script para cambiar una conversación de "human" a "bot"
PHONE_NUMBER="573242181400"

echo "🔍 Buscando conversación para el número: $PHONE_NUMBER"

# Primero obtenemos el contact_id
CONTACT_QUERY="SELECT id FROM contacts WHERE phone_number = '$PHONE_NUMBER';"
echo "Ejecutando: $CONTACT_QUERY"

# Luego obtenemos la conversación activa
CONVERSATION_QUERY="
SELECT c.id, c.chat_type, c.status, con.phone_number 
FROM conversations c
JOIN contacts con ON c.contact_id = con.id
WHERE con.phone_number = '$PHONE_NUMBER' 
AND c.status = 'active'
ORDER BY c.started_at DESC 
LIMIT 1;
"

echo ""
echo "📋 Conversación encontrada:"
psql $DATABASE_URL -c "$CONVERSATION_QUERY"

echo ""
echo "🔄 Cambiando a modo bot..."

UPDATE_QUERY="
UPDATE conversations 
SET chat_type = 'bot', assigned_to_user_id = NULL
WHERE id IN (
  SELECT c.id 
  FROM conversations c
  JOIN contacts con ON c.contact_id = con.id
  WHERE con.phone_number = '$PHONE_NUMBER' 
  AND c.status = 'active'
)
RETURNING id, chat_type, status;
"

psql $DATABASE_URL -c "$UPDATE_QUERY"

echo ""
echo "✅ Conversación actualizada a modo bot"

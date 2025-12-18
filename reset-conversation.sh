#!/bin/bash

# Script para resetear conversaciones a modo bot
# Uso: ./reset-conversation.sh

echo "🔄 Reseteando conversación a modo bot..."

# Obtener la DATABASE_URL del archivo .env o de las variables de entorno
if [ -f .env ]; then
    export $(cat .env | grep DATABASE_URL | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL no encontrada"
    echo "Por favor, copia la External Database URL de Render y ejecuta:"
    echo "export DATABASE_URL='tu_url_aqui'"
    exit 1
fi

# Ejecutar el query
psql "$DATABASE_URL" << EOF
-- Cambiar conversación a modo bot
UPDATE conversations 
SET chat_type = 'bot' 
WHERE contact_id IN (
  SELECT id FROM contacts WHERE phone_number = '573242181400'
);

-- Mostrar el resultado
SELECT 
  c.phone_number,
  conv.chat_type,
  conv.status,
  conv.last_message_at
FROM conversations conv
JOIN contacts c ON c.id = conv.contact_id
WHERE c.phone_number = '573242181400';
EOF

echo "✅ Conversación reseteada a modo bot"
echo "Ahora puedes enviar un mensaje desde WhatsApp y el bot debería responder"

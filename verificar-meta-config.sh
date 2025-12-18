#!/bin/bash

echo "========================================"
echo "  Verificación de Configuración Meta  "
echo "========================================"
echo ""

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Verificar que tenemos las variables necesarias
if [ -z "$WHATSAPP_API_TOKEN" ]; then
    echo "❌ Error: WHATSAPP_API_TOKEN no está configurado"
    echo "   Por favor, exporta tu token:"
    echo "   export WHATSAPP_API_TOKEN='tu_token_aqui'"
    exit 1
fi

if [ -z "$FACEBOOK_APP_SECRET" ]; then
    echo "⚠️  Advertencia: FACEBOOK_APP_SECRET no está configurado"
    echo "   Algunas verificaciones no estarán disponibles"
fi

echo "📋 Paso 1: Verificar apps suscritas al WABA"
echo "==========================================="
WABA_ID="823070810514558"

SUBSCRIBED_APPS=$(curl -s -X GET "https://graph.facebook.com/v21.0/$WABA_ID/subscribed_apps" \
  -H "Authorization: Bearer $WHATSAPP_API_TOKEN")

echo "$SUBSCRIBED_APPS" | jq '.'

# Extraer APP_ID
APP_ID=$(echo "$SUBSCRIBED_APPS" | jq -r '.data[0].whatsapp_business_api_data.id // empty')

if [ -z "$APP_ID" ]; then
    echo ""
    echo "❌ No se encontró ninguna app suscrita al WABA"
    echo "   Esto significa que Meta no puede enviar webhooks"
    exit 1
fi

echo ""
echo "✅ App ID encontrado: $APP_ID"
echo ""

if [ -n "$FACEBOOK_APP_SECRET" ]; then
    echo "📋 Paso 2: Verificar suscripciones de webhook del App"
    echo "====================================================="
    
    APP_ACCESS_TOKEN="$APP_ID|$FACEBOOK_APP_SECRET"
    
    SUBSCRIPTIONS=$(curl -s "https://graph.facebook.com/v21.0/$APP_ID/subscriptions?access_token=$APP_ACCESS_TOKEN")
    
    echo "$SUBSCRIPTIONS" | jq '.'
    
    # Verificar si 'messages' está en los fields
    HAS_MESSAGES=$(echo "$SUBSCRIPTIONS" | jq -r '.data[] | select(.object=="whatsapp_business_account") | .fields[] | select(. == "messages") // empty')
    
    echo ""
    if [ -n "$HAS_MESSAGES" ]; then
        echo "✅ El campo 'messages' ESTÁ suscrito"
    else
        echo "❌ El campo 'messages' NO está suscrito"
        echo ""
        echo "🔧 Para suscribirlo, ejecuta:"
        echo "   curl -X POST \"https://graph.facebook.com/v21.0/$APP_ID/subscriptions\" \\"
        echo "     -H \"Authorization: Bearer $APP_ACCESS_TOKEN\" \\"
        echo "     -d \"object=whatsapp_business_account\" \\"
        echo "     -d \"callback_url=https://whatsapp-chat-platform-backend.onrender.com/api/webhook/whatsapp\" \\"
        echo "     -d \"fields=messages\" \\"
        echo "     -d \"verify_token=whatsapp_verify_token_123\""
    fi
    
    # Mostrar callback_url configurada
    CALLBACK_URL=$(echo "$SUBSCRIPTIONS" | jq -r '.data[] | select(.object=="whatsapp_business_account") | .callback_url // empty')
    
    echo ""
    echo "📍 Callback URL configurada:"
    echo "   $CALLBACK_URL"
    echo ""
    echo "   Debe ser: https://whatsapp-chat-platform-backend.onrender.com/api/webhook/whatsapp"
    
    if [ "$CALLBACK_URL" != "https://whatsapp-chat-platform-backend.onrender.com/api/webhook/whatsapp" ]; then
        echo ""
        echo "⚠️  LA URL NO COINCIDE - Por eso los mensajes no llegan a Render"
    fi
else
    echo "📋 Paso 2: Verificación manual necesaria"
    echo "========================================"
    echo ""
    echo "Como no tienes FACEBOOK_APP_SECRET configurado, verifica manualmente en:"
    echo "https://developers.facebook.com/apps/$APP_ID/webhooks/"
    echo ""
    echo "Confirma que:"
    echo "1. Callback URL = https://whatsapp-chat-platform-backend.onrender.com/api/webhook/whatsapp"
    echo "2. Verify Token = whatsapp_verify_token_123"
    echo "3. Campo 'messages' está marcado (ON)"
fi

echo ""
echo "========================================"
echo "  Verificación Completada  "
echo "========================================"

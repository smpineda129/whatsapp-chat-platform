#!/bin/bash

# Script para verificar el estado de 2FA y obtener información del número

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Verificar Estado de 2FA y Número    ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Verificar que exista el archivo .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: Archivo .env no encontrado${NC}"
    exit 1
fi

# Cargar variables del .env
source .env

# Verificar variables requeridas
if [ -z "$WHATSAPP_PHONE_NUMBER_ID" ]; then
    echo -e "${RED}❌ Error: WHATSAPP_PHONE_NUMBER_ID no está configurado en .env${NC}"
    exit 1
fi

if [ -z "$WHATSAPP_API_TOKEN" ]; then
    echo -e "${RED}❌ Error: WHATSAPP_API_TOKEN no está configurado en .env${NC}"
    exit 1
fi

echo -e "${YELLOW}📱 Phone Number ID:${NC} $WHATSAPP_PHONE_NUMBER_ID"
echo ""

# Obtener información del número de teléfono
echo -e "${BLUE}🔍 Obteniendo información del número...${NC}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "https://graph.facebook.com/v18.0/$WHATSAPP_PHONE_NUMBER_ID?fields=verified_name,display_phone_number,quality_rating,code_verification_status,is_pin_enabled" \
  -H "Authorization: Bearer $WHATSAPP_API_TOKEN")

# Separar el cuerpo de la respuesta del código HTTP
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
HTTP_BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "${YELLOW}📤 Información del número:${NC}"
echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
echo ""

# Verificar el código de respuesta
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Información obtenida exitosamente${NC}"
    echo ""
    
    # Extraer información relevante
    VERIFIED_NAME=$(echo "$HTTP_BODY" | jq -r '.verified_name // "N/A"' 2>/dev/null)
    DISPLAY_PHONE=$(echo "$HTTP_BODY" | jq -r '.display_phone_number // "N/A"' 2>/dev/null)
    QUALITY=$(echo "$HTTP_BODY" | jq -r '.quality_rating // "N/A"' 2>/dev/null)
    
    echo -e "${YELLOW}📋 Resumen:${NC}"
    echo "   Nombre verificado: $VERIFIED_NAME"
    echo "   Número: $DISPLAY_PHONE"
    echo "   Calidad: $QUALITY"
    echo ""
    
    # Verificar si el número está registrado
    echo -e "${BLUE}🔍 Verificando estado de registro...${NC}"
    echo ""
    
    # Intentar obtener el estado del registro
    REGISTER_CHECK=$(curl -s -w "\n%{http_code}" -X GET \
      "https://graph.facebook.com/v18.0/$WHATSAPP_PHONE_NUMBER_ID" \
      -H "Authorization: Bearer $WHATSAPP_API_TOKEN")
    
    REG_HTTP_CODE=$(echo "$REGISTER_CHECK" | tail -n 1)
    REG_HTTP_BODY=$(echo "$REGISTER_CHECK" | sed '$d')
    
    echo "$REG_HTTP_BODY" | jq '.' 2>/dev/null || echo "$REG_HTTP_BODY"
    echo ""
    
    echo -e "${YELLOW}💡 Próximos pasos:${NC}"
    echo ""
    echo "1. Si el número ya está registrado, puedes intentar enviar mensajes directamente"
    echo "2. Si necesitas registrar el número, prueba con el script: ./register-phone-number.sh"
    echo "3. Si 2FA ya está configurado, usa el PIN que configuraste anteriormente"
    echo ""
    
elif [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${RED}❌ Error 401: Token inválido o expirado${NC}"
    echo "   - Genera un nuevo token en Meta for Developers"
    echo "   - Actualiza el WHATSAPP_API_TOKEN en .env"
else
    echo -e "${RED}❌ Error ${HTTP_CODE}${NC}"
    echo "   Revisa la respuesta del servidor arriba para más detalles"
fi

echo ""
echo -e "${GREEN}========================================${NC}"

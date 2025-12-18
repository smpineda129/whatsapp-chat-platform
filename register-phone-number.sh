#!/bin/bash

# Script para registrar un número de teléfono en WhatsApp Business API
# Basado en: https://developers.facebook.com/docs/whatsapp/on-premises/reference/account#regcode

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  WhatsApp Phone Number Registration  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Verificar que exista el archivo .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: Archivo .env no encontrado${NC}"
    echo "Por favor crea el archivo .env con las variables necesarias"
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

# Solicitar el PIN de 2FA
echo -e "${YELLOW}📋 Ingresa el PIN de 6 dígitos de autenticación de dos factores (2FA):${NC}"
echo "   (El PIN que configuraste en WhatsApp Business Manager)"
echo "   Si no has configurado 2FA, ve a: Business Settings → WhatsApp Accounts → Security"
echo ""
read -p "PIN (6 dígitos): " PIN_2FA

if [ -z "$PIN_2FA" ]; then
    echo -e "${RED}❌ Error: Debes ingresar el PIN de 6 dígitos${NC}"
    exit 1
fi

# Verificar que el PIN tenga 6 dígitos
if [ ${#PIN_2FA} -ne 6 ]; then
    echo -e "${RED}❌ Error: El PIN debe tener exactamente 6 dígitos${NC}"
    echo "   Ingresaste: ${#PIN_2FA} caracteres"
    exit 1
fi

# Verificar que el PIN solo contenga números
if ! [[ "$PIN_2FA" =~ ^[0-9]+$ ]]; then
    echo -e "${RED}❌ Error: El PIN debe contener solo números${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🔄 Registrando número de teléfono...${NC}"
echo ""

# Realizar la petición de registro
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "https://graph.facebook.com/v18.0/$WHATSAPP_PHONE_NUMBER_ID/register" \
  -H "Authorization: Bearer $WHATSAPP_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"messaging_product\": \"whatsapp\",
    \"pin\": \"$PIN_2FA\"
  }")

# Separar el cuerpo de la respuesta del código HTTP (compatible con macOS)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
HTTP_BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "${YELLOW}📤 Respuesta del servidor:${NC}"
echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
echo ""

# Verificar el código de respuesta
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ ¡Número registrado exitosamente!${NC}"
    echo ""
    echo -e "${GREEN}🎉 Tu número de WhatsApp ahora está listo para enviar mensajes${NC}"
    echo ""
    echo -e "${YELLOW}📋 Próximos pasos:${NC}"
    echo "   1. Verifica que el webhook esté configurado en Meta"
    echo "   2. Prueba enviando un mensaje desde WhatsApp"
    echo "   3. Revisa los logs del backend para confirmar que llegan los mensajes"
    echo ""
elif [ "$HTTP_CODE" -eq 400 ]; then
    echo -e "${RED}❌ Error 400: Solicitud incorrecta${NC}"
    echo "   - Verifica que el PIN de 6 dígitos sea correcto"
    echo "   - Asegúrate de que hayas configurado 2FA en WhatsApp Business Manager"
    echo "   - Verifica que el WHATSAPP_PHONE_NUMBER_ID sea válido"
elif [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${RED}❌ Error 401: No autorizado${NC}"
    echo "   - Verifica que el WHATSAPP_API_TOKEN sea válido y no haya expirado"
    echo "   - Genera un nuevo token en Meta for Developers si es necesario"
elif [ "$HTTP_CODE" -eq 403 ]; then
    echo -e "${RED}❌ Error 403: Prohibido${NC}"
    echo "   - Tu token no tiene permisos para registrar este número"
    echo "   - Verifica que tengas los permisos necesarios en Meta"
else
    echo -e "${RED}❌ Error ${HTTP_CODE}: Registro fallido${NC}"
    echo "   Revisa la respuesta del servidor arriba para más detalles"
fi

echo ""
echo -e "${GREEN}========================================${NC}"

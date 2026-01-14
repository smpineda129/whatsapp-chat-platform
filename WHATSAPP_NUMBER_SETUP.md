# Configuración de Números de WhatsApp Duales

Este documento explica cómo configurar y usar el sistema de números de WhatsApp duales (Bot y Humano 100%).

## Resumen

El sistema ahora soporta dos números de WhatsApp:
- **Número Bot**: Para conversaciones automatizadas con el bot
- **Número Humano**: Para atención 100% humana

Los agentes pueden cambiar entre estos números para cada conversación desde la interfaz de chat.

## Configuración Inicial

### 1. Ejecutar la Migración de Base de Datos

Ejecuta la migración para agregar el campo `whatsapp_number_type` a la tabla de conversaciones:

```bash
cd backend
psql -U your_username -d your_database -f migrations/002_add_whatsapp_number_type.sql
```

O si usas un cliente de base de datos, ejecuta el contenido del archivo `migrations/002_add_whatsapp_number_type.sql`.

### 2. Configurar Variables de Entorno

Agrega la siguiente variable de entorno al archivo `.env` en el directorio `backend`:

```env
# Número de WhatsApp para el bot (ya existente)
WHATSAPP_PHONE_NUMBER_ID=tu_numero_bot_id

# Número de WhatsApp para atención humana (NUEVO)
WHATSAPP_HUMAN_PHONE_NUMBER_ID=tu_numero_humano_id
```

**Nota**: Por ahora, puedes usar el mismo número para ambos (`WHATSAPP_PHONE_NUMBER_ID`) hasta que configures el segundo número.

### 3. Reiniciar el Backend

Después de configurar las variables de entorno, reinicia el servidor backend:

```bash
cd backend
npm run dev
```

## Uso del Sistema

### Desde la Interfaz de Agente

1. **Seleccionar una conversación** en la lista de conversaciones
2. En la parte superior de la ventana de chat, verás un selector desplegable **"Número WhatsApp"**
3. Selecciona entre:
   - **Bot (Automático)**: Usa el número configurado para el bot
   - **Humano (100%)**: Usa el número configurado para atención humana

### Comportamiento del Sistema

- **Nuevas conversaciones**: Por defecto, usan el número Bot
- **Cambio de número**: Al cambiar el número, todos los mensajes futuros en esa conversación se enviarán desde el número seleccionado
- **Persistencia**: El número seleccionado se guarda en la base de datos y se mantiene entre sesiones

### Diferencia entre Chat Type y WhatsApp Number Type

- **Chat Type** (Bot/Humano): Controla si el bot responde automáticamente o si requiere respuesta manual del agente
- **WhatsApp Number Type** (Bot/Humano): Controla desde qué número de WhatsApp se envían los mensajes

Puedes tener cualquier combinación:
- Bot activo + Número Bot: Bot responde automáticamente desde el número bot
- Bot activo + Número Humano: Bot responde automáticamente desde el número humano
- Humano + Número Bot: Agente responde manualmente desde el número bot
- Humano + Número Humano: Agente responde manualmente desde el número humano

## API Endpoints

### Cambiar Número de WhatsApp

```http
POST /api/conversations/:id/switch-number
Content-Type: application/json
Authorization: Bearer <token>

{
  "whatsapp_number_type": "bot" | "human"
}
```

**Respuesta:**
```json
{
  "conversation": { ... },
  "message": "WhatsApp number switched to human successfully"
}
```

## Configuración de Meta/Facebook

Para configurar un segundo número de WhatsApp:

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Selecciona tu aplicación
3. Ve a WhatsApp > Getting Started
4. Agrega un nuevo número de teléfono
5. Copia el **Phone Number ID** del nuevo número
6. Actualiza la variable `WHATSAPP_HUMAN_PHONE_NUMBER_ID` en tu `.env`

## Solución de Problemas

### Error: "Missing environment variable: WHATSAPP_HUMAN_PHONE_NUMBER_ID"

**Solución**: Asegúrate de agregar `WHATSAPP_HUMAN_PHONE_NUMBER_ID` a tu archivo `.env`. Si aún no tienes un segundo número, usa el mismo valor que `WHATSAPP_PHONE_NUMBER_ID`.

### Los mensajes no se envían desde el número correcto

**Solución**: 
1. Verifica que el `WHATSAPP_HUMAN_PHONE_NUMBER_ID` esté configurado correctamente
2. Verifica que el número esté activo en tu cuenta de Meta/Facebook
3. Revisa los logs del backend para ver errores de la API de WhatsApp

### El selector no aparece en la interfaz

**Solución**: 
1. Limpia la caché del navegador
2. Recarga la aplicación frontend
3. Verifica que el backend esté actualizado y corriendo

## Notas Importantes

- Ambos números deben estar configurados en la misma cuenta de Meta/Facebook
- Ambos números comparten el mismo `WHATSAPP_API_TOKEN`
- Los webhooks funcionan para ambos números automáticamente
- Por ahora, ambos números usan la misma configuración hasta que configures el segundo número físico

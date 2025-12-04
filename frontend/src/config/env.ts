// Temporary hardcoded configuration for Vercel deployment
// TODO: Replace with environment variables once Vercel issue is resolved

export const config = {
  API_URL: import.meta.env.VITE_API_URL || 'https://whatsapp-chat-platform-backend.onrender.com',
  WS_URL: import.meta.env.VITE_WS_URL || 'wss://whatsapp-chat-platform-backend.onrender.com',
};

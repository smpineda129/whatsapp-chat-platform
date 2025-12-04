import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
    port: number;
    nodeEnv: string;
    databaseUrl: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    whatsappApiToken: string;
    whatsappPhoneNumberId: string;
    whatsappWebhookVerifyToken: string;
    n8nWebhookUrl: string;
    openaiApiKey: string;
    corsOrigin: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
    const value = process.env[key] || defaultValue;
    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
};

export const env: EnvConfig = {
    port: parseInt(getEnvVar('PORT', '3000'), 10),
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
    databaseUrl: getEnvVar('DATABASE_URL'),
    jwtSecret: getEnvVar('JWT_SECRET'),
    jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),
    whatsappApiToken: getEnvVar('WHATSAPP_API_TOKEN', ''),
    whatsappPhoneNumberId: getEnvVar('WHATSAPP_PHONE_NUMBER_ID', ''),
    whatsappWebhookVerifyToken: getEnvVar('WHATSAPP_WEBHOOK_VERIFY_TOKEN', ''),
    n8nWebhookUrl: getEnvVar('N8N_WEBHOOK_URL', ''),
    openaiApiKey: getEnvVar('OPENAI_API_KEY', ''),
    corsOrigin: getEnvVar('CORS_ORIGIN', 'http://localhost:5173'),
};

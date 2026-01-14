-- Add whatsapp_number_type to conversations table
-- This allows tracking which WhatsApp number is being used for each conversation

ALTER TABLE conversations 
ADD COLUMN whatsapp_number_type VARCHAR(20) DEFAULT 'bot' CHECK (whatsapp_number_type IN ('bot', 'human'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_conversations_whatsapp_number_type ON conversations(whatsapp_number_type);

-- Update existing conversations to use 'bot' number type
UPDATE conversations SET whatsapp_number_type = 'bot' WHERE whatsapp_number_type IS NULL;

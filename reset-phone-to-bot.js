const { Pool } = require('pg');

// Obtener DATABASE_URL del entorno o usar valor por defecto local
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://whatsapp_user:whatsapp_pass@localhost:5432/whatsapp_db';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function resetToBot(phoneNumber) {
  const client = await pool.connect();
  
  try {
    console.log(`🔍 Buscando conversación para: ${phoneNumber}`);
    
    // Buscar contacto
    const contactResult = await client.query(
      'SELECT * FROM contacts WHERE phone_number = $1',
      [phoneNumber]
    );
    
    if (contactResult.rows.length === 0) {
      console.log('❌ Contacto no encontrado');
      return;
    }
    
    const contact = contactResult.rows[0];
    console.log('📞 Contacto encontrado:', contact);
    
    // Buscar conversación activa
    const conversationResult = await client.query(
      `SELECT * FROM conversations 
       WHERE contact_id = $1 AND status = 'active'
       ORDER BY started_at DESC LIMIT 1`,
      [contact.id]
    );
    
    if (conversationResult.rows.length === 0) {
      console.log('❌ No hay conversación activa');
      return;
    }
    
    const conversation = conversationResult.rows[0];
    console.log('💬 Conversación actual:', conversation);
    
    // Actualizar a modo bot
    const updateResult = await client.query(
      `UPDATE conversations 
       SET chat_type = 'bot', assigned_to_user_id = NULL
       WHERE id = $1
       RETURNING *`,
      [conversation.id]
    );
    
    console.log('✅ Conversación actualizada a modo bot:', updateResult.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

const phoneNumber = process.argv[2] || '573242181400';
resetToBot(phoneNumber);

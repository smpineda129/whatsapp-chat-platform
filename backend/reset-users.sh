#!/bin/bash

# Load local .env for other variables
export $(cat ../.env | grep -v '^#' | xargs)

# Override DATABASE_URL with production (with SSL)
export DATABASE_URL="postgresql://whatsapp_postgres_50oh_user:CAXwE0dZPEJe82LAioj9E4UXPNsCA7TL@dpg-d4odtlre5dus73c6c6n0-a.oregon-postgres.render.com/whatsapp_postgres_50oh?sslmode=require"

# Delete existing users and re-seed
node -r ts-node/register -e "
const { db } = require('./src/config/database');
const bcrypt = require('bcrypt');

(async () => {
  try {
    // Delete existing users
    await db.query('DELETE FROM users WHERE email IN (\\'admin@whatsapp-platform.com\\', \\'agent@whatsapp-platform.com\\')');
    console.log('✅ Deleted existing users');
    
    // Create admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await db.query(\`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES (\$1, \$2, \$3, \$4)
    \`, ['admin@whatsapp-platform.com', adminPasswordHash, 'Admin User', 'admin']);
    console.log('✅ Admin user created with password: admin123');
    
    // Create agent user
    const agentPasswordHash = await bcrypt.hash('agent123', 10);
    await db.query(\`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES (\$1, \$2, \$3, \$4)
    \`, ['agent@whatsapp-platform.com', agentPasswordHash, 'Agent User', 'user']);
    console.log('✅ Agent user created with password: agent123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
"

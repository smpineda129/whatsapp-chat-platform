import { db } from '../config/database';
import bcrypt from 'bcrypt';

async function resetPasswords() {
    try {
        console.log('🔄 Resetting passwords...');

        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);

        await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'admin@whatsapp-platform.com']);
        console.log('✅ Admin password reset to: admin123');

        const agentPassword = 'agent123';
        const agentHash = await bcrypt.hash(agentPassword, 10);

        await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [agentHash, 'agent@whatsapp-platform.com']);
        console.log('✅ Agent password reset to: agent123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting passwords:', error);
        process.exit(1);
    }
}

resetPasswords();

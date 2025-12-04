import { db } from '../config/database';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await db.query(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@whatsapp-platform.com', adminPasswordHash, 'Admin User', 'admin']);
    console.log('✅ Admin user created');

    // Create agent user
    const agentPasswordHash = await bcrypt.hash('agent123', 10);
    await db.query(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['agent@whatsapp-platform.com', agentPasswordHash, 'Agent User', 'user']);
    console.log('✅ Agent user created');

    // Create sample contacts
    await db.query(`
      INSERT INTO contacts (phone_number, name)
      VALUES 
        ('+573001234567', 'Juan Pérez'),
        ('+573007654321', 'María García'),
        ('+573009876543', 'Carlos Rodríguez')
      ON CONFLICT (phone_number) DO NOTHING
    `);
    console.log('✅ Sample contacts created');

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

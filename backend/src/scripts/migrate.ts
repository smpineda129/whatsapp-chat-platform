import { db } from '../config/database';
import fs from 'fs';
import path from 'path';

async function migrate() {
    try {
        console.log('🔄 Starting database migration...');

        const migrationsDir = path.join(__dirname, '../../migrations');
        const files = fs.readdirSync(migrationsDir).sort();

        for (const file of files) {
            if (file.endsWith('.sql')) {
                console.log(`📄 Executing migration: ${file}`);
                const filePath = path.join(migrationsDir, file);
                const sql = fs.readFileSync(filePath, 'utf-8');

                await db.query(sql);
                console.log(`✅ Migration ${file} completed`);
            }
        }

        console.log('🎉 All migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();

import { db, users } from '../src/lib/server/db';
import { hash } from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedAdmin() {
    console.log('Seeding admin account...');

    const passwordHash = await hash('manus123', 10);

    try {
        await db.insert(users).values({
            username: 'admin',
            passwordHash: passwordHash,
            name: 'Admin User',
            role: 'admin',
            email: 'admin@example.com',
            loginMethod: 'local'
        });
        console.log('Admin account created successfully.');
        console.log('Username: admin');
        console.log('Password: manus123');
    } catch (e) {
        console.error('Failed to create admin:', e);
    }
    process.exit(0);
}

seedAdmin();

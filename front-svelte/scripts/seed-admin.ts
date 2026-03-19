import { db, users } from '../src/lib/server/db';
import { hash } from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedAdmin() {
    const password = process.env.ADMIN_SEED_PASSWORD;
    if (!password) {
        console.error('Error: ADMIN_SEED_PASSWORD environment variable is required');
        process.exit(1);
    }

    console.log('Seeding admin account...');
    const passwordHash = await hash(password, 10);

    try {
        await db.insert(users).values({
            username: 'admin',
            passwordHash: passwordHash,
            name: 'Admin User',
            role: 'admin',
            email: 'admin@example.com',
            loginMethod: 'local'
        });
        console.log('Admin account created successfully. Username: admin');
    } catch (e) {
        console.error('Failed to create admin:', e);
    }
    process.exit(0);
}

seedAdmin();

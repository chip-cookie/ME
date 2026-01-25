import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL not found");
        process.exit(1);
    }

    console.log('Connecting to database...');
    const connection = await mysql.createConnection(connectionString);

    try {
        const username = 'admin';
        // Use argument or default
        const password = process.argv[2] || 'manus123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if admin exists
        const [rows] = await connection.query('SELECT id FROM users WHERE username = ?', [username]);

        if (rows.length > 0) {
            console.log('Admin account already exists.');
            console.log('Resetting password to: ' + password);
            await connection.query('UPDATE users SET passwordHash = ?, role = "admin" WHERE username = ?', [hashedPassword, username]);
        } else {
            console.log('Creating new admin account...');
            // openId is unique, use 'admin-local' or similar
            await connection.query(
                `INSERT INTO users (openId, username, passwordHash, name, role, email, loginMethod) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                ['admin-local-id', username, hashedPassword, 'Admin User', 'admin', 'admin@example.com', 'local']
            );
        }

        console.log('----------------------------------------');
        console.log('✅ Admin Account Ready');
        console.log(`🆔 ID: ${username}`);
        console.log(`🔑 PW: ${password}`);
        console.log('----------------------------------------');

    } catch (e) {
        console.error('Failed to seed admin:', e);
    } finally {
        await connection.end();
    }
}

seedAdmin();

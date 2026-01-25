import mysql from 'mysql2/promise';

async function cleanup() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL not found");
        process.exit(1);
    }

    console.log("Connecting to database...");
    const connection = await mysql.createConnection(connectionString);

    try {
        console.log("Dropping ALL tables to force clean schema sync...");
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // Drop all tables defined in schema.ts
        const tables = [
            'interview_questions',
            'writing_histories',
            'corporate_analyses',
            'experiences',
            'experience_logs',
            'writing_style_profiles',
            'interview_style_profiles',
            'lead_inquiries',
            'insights',
            'client_results',
            'case_studies',
            'services',
            'users',
            // Legacy tables
            'learning_logs',
            'style_updates',
            'writing_sessions',
            'style_profiles',
            'cover_letters',
            'interviews'
        ];

        for (const table of tables) {
            await connection.query(`DROP TABLE IF EXISTS ${table}`);
            console.log(`Dropped ${table}`);
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Cleanup done successfully. Database is now empty.');
    } catch (e) {
        console.error("Cleanup failed:", e);
    } finally {
        await connection.end();
    }
}

cleanup();

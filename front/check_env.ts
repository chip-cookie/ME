import 'dotenv/config';
console.log('Current directory:', process.cwd());
console.log('Environment keys:', Object.keys(process.env).filter(k => k.includes('DB') || k.includes('URL') || k.includes('SQL')));
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);

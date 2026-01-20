import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// In-memory user store for simple local auth (since we're using SQLite/MySQL hybrid, 
// we'll keep it simple with a local JSON-based approach for the demo)
interface LocalUser {
    id: number;
    username: string;
    passwordHash: string;
    name: string;
    role: 'user' | 'admin';
    createdAt: Date;
}

// Simple file-based storage for local users
import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'data', 'local-users.json');

function ensureDataDir() {
    const dataDir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function loadUsers(): LocalUser[] {
    ensureDataDir();
    if (!fs.existsSync(USERS_FILE)) {
        return [];
    }
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function saveUsers(users: LocalUser[]): void {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

/**
 * Ensure admin user exists (for collective intelligence system)
 * This creates the admin account automatically on first load
 */
async function ensureAdminUser(): Promise<void> {
    const users = loadUsers();
    const adminExists = users.some(u => u.username === 'admin');

    if (!adminExists) {
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.hash('0000', SALT_ROUNDS);

        const adminUser: LocalUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            username: 'admin',
            passwordHash,
            name: 'System Admin',
            role: 'admin',
            createdAt: new Date(),
        };

        users.push(adminUser);
        saveUsers(users);
        console.log('[Auth] Admin user created (admin/0000)');
    }
}

// Initialize admin user on module load
ensureAdminUser().catch(console.error);

/**
 * Get admin user ID for collective intelligence storage
 */
export function getAdminUserId(): number {
    const users = loadUsers();
    const admin = users.find(u => u.username === 'admin');
    return admin?.id || 1;
}

/**
 * Register a new local user
 */
export async function registerUser(username: string, password: string, name?: string): Promise<{ success: boolean; error?: string; user?: Omit<LocalUser, 'passwordHash'> }> {
    const users = loadUsers();

    // Check if username already exists
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        return { success: false, error: '이미 존재하는 사용자명입니다.' };
    }

    // Validate username
    if (username.length < 3 || username.length > 20) {
        return { success: false, error: '사용자명은 3-20자 사이여야 합니다.' };
    }

    // Validate password
    if (password.length < 6) {
        return { success: false, error: '비밀번호는 최소 6자 이상이어야 합니다.' };
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser: LocalUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        username: username.toLowerCase(),
        passwordHash,
        name: name || username,
        role: 'user',
        createdAt: new Date(),
    };

    users.push(newUser);
    saveUsers(users);

    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return { success: true, user: userWithoutPassword };
}

/**
 * Login with username and password
 */
export async function loginUser(username: string, password: string): Promise<{ success: boolean; error?: string; user?: Omit<LocalUser, 'passwordHash'> }> {
    const users = loadUsers();

    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
        return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
        return { success: false, error: '비밀번호가 일치하지 않습니다.' };
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
}

/**
 * Get user by ID
 */
export function getUserById(id: number): Omit<LocalUser, 'passwordHash'> | null {
    const users = loadUsers();
    const user = users.find(u => u.id === id);

    if (!user) return null;

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

/**
 * Get user by username
 */
export function getUserByUsername(username: string): Omit<LocalUser, 'passwordHash'> | null {
    const users = loadUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) return null;

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { users } from '../drizzle/schema';
import { getDb } from './db';

const SALT_ROUNDS = 10;

// Define User type based on DB schema
type DbUser = typeof users.$inferSelect;

/**
 * Ensure admin user exists (for collective intelligence system)
 * This creates the admin account automatically on first load if not present in DB
 */
async function ensureAdminUser(): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
        // Check if admin exists
        const [admin] = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);

        if (!admin) {
            const passwordHash = await bcrypt.hash('0000', SALT_ROUNDS);

            await db.insert(users).values({
                username: 'admin',
                password: passwordHash,
                name: 'System Admin',
                role: 'admin',
                openId: 'local:admin', // Special ID for local admin
                loginMethod: 'local',
            });
            console.log('[Auth] Admin user created (admin/0000)');
        }
    } catch (error) {
        console.error('[Auth] Failed to ensure admin user:', error);
    }
}

// Initialize admin user on module load
ensureAdminUser().catch(console.error);

/**
 * Get admin user ID for collective intelligence storage
 */
export async function getAdminUserId(): Promise<number> {
    const db = await getDb();
    if (!db) return 1;

    try {
        const [admin] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
        return admin?.id || 1;
    } catch {
        return 1;
    }
}

/**
 * Register a new local user
 */
export async function registerUser(username: string, password: string, name?: string): Promise<{ success: boolean; error?: string; user?: Omit<DbUser, 'password' | 'openId'> }> {
    const db = await getDb();
    if (!db) return { success: false, error: 'Database unavailable' };

    try {
        // Check if username already exists
        const [existing] = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);

        if (existing) {
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

        // Insert new user
        const [result] = await db.insert(users).values({
            username: username.toLowerCase(),
            password: passwordHash,
            name: name || username,
            role: 'user',
            openId: `local:${username.toLowerCase()}`, // Generate unique openId for local users
            loginMethod: 'local',
        }) as any;

        // Fetch created user to return
        const [newUser] = await db.select().from(users).where(eq(users.id, result.insertId)).limit(1);

        if (!newUser) throw new Error('Failed to retrieve created user');

        const { password: _, openId: __, ...userSafe } = newUser;
        return { success: true, user: userSafe };

    } catch (error) {
        console.error('[Auth] Register failed:', error);
        return { success: false, error: '회원가입 중 오류가 발생했습니다.' };
    }
}

/**
 * Login with username and password
 */
export async function loginUser(username: string, password: string): Promise<{ success: boolean; error?: string; user?: Omit<DbUser, 'password' | 'openId'> }> {
    const db = await getDb();
    if (!db) return { success: false, error: 'Database unavailable' };

    try {
        const [user] = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);

        if (!user || !user.password) {
            return { success: false, error: '사용자를 찾을 수 없습니다.' };
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return { success: false, error: '비밀번호가 일치하지 않습니다.' };
        }

        const { password: _, openId: __, ...userSafe } = user;
        return { success: true, user: userSafe };

    } catch (error) {
        console.error('[Auth] Login failed:', error);
        return { success: false, error: '로그인 처리 중 오류가 발생했습니다.' };
    }
}

/**
 * Get user by ID
 */
export async function getUserById(id: number): Promise<Omit<DbUser, 'password' | 'openId'> | null> {
    const db = await getDb();
    if (!db) return null;

    try {
        const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
        if (!user) return null;

        const { password: _, openId: __, ...userSafe } = user;
        return userSafe;
    } catch {
        return null;
    }
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string): Promise<Omit<DbUser, 'password' | 'openId'> | null> {
    const db = await getDb();
    if (!db) return null;

    try {
        const [user] = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
        if (!user) return null;

        const { password: _, openId: __, ...userSafe } = user;
        return userSafe;
    } catch {
        return null;
    }
}

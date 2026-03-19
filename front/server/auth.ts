import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { users } from '../drizzle/schema';
import { getDb } from './db';

const SALT_ROUNDS = 10;

// Define User type based on DB schema
type DbUser = typeof users.$inferSelect;

/** 어드민 초기화 중복 실행 방지 플래그 */
let adminInitPromise: Promise<void> | null = null;

/**
 * Ensure admin user exists (for collective intelligence system)
 * 중복 실행 방지를 위해 Promise를 캐싱합니다.
 */
async function ensureAdminUser(): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
        // Check if admin exists (안전한 배열 접근)
        const result = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
        const admin = result[0] ?? null;

        if (!admin) {
            // ENV에서 어드민 초기 비밀번호 읽기, 없으면 랜덤 생성
            const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || generateSecurePassword();
            const passwordHash = await bcrypt.hash(initialPassword, SALT_ROUNDS);

            await db.insert(users).values({
                username: 'admin',
                password: passwordHash,
                name: 'System Admin',
                role: 'admin',
                openId: 'local:admin',
                loginMethod: 'local',
            });
            // 비밀번호를 로그에 남기되, ENV로 설정된 경우엔 마스킹
            if (process.env.ADMIN_INITIAL_PASSWORD) {
                console.log('[Auth] Admin user created. Password set via ADMIN_INITIAL_PASSWORD env.');
            } else {
                console.log(`[Auth] Admin user created. Initial password: ${initialPassword} (set ADMIN_INITIAL_PASSWORD env to control this)`);
            }
        }
    } catch (error) {
        console.error('[Auth] Failed to ensure admin user:', error);
    }
}

/** 영숫자 8자리 랜덤 비밀번호 생성 */
function generateSecurePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Initialize admin user on module load - 중복 실행 방지
adminInitPromise = ensureAdminUser().catch(console.error).then(() => { adminInitPromise = null; });

/**
 * Get admin user ID for collective intelligence storage
 */
export async function getAdminUserId(): Promise<number> {
    const db = await getDb();
    if (!db) return 1;

    try {
        const result = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).limit(1);
        return result[0]?.id ?? 1;
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
        const existingResult = await db.select({ id: users.id }).from(users).where(eq(users.username, username.toLowerCase())).limit(1);
        const existing = existingResult[0] ?? null;

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
        const insertResult = await db.insert(users).values({
            username: username.toLowerCase(),
            password: passwordHash,
            name: name || username,
            role: 'user',
            openId: `local:${username.toLowerCase()}`,
            loginMethod: 'local',
        });

        // Fetch created user to return (insertId가 없는 드라이버를 위해 username으로 조회)
        const newUserResult = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
        const newUser = newUserResult[0] ?? null;

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
        const loginResult = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
        const user = loginResult[0] ?? null;

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
        const userByIdResult = await db.select().from(users).where(eq(users.id, id)).limit(1);
        const user = userByIdResult[0] ?? null;
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
        const userByNameResult = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
        const user = userByNameResult[0] ?? null;
        if (!user) return null;

        const { password: _, openId: __, ...userSafe } = user;
        return userSafe;
    } catch {
        return null;
    }
}

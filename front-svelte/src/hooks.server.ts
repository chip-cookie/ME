import type { Handle } from '@sveltejs/kit';
import { getUserById } from '$lib/server/db';

export const handle: Handle = async ({ event, resolve }) => {
    const userIdCookie = event.cookies.get('jasos_user_id');
    if (userIdCookie) {
        try {
            const userId = parseInt(userIdCookie, 10);
            if (!isNaN(userId)) {
                const user = await getUserById(userId);
                if (user) {
                    // Remove sensitive data if any (though schema type has passwordHash, we might want to omit it)
                    const { passwordHash, ...safeUser } = user;
                    event.locals.user = user; // keeping full user object for internal use, but be careful sending to client
                }
            }
        } catch (e) {
            // If DB schema is mismatched or user not found, just ignore and let them re-login
            // console.warn("Auth hook error (likely stale cookie or schema mismatch):", e);
            event.cookies.delete('jasos_user_id', { path: '/' });
        }
    }
    return resolve(event);
};

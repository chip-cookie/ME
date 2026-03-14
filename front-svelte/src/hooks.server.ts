import type { Handle } from '@sveltejs/kit';
import { getUserById } from '$lib/server/db';

import { createTRPCHandle } from 'trpc-sveltekit';
import { sequence } from '@sveltejs/kit/hooks';
import { appRouter } from '$lib/server/trpc/router';
import { createContext } from '$lib/server/trpc/context';

export const authHandle: Handle = async ({ event, resolve }) => {
    const userIdCookie = event.cookies.get('jasos_user_id');
    if (userIdCookie) {
        try {
            const userId = parseInt(userIdCookie, 10);
            if (!isNaN(userId)) {
                const user = await getUserById(userId);
                if (user) {
                    const { passwordHash, ...safeUser } = user;
                    event.locals.user = user;
                }
            }
        } catch (e) {
            event.cookies.delete('jasos_user_id', { path: '/' });
        }
    }
    return resolve(event);
};

export const trpcHandle = createTRPCHandle({ router: appRouter, createContext });

export const handle = sequence(authHandle, trpcHandle);

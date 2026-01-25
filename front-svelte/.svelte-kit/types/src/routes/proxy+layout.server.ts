// @ts-nocheck
import type { LayoutServerLoad } from './$types';

export const load = async ({ locals }: Parameters<LayoutServerLoad>[0]) => {
    // Expose user to the client-side layout
    // Be careful not to expose passwordHash
    if (locals.user) {
        const { passwordHash, ...safeUser } = locals.user;
        return {
            user: safeUser
        };
    }
    return {
        user: undefined
    };
};

import { createTRPCHandle } from 'trpc-sveltekit';
import { appRouter } from '$lib/server/trpc/router';
import { createContext } from '$lib/server/trpc/context';

export const GET = createTRPCHandle({ router: appRouter, createContext });
export const POST = createTRPCHandle({ router: appRouter, createContext });

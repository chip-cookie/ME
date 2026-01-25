
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/trpc" | "/api/trpc/[trpc]" | "/dashboard" | "/dashboard/experience" | "/dashboard/experience/new" | "/login" | "/register" | "/writing";
		RouteParams(): {
			"/api/trpc/[trpc]": { trpc: string }
		};
		LayoutParams(): {
			"/": { trpc?: string };
			"/api": { trpc?: string };
			"/api/trpc": { trpc?: string };
			"/api/trpc/[trpc]": { trpc: string };
			"/dashboard": Record<string, never>;
			"/dashboard/experience": Record<string, never>;
			"/dashboard/experience/new": Record<string, never>;
			"/login": Record<string, never>;
			"/register": Record<string, never>;
			"/writing": Record<string, never>
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/trpc" | "/api/trpc/" | `/api/trpc/${string}` & {} | `/api/trpc/${string}/` & {} | "/dashboard" | "/dashboard/" | "/dashboard/experience" | "/dashboard/experience/" | "/dashboard/experience/new" | "/dashboard/experience/new/" | "/login" | "/login/" | "/register" | "/register/" | "/writing" | "/writing/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}
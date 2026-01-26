
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
		RouteId(): "/" | "/analysis" | "/api" | "/api/trpc" | "/api/trpc/[trpc]" | "/blog" | "/blog/[slug]" | "/case-studies" | "/contact" | "/corporate" | "/dashboard" | "/dashboard/experience" | "/dashboard/experience/new" | "/history" | "/insights" | "/interview" | "/learning" | "/login" | "/my" | "/register" | "/results" | "/sentiment" | "/services" | "/writing";
		RouteParams(): {
			"/api/trpc/[trpc]": { trpc: string };
			"/blog/[slug]": { slug: string }
		};
		LayoutParams(): {
			"/": { trpc?: string; slug?: string };
			"/analysis": Record<string, never>;
			"/api": { trpc?: string };
			"/api/trpc": { trpc?: string };
			"/api/trpc/[trpc]": { trpc: string };
			"/blog": { slug?: string };
			"/blog/[slug]": { slug: string };
			"/case-studies": Record<string, never>;
			"/contact": Record<string, never>;
			"/corporate": Record<string, never>;
			"/dashboard": Record<string, never>;
			"/dashboard/experience": Record<string, never>;
			"/dashboard/experience/new": Record<string, never>;
			"/history": Record<string, never>;
			"/insights": Record<string, never>;
			"/interview": Record<string, never>;
			"/learning": Record<string, never>;
			"/login": Record<string, never>;
			"/my": Record<string, never>;
			"/register": Record<string, never>;
			"/results": Record<string, never>;
			"/sentiment": Record<string, never>;
			"/services": Record<string, never>;
			"/writing": Record<string, never>
		};
		Pathname(): "/" | "/analysis" | "/analysis/" | "/api" | "/api/" | "/api/trpc" | "/api/trpc/" | `/api/trpc/${string}` & {} | `/api/trpc/${string}/` & {} | "/blog" | "/blog/" | `/blog/${string}` & {} | `/blog/${string}/` & {} | "/case-studies" | "/case-studies/" | "/contact" | "/contact/" | "/corporate" | "/corporate/" | "/dashboard" | "/dashboard/" | "/dashboard/experience" | "/dashboard/experience/" | "/dashboard/experience/new" | "/dashboard/experience/new/" | "/history" | "/history/" | "/insights" | "/insights/" | "/interview" | "/interview/" | "/learning" | "/learning/" | "/login" | "/login/" | "/my" | "/my/" | "/register" | "/register/" | "/results" | "/results/" | "/sentiment" | "/sentiment/" | "/services" | "/services/" | "/writing" | "/writing/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}
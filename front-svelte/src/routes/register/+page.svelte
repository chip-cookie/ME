<script lang="ts">
    import { trpc } from '$lib/trpc';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    
    let username = $state('');
    let password = $state('');
    let confirmPassword = $state('');
    let name = $state('');
    let error = $state('');
    let loading = $state(false);

    async function handleRegister(e: Event) {
        e.preventDefault();
        error = '';
        loading = true;

        if (password !== confirmPassword) {
            error = 'Passwords do not match';
            loading = false;
            return;
        }

        try {
            await trpc($page).auth.register.mutate({ 
                username, 
                password,
                name: name || undefined
            });
            // Force reload to update session state in layout
            window.location.href = '/';
        } catch (e: any) {
            console.error(e);
            error = e.message || 'Registration failed';
        } finally {
            loading = false;
        }
    }
</script>

<div class="min-h flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
        <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Create your account
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600">
                Or <a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500">sign in to your existing account</a>
            </p>
        </div>
        <form class="mt-8 space-y-6" onsubmit={handleRegister}>
            <div class="rounded-md shadow-sm -space-y-px">
                <div>
                    <label for="username" class="sr-only">Username</label>
                    <input id="username" name="username" type="text" required class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Username" bind:value={username} />
                </div>
                <div>
                    <label for="name" class="sr-only">Display Name (Optional)</label>
                    <input id="name" name="name" type="text" class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Display Name (Optional)" bind:value={name} />
                </div>
                <div>
                    <label for="password" class="sr-only">Password</label>
                    <input id="password" name="password" type="password" required class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Password" bind:value={password} />
                </div>
                <div>
                    <label for="confirm-password" class="sr-only">Confirm Password</label>
                    <input id="confirm-password" name="confirm-password" type="password" required class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Confirm Password" bind:value={confirmPassword} />
                </div>
            </div>

            {#if error}
                <div class="text-red-500 text-sm text-center">{error}</div>
            {/if}

            <div>
                <button type="submit" disabled={loading} class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                    {#if loading}
                        Processing...
                    {:else}
                        Sign up
                    {/if}
                </button>
            </div>
        </form>
    </div>
</div>

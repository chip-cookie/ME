import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [sveltekit(), tailwindcss()],
    server: {
        proxy: {
            '/api': {
                target: process.env.VITE_API_URL || 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false
            }
        }
    }
});

import { defineConfig } from 'vite';
import tailwind from '@tailwindcss/vite';
export default defineConfig({
    plugins: [tailwind()],
    server: {
        port: Number(process.env.POSEIDON_CLIENT_PORT ?? 5173),
        proxy: { '/api': process.env.POSEIDON_API_URL ?? 'http://127.0.0.1:3000' },
    },
});

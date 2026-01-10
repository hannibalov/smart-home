import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'happy-dom',
        setupFiles: ['./src/test/setup.ts'],
        globals: true,
        pool: 'forks',
        testTimeout: 10000,
        server: {
            deps: {
                inline: [
                    '@abandonware/noble',
                ],
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(process.cwd(), './src'),
        },
        conditions: ['node', 'import', 'default'],
    },
    optimizeDeps: {
        exclude: ['@abandonware/noble'],
        include: ['@exodus/bytes', 'html-encoding-sniffer'],
    },
    ssr: {
        noExternal: ['@abandonware/noble'],
    },
});

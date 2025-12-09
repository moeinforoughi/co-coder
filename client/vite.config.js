import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            },
            '/socket.io': {
                target: 'http://localhost:3000',
                ws: true
            }
        }
    },
    optimizeDeps: {
        exclude: ['pyodide']
    },
    build: {
        rollupOptions: {
            external: [
                // Pyodide tries to import these Node.js modules
                // but they're not needed in browser builds
                'node-fetch',
                'path',
                'fs',
                'crypto',
                'stream',
                'util',
                'url',
                'zlib',
                'http',
                'https',
                'buffer'
            ],
            output: {
                manualChunks: {
                    'pyodide': ['pyodide']
                }
            }
        },
        commonjsOptions: {
            ignoreDynamicRequires: true
        }
    }
})

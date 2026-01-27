import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5175,
        open: true
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
                    'vendor-postprocessing': ['postprocessing', '@react-three/postprocessing'],
                }
            }
        }
    }
})

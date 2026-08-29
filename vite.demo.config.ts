// Build de la DEMO: un solo HTML autocontenido con Firebase reemplazado por
// shims locales (src/demo/*). Uso: npm run build:demo → dist-demo/demo.html
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      'firebase/app': resolve(__dirname, 'src/demo/app-shim.ts'),
      'firebase/auth': resolve(__dirname, 'src/demo/auth-shim.ts'),
      'firebase/firestore': resolve(__dirname, 'src/demo/firestore-shim.ts'),
    },
  },
  build: {
    outDir: 'dist-demo',
    rollupOptions: { input: resolve(__dirname, 'demo.html') },
  },
})

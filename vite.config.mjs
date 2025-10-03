import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker';
import { plugin as markdown, Mode } from 'vite-plugin-markdown';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    checker({ typescript: true, }),
    markdown({ mode: [Mode.MARKDOWN] }),
  ],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['fsevents'],
  },
})

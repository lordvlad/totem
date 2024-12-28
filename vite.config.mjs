import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import Markdown from '@pity/vite-plugin-react-markdown'
import checker from 'vite-plugin-checker';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    checker({ typescript: true, }),
    Markdown()
  ]
})

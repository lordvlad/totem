import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import Markdown from '@pity/vite-plugin-react-markdown'
import checker from 'vite-plugin-checker';

export default defineConfig({
  plugins: [
    preact(),
    checker({ typescript: true, }),
    Markdown()
  ]
})

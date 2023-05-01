import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import Markdown from '@pity/vite-plugin-react-markdown'

export default defineConfig({
  plugins: [
    preact(),
    Markdown()
  ]
})

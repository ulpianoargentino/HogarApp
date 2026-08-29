// Genera los íconos PWA desde public/favicon.svg
import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const svg = readFileSync('public/favicon.svg')

// Íconos normales: el SVG ya trae el fondo redondeado
await sharp(svg).resize(192, 192).png().toFile('public/icons/icon-192.png')
await sharp(svg).resize(512, 512).png().toFile('public/icons/icon-512.png')

// apple-touch-icon: 180x180 con fondo opaco (iOS aplica su propia máscara)
await sharp(svg).resize(180, 180).flatten({ background: '#2563eb' }).png()
  .toFile('public/icons/apple-touch-icon.png')

// maskable: el contenido en el 70% central sobre fondo pleno
const inner = await sharp(svg).resize(358, 358).png().toBuffer()
await sharp({
  create: { width: 512, height: 512, channels: 4, background: '#2563eb' },
})
  .composite([{ input: inner, left: 77, top: 77 }])
  .png()
  .toFile('public/icons/icon-512-maskable.png')

console.log('íconos generados')

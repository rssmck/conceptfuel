// Icon generator — uses sharp (SVG → PNG)
// Run: node scripts/generate-icons.mjs

import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../public/icons')
mkdirSync(OUT, { recursive: true })

// Black background, white "CA" with subtle "concept//" wordmark beneath
function makeSvg(size, maskable) {
  const r = maskable ? 0 : Math.round(size * 0.2)   // rounded corners (standard only)
  const fs  = Math.round(size * 0.38)                // "CA" font size
  const sub = Math.round(size * 0.092)               // wordmark font size
  const cy  = size * 0.48                            // CA vertical centre (slightly above mid)
  const sy  = size * 0.835                           // wordmark vertical position
  const ls  = size * 0.04                            // CA letter spacing
  const lsS = size * 0.02                            // wordmark letter spacing

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0a0a0a" rx="${r}"/>
  <text
    x="${size / 2}" y="${cy}"
    text-anchor="middle" dominant-baseline="middle"
    fill="#f0f0f0"
    font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
    font-size="${fs}" font-weight="700"
    letter-spacing="${ls}"
  >CA</text>
  <text
    x="${size / 2}" y="${sy}"
    text-anchor="middle" dominant-baseline="middle"
    fill="#f0f0f0"
    font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
    font-size="${sub}" font-weight="400"
    letter-spacing="${lsS}"
    opacity="0.45"
  >concept//</text>
</svg>`
}

const configs = [
  { name: 'icon-192.png',          size: 192, maskable: false },
  { name: 'icon-512.png',          size: 512, maskable: false },
  { name: 'icon-maskable-192.png', size: 192, maskable: true  },
  { name: 'icon-maskable-512.png', size: 512, maskable: true  },
]

for (const { name, size, maskable } of configs) {
  const svg = Buffer.from(makeSvg(size, maskable))
  await sharp(svg).png().toFile(resolve(OUT, name))
  console.log(`Generated ${name}`)
}

console.log('Icons done.')

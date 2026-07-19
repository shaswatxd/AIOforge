import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const svg = readFileSync(join(here, 'icon-source.svg'))
const siteAssets = join(here, '..', 'site', 'assets')
mkdirSync(siteAssets, { recursive: true })

async function render(size, outPath) {
  const buf = await sharp(svg, { density: 384 }).resize(size, size).png().toBuffer()
  writeFileSync(outPath, buf)
  return buf
}

const sizes = [16, 32, 48, 64, 128, 256, 512]
const buffers = {}
for (const size of sizes) {
  buffers[size] = await render(size, join(here, `icon-${size}.png`))
}

// Windows .ico (multi-resolution)
const icoBuf = await pngToIco([
  join(here, 'icon-16.png'),
  join(here, 'icon-32.png'),
  join(here, 'icon-48.png'),
  join(here, 'icon-256.png')
])
writeFileSync(join(here, 'icon.ico'), icoBuf)

// Site favicon + touch icon
writeFileSync(join(siteAssets, 'favicon.png'), buffers[32])
writeFileSync(join(siteAssets, 'favicon.ico'), await pngToIco([join(here, 'icon-16.png'), join(here, 'icon-32.png')]))
writeFileSync(join(siteAssets, 'apple-touch-icon.png'), await sharp(svg, { density: 384 }).resize(180, 180).png().toBuffer())
writeFileSync(join(siteAssets, 'icon-512.png'), buffers[512])

console.log('Icons generated: build/icon.ico + site/assets/*')

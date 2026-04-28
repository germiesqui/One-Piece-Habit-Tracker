#!/usr/bin/env node
/**
 * Grand Line Chronicles — Icon Generator
 *
 * Generates PNG icons for PWA from favicon.svg.
 * Run once after cloning: node scripts/generate-icons.mjs
 *
 * Requires: sharp
 *   pnpm add -D sharp   (or npm install -D sharp)
 */

import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = join(__dirname, '../public/favicon.svg')
const outDir  = join(__dirname, '../public/icons')

mkdirSync(outDir, { recursive: true })

const svgBuffer = readFileSync(svgPath)

const icons = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  // iOS splash screens (parchment background + centred icon)
  { name: 'splash-1170x2532.png', width: 1170, height: 2532, iconSize: 256 },
  { name: 'splash-1125x2436.png', width: 1125, height: 2436, iconSize: 256 },
  { name: 'splash-828x1792.png',  width: 828,  height: 1792, iconSize: 200 },
]

for (const icon of icons) {
  if (icon.size) {
    // Simple square icon
    await sharp(svgBuffer)
      .resize(icon.size, icon.size)
      .png()
      .toFile(join(outDir, icon.name))
    console.log(`✓ ${icon.name}`)
  } else {
    // Splash screen: parchment background + centred icon
    const bg = await sharp({
      create: {
        width: icon.width,
        height: icon.height,
        channels: 3,
        background: { r: 249, g: 241, b: 220 }, // parchment-100
      }
    }).png().toBuffer()

    const iconBuf = await sharp(svgBuffer)
      .resize(icon.iconSize, icon.iconSize)
      .png()
      .toBuffer()

    await sharp(bg)
      .composite([{
        input: iconBuf,
        gravity: 'center',
      }])
      .toFile(join(outDir, icon.name))
    console.log(`✓ ${icon.name}`)
  }
}

console.log('\nAll icons generated in public/icons/')

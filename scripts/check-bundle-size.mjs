import fs from 'node:fs'
import path from 'node:path'

const distAssetsDir = path.resolve('dist', 'assets')
const maxChunkBytes = Number(process.env.BUNDLE_MAX_CHUNK_BYTES || 300000)

if (!fs.existsSync(distAssetsDir)) {
  console.error('Bundle check failed: dist/assets not found. Run `npm run build` first.')
  process.exit(1)
}

const jsFiles = fs
  .readdirSync(distAssetsDir)
  .filter((file) => file.endsWith('.js'))
  .map((file) => {
    const filePath = path.join(distAssetsDir, file)
    const size = fs.statSync(filePath).size
    return { file, size }
  })
  .sort((a, b) => b.size - a.size)

if (jsFiles.length === 0) {
  console.error('Bundle check failed: no JS assets found in dist/assets.')
  process.exit(1)
}

const largest = jsFiles[0]

console.log(`Largest JS chunk: ${largest.file} (${largest.size} bytes)`)
console.log(`Allowed max chunk: ${maxChunkBytes} bytes`)

if (largest.size > maxChunkBytes) {
  console.error('Bundle size budget exceeded.')
  process.exit(1)
}

console.log('Bundle size budget check passed.')

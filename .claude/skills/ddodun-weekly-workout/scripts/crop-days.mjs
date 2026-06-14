#!/usr/bin/env node
// crop-days.mjs <combined-weekly-image> [--cols 5] [--labels MON,TUE,WED,THU,FRI]
//                                       [--overlap 45] [--scale 2] [--out <dir>]
//
// The coach posts ONE image with N side-by-side day columns (MON…FRI). Reading the whole
// image downsamples each column badly (a ~1400px-wide sheet → ~280px per day). This splits it
// into per-day column crops (full height, equal width + overlap so nothing is clipped) and
// upscales them, so each day can be Read individually at much higher fidelity for transcription
// and for the per-day cross-check. Requires ImageMagick (`magick`).
//
// Prints one absolute crop path per line (LABEL\tPATH). Read each before transcribing that day.

import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { join, basename, extname } from 'node:path'
import { tmpdir } from 'node:os'

const args = process.argv.slice(2)
const src = args.find(a => !a.startsWith('--'))
if (!src) { console.error('usage: crop-days.mjs <combined-image> [--cols N] [--labels A,B,…] [--overlap px] [--scale x] [--out dir]'); process.exit(2) }
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def }
const cols = +opt('--cols', 5)
const labels = opt('--labels', 'MON,TUE,WED,THU,FRI').split(',')
const overlap = +opt('--overlap', 45)
const scale = +opt('--scale', 2)
const outDir = opt('--out', join(tmpdir(), 'ddodun-crops', basename(src, extname(src))))

try { execFileSync('magick', ['-version'], { stdio: 'ignore' }) }
catch { console.error('ImageMagick not found. Install: brew install imagemagick'); process.exit(1) }

const [W, H] = execFileSync('magick', ['identify', '-format', '%w %h', src], { encoding: 'utf8' }).trim().split(' ').map(Number)
const colW = W / cols

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

for (let i = 0; i < cols; i++) {
  const x0 = Math.max(0, Math.round(i * colW - overlap))
  const x1 = Math.min(W, Math.round((i + 1) * colW + overlap))
  const w = x1 - x0
  const label = labels[i] || `col${i + 1}`
  const out = join(outDir, `${String(i + 1).padStart(2, '0')}_${label}.png`)
  execFileSync('magick', [src, '-crop', `${w}x${H}+${x0}+0`, '+repage',
    '-resize', `${scale * 100}%`, '-filter', 'Lanczos', out])
  console.log(`${label}\t${out}`)
}
console.error(`\n${cols} crops in ${outDir} (${W}x${H} → ~${Math.round(colW * scale)}px wide each). Read each one before transcribing.`)

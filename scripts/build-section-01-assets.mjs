/**
 * Exports section 1's web assets from the revised source artwork.
 *
 * Source of truth is `project-info/per-asset-revision/Amplop Undangan`, the set Nahla sent
 * with the feedback revision (ANDEV-51). Those files are @4x exports of a 1280 x 2772
 * artboard, so an asset's intrinsic size divided by 4 is its size in stage units — the
 * numbers in `src/sections/CoverSection.tsx` are the intrinsic sizes, unchanged by whatever
 * scale this script writes.
 *
 * Outputs are downscaled to `EXPORT_SCALE` (2x stage units), which is still oversampled on
 * every realistic screen: the artboard renders about 430 CSS px wide on a phone, so one
 * stage unit is ~1 device pixel even at DPR 3.
 *
 * Needs ImageMagick 7 (`magick`) with webp support on PATH. Outputs are committed, so a
 * normal build does not need it.
 *
 *   node scripts/build-section-01-assets.mjs
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const SOURCE = 'project-info/per-asset-revision/Amplop Undangan'
const OUT = 'public/assets/section-01'

/** Fraction of the @4x source to write, i.e. 2x the artboard's stage units. */
const EXPORT_SCALE = 0.5

/**
 * `asset` is the source file number (`Amplop Undangan - <n>.png`).
 *
 * `crop` is an ImageMagick geometry in source pixels, used only where one source file holds
 * two independently-placed pieces: asset 5 carries both foliage clusters on one 4219 x 3441
 * canvas with ~1580 empty columns between them, and cropping them apart keeps each layer's
 * decode cost proportional to what it actually draws.
 *
 * `quality` — flat-colour type/rule artwork is written lossless so its edges stay crisp;
 * the shaded, photographic-ish artwork is lossy, where 90 is visually indistinguishable at
 * a fraction of the bytes.
 */
const EXPORTS = [
  { asset: 9, name: 'envelope', quality: 90 },
  { asset: 8, name: 'card', quality: 100 },
  { asset: 1, name: 'wax-seal', quality: 90 },
  { asset: 5, name: 'foliage-tl', crop: '1226x1212+51+29', quality: 90 },
  { asset: 5, name: 'foliage-br', crop: '1303x1219+2863+2189', quality: 90 },
  { asset: 6, name: 'floral-tl', quality: 90 },
  { asset: 7, name: 'floral-br', quality: 90 },
  { asset: 3, name: 'salutation', quality: 100 },
  { asset: 2, name: 'open-button', quality: 100 },
]

mkdirSync(OUT, { recursive: true })

for (const { asset, name, crop, quality } of EXPORTS) {
  const src = `${SOURCE}/Amplop Undangan - ${asset}.png`
  const dest = `${OUT}/${name}.webp`
  execFileSync('magick', [
    src,
    ...(crop ? ['-crop', crop, '+repage'] : []),
    '-filter', 'Lanczos',
    '-resize', `${EXPORT_SCALE * 100}%`,
    '-quality', String(quality),
    '-define', 'webp:method=6',
    dest,
  ])
  const info = execFileSync('magick', [dest, '-format', '%wx%h', 'info:']).toString()
  console.log(`${name.padEnd(12)} <- asset ${String(asset).padEnd(2)} ${info}`)
}

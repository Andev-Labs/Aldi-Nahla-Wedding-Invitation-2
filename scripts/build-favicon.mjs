/**
 * Builds the site icons in `public/` from the couple's monogram.
 *
 * The source is `RSVP - 2.png` from Nahla's revision set (ANDEV-52) — the gold "AN" ligature,
 * drawn on transparency at 2810 x 1327. Everything a browser wants an icon for is square, so
 * the mark is fitted to a square of the invitation's own ground (`--color-green-900`) rather
 * than left transparent: a tab strip is white in one theme and near-black in the other, and
 * gold hairlines on either would be a smudge. On its own ground it is the same mark in both.
 *
 * Each size is rendered from the source rather than downscaled from one master, so the 16px
 * favicon gets the filter applied to the full-resolution art instead of to an already-blurred
 * 512px copy.
 *
 * Needs ImageMagick 7 (`magick`) on PATH. Outputs are committed, so a normal build does not
 * need it.
 *
 *   node scripts/build-favicon.mjs
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const SRC = 'project-info/per-asset-revision/RSVP/RSVP - 2.png'
const OUT = 'public'

/** The invitation's ground — `--color-green-900` in `src/styles/app.css`. */
const GROUND = '#061a17'

/**
 * Fraction of the tile left empty around the mark.
 *
 * The favicon is nearly edge to edge: it is drawn at 16px in a tab, where every pixel of the
 * mark's height is one it cannot spare. The touch icon is inset much further because iOS masks
 * it to a rounded square and Android to a circle — neither crops the corners of the tile, but
 * both crop close enough to them that a mark reaching the edge looks clipped.
 */
const MARGIN = { favicon: 0.05, touch: 0.14 }

/** The ICO carries all three sizes a desktop browser asks for: tab, bookmark bar, shortcut. */
const ICO_SIZES = [16, 32, 48]

/** Apple's current recommended size; smaller devices downscale it. */
const TOUCH_SIZE = 180

/**
 * Gamma applied to the mark's alpha after the downscale, for the sizes small enough that the
 * downscale is destructive.
 *
 * The monogram is mostly hairline: a swash that is 8 source pixels wide lands on a twentieth of
 * a pixel at 16px, so the resize spreads it as near-transparent coverage and the mark greys out
 * into the ground. Raising the alpha to a power below 1 pushes that partial coverage back up
 * towards opaque — the strokes stay exactly where the resize put them, they just read as gold
 * again instead of as a smudge. Sharpening was tried first and is the wrong tool: it breaks the
 * same hairlines into a dotted line rather than recovering them.
 */
const SMALL_ALPHA_GAMMA = 0.6

const tmp = mkdtempSync(join(tmpdir(), 'favicon-'))

/** Writes one square icon: the mark resized to fit the tile's inner box, centred on the ground. */
function icon(path, size, margin, alphaGamma = 1) {
  const inner = Math.round(size * (1 - 2 * margin))
  execFileSync('magick', [
    SRC,
    '-resize',
    `${inner}x${inner}`,
    '+repage',
    ...(alphaGamma === 1 ? [] : ['-channel', 'A', '-evaluate', 'pow', String(alphaGamma), '+channel']),
    '-background',
    GROUND,
    '-gravity',
    'center',
    '-extent',
    `${size}x${size}`,
    '-alpha',
    'remove',
    '-alpha',
    'off',
    '-strip',
    path,
  ])
  return path
}

const icoFrames = ICO_SIZES.map((size) =>
  icon(join(tmp, `ico-${size}.png`), size, MARGIN.favicon, SMALL_ALPHA_GAMMA),
)
execFileSync('magick', [...icoFrames, `${OUT}/favicon.ico`])
console.log(`✓ ${OUT}/favicon.ico (${ICO_SIZES.join(', ')})`)

icon(`${OUT}/apple-touch-icon.png`, TOUCH_SIZE, MARGIN.touch)
console.log(`✓ ${OUT}/apple-touch-icon.png (${TOUCH_SIZE})`)

rmSync(tmp, { recursive: true, force: true })

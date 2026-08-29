/**
 * Exports a section's web assets from Nahla's revised source artwork.
 *
 * Source of truth is `project-info/per-asset-revision/<Page Name>`, the set she sent with the
 * feedback revision (ANDEV-51). Those files are @4x exports of a 1280 x 2772 artboard, so an
 * asset's intrinsic size divided by 4 is its size in stage units — the numbers in the section
 * components are the intrinsic sizes (after `crop`, where there is one), unchanged by whatever
 * scale this script writes.
 *
 * Outputs are downscaled to `EXPORT_SCALE` (2x stage units), which is still oversampled on
 * every realistic screen: the artboard renders about 430 CSS px wide on a phone, so one stage
 * unit is ~1 device pixel even at DPR 3.
 *
 * Needs ImageMagick 7 (`magick`) with webp support on PATH. Outputs are committed, so a normal
 * build does not need it.
 *
 *   node scripts/build-revised-assets.mjs            # every migrated section
 *   node scripts/build-revised-assets.mjs 02         # just this one
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'

/** Fraction of the @4x source to write, i.e. 2x the artboard's stage units. */
const EXPORT_SCALE = 0.5

/**
 * `asset` is the source file number (`<Page Name> - <n>.png`).
 *
 * `crop` is an ImageMagick geometry in source pixels, used where one source file holds several
 * independently-placed pieces — the page's whole type block arrives as one PNG, as do both
 * curtains and both halves of the starburst — and cropping them apart is what lets each be
 * positioned on its own and keeps every layer's decode cost proportional to what it draws.
 *
 * `quality` — flat-colour type and line artwork is written lossless so its edges stay crisp;
 * the shaded, photographic-ish artwork is lossy, where 90 is visually indistinguishable at a
 * fraction of the bytes. (On the flattest artwork lossless is also the *smaller* of the two:
 * section 4's starburst is 368 kB lossless against 415 kB at quality 90.)
 *
 * `scale` overrides `EXPORT_SCALE` for the rare asset where the default's headroom is not worth
 * its bytes — see section 4's starburst, the only one so far.
 */
const SECTIONS = {
  '01': {
    source: 'Amplop Undangan',
    out: 'public/assets/section-01',
    exports: [
      { asset: 9, name: 'envelope', quality: 90 },
      { asset: 8, name: 'card', quality: 100 },
      { asset: 1, name: 'wax-seal', quality: 90 },
      { asset: 5, name: 'foliage-tl', crop: '1226x1212+51+29', quality: 90 },
      { asset: 5, name: 'foliage-br', crop: '1303x1219+2863+2189', quality: 90 },
      { asset: 6, name: 'floral-tl', quality: 90 },
      { asset: 7, name: 'floral-br', quality: 90 },
      { asset: 3, name: 'salutation', quality: 100 },
      { asset: 2, name: 'open-button', quality: 100 },
    ],
  },
  '02': {
    source: 'Nama Panggilan',
    out: 'public/assets/section-02',
    exports: [
      // Asset 2 carries both curtains on one canvas with ~330 stage units of empty space
      // between them; each is placed against its own edge of the artboard.
      { asset: 2, name: 'curtain-left', crop: '1920x5384+0+467', quality: 90 },
      { asset: 2, name: 'curtain-right', crop: '1902x5384+3218+465', quality: 90 },
      { asset: 1, name: 'valance', crop: '5188x663+2+2', quality: 90 },
      { asset: 4, name: 'bouquet', crop: '4623x4063+14+18', quality: 90 },
      // Asset 5's two starbursts are exact mirrors of each other, so only the left half is
      // written; `HeroSection` flips it for the right. See the note there.
      { asset: 5, name: 'starburst', crop: '4052x4074+0+0', quality: 100 },
      // Asset 3 is the whole type block — eyebrow, names and date — in one export.
      { asset: 3, name: 'eyebrow', crop: '1065x91+999+0', quality: 100 },
      { asset: 3, name: 'names', crop: '3215x2044+0+475', quality: 100 },
      { asset: 3, name: 'date', crop: '2191x133+436+2867', quality: 100 },
    ],
  },
  '03': {
    source: 'Doa',
    out: 'public/assets/section-03',
    exports: [
      // Asset 2 carries both curtains on one canvas, ~870 stage units apart; unlike section 2's
      // pair these are not the same width, so each is cropped to its own bounds.
      { asset: 2, name: 'curtain-left', crop: '1734x11118+301+290', quality: 90 },
      { asset: 2, name: 'curtain-right', crop: '1602x11118+5504+290', quality: 90 },
      // Asset 1 carries both floral columns. They are near-mirrors but not exact ones (0.45%
      // mean per-pixel against the flipped other, against 0.16% for section 4's, which do
      // ship as one file), so both are written.
      { asset: 1, name: 'floral-col-left', crop: '1841x9452+12+5', quality: 90 },
      { asset: 1, name: 'floral-col-right', crop: '1843x9452+4312+5', quality: 90 },
      { asset: 7, name: 'top-flower', crop: '4623x1095+247+0', quality: 90 },
      { asset: 3, name: 'monogram', quality: 100 },
      /*
       * Assets 4 and 6 are the same quote card, with and without the quote set on it: 6 is the
       * two gold trims over an empty middle, 4 adds the type. So the trims come from 6 (rows
       * 0-158 and 3101-3260, the only ink it has) and the type from 4, cropped to the band
       * between them — which keeps the page's one animated element separable from its frame
       * without cutting the type out of the frame by hand.
       */
      { asset: 6, name: 'trim-top', crop: '2464x159+0+0', quality: 100 },
      { asset: 6, name: 'trim-bottom', crop: '2464x160+0+3101', quality: 100 },
      { asset: 4, name: 'quote', crop: '2264x2388+87+440', quality: 100 },
    ],
  },
  '04': {
    source: 'Nama Panjang',
    out: 'public/assets/section-04',
    exports: [
      /*
       * Asset 10 is the faint cream starburst pair, and at the default scale it is a 13 MP,
       * 759 kB export of a texture nothing can see the detail of. Its two bursts are not
       * mirrors of each other (they sit on a diagonal), so unlike section 2's it ships whole —
       * at 1x stage units, which is already ~1 device pixel per unit at DPR 3.
       */
      { asset: 10, name: 'starburst', quality: 100, scale: 0.25 },
      // Asset 1 is the top trim and both curtains on one canvas — the trim spans the full page
      // width across the curtain tops, so there is no seam to cut them apart on.
      { asset: 1, name: 'curtains', quality: 90 },
      // Asset 2's two floral columns are exact mirrors, so only the left ships and
      // `CoupleSection` flips it for the right.
      { asset: 2, name: 'floral-column', crop: '3046x5861+0+0', quality: 90 },
      { asset: 12, name: 'trim-bottom', quality: 100 },
      { asset: 3, name: 'bismillah', quality: 100 },
      { asset: 4, name: 'invitation', quality: 100 },
      { asset: 5, name: 'name-nahla', quality: 100 },
      { asset: 6, name: 'parents-nahla', quality: 100 },
      { asset: 7, name: 'dengan', quality: 100 },
      { asset: 8, name: 'name-aldi', quality: 100 },
      { asset: 9, name: 'parents-aldi', quality: 100 },
    ],
  },
  '05': {
    source: 'Tanggal Waktu',
    out: 'public/assets/section-05',
    exports: [
      { asset: 2, name: 'top-garland', quality: 90 },
      // Asset 1 is the cream card and the house on one canvas, already composited — the old
      // page kept them apart only because `per-asset/` exported them apart.
      { asset: 1, name: 'card', quality: 90 },
      { asset: 3, name: 'date', quality: 100 },
      { asset: 4, name: 'divider', quality: 100 },
      { asset: 5, name: 'resepsi-time', quality: 100 },
    ],
    legacy: [
      /*
       * Not in the revised set, so these are the *old* page's exports rescaled to sit on the
       * revised artboard — see the note in `ScheduleSection`. `size` is what Nahla's export
       * would have been: the old @4x size times the factor the revised artwork itself
       * establishes. Replace each with a real `Tanggal Waktu - <n>.png` as it arrives.
       *
       * Type scales by 1.2018 — the date, divider and resepsi exports are all that multiple of
       * their old counterparts, agreeing to 0.1%, so the two missing type blocks take it too.
       */
      { asset: 42, name: 'lead-in', size: '2084x154', quality: 100 },
      { asset: 44, name: 'akad-time', size: '2320x695', quality: 100 },
      /*
       * The foliage has no such factor to borrow — the revised garland grew by 1.30 and the
       * card by 1.07/1.11 — so the bottom pair is scaled by the artboard's width ratio
       * (1280/1080), which is what holds its size against the page.
       */
      { asset: 47, name: 'bottom-foliage-left', size: '3071x4659', quality: 90 },
      { asset: 48, name: 'bottom-foliage-right', size: '3066x4660', quality: 90 },
    ],
  },
}

const wanted = process.argv.slice(2)
for (const [id, section] of Object.entries(SECTIONS)) {
  if (wanted.length && !wanted.includes(id)) continue
  mkdirSync(section.out, { recursive: true })
  for (const { asset, name, crop, quality, scale = EXPORT_SCALE } of section.exports) {
    const src = `project-info/per-asset-revision/${section.source}/${section.source} - ${asset}.png`
    const dest = `${section.out}/${name}.webp`
    execFileSync('magick', [
      src,
      ...(crop ? ['-crop', crop, '+repage'] : []),
      '-filter', 'Lanczos',
      '-resize', `${scale * 100}%`,
      '-quality', String(quality),
      '-define', 'webp:method=6',
      dest,
    ])
    const info = execFileSync('magick', [dest, '-format', '%wx%h', 'info:']).toString()
    console.log(`${id} ${name.padEnd(22)} <- asset ${String(asset).padEnd(2)} ${info}`)
  }
  /*
   * Stand-ins for revised exports that have not arrived: the old page's `per-asset/` file,
   * resized to the @4x size its revised counterpart would have had. `size` is given rather
   * than a factor so the output is exact and the section can state an intrinsic size that is
   * really the file's, the same as for every other layer.
   */
  for (const { asset, name, size, quality } of section.legacy ?? []) {
    const [w, h] = size.split('x').map(Number)
    const dest = `${section.out}/${name}.webp`
    execFileSync('magick', [
      `project-info/per-asset/Asset ${asset}@4x.png`,
      '-filter', 'Lanczos',
      '-resize', `${w * EXPORT_SCALE}x${h * EXPORT_SCALE}!`,
      '-quality', String(quality),
      '-define', 'webp:method=6',
      dest,
    ])
    const info = execFileSync('magick', [dest, '-format', '%wx%h', 'info:']).toString()
    console.log(`${id} ${name.padEnd(22)} <- LEGACY asset ${String(asset).padEnd(2)} ${info}`)
  }
}

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
 * `asset` is the source file number (`<Page Name> - <n>.png`); `file` replaces that with a
 * literal filename, for the occasional export Nahla sends under a descriptive name instead of
 * a number.
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
    ],
  },
  '06': {
    source: 'Tempat',
    out: 'public/assets/section-06',
    exports: [
      /*
       * Asset 3 is the same card-and-house artwork as section 5's asset 1 (they differ by 3e-5
       * mean per-pixel, i.e. re-encoding only). It is exported again here rather than shared
       * across sections: the identical file living under one section's folder is what forced two
       * rounds of moves already, and 300 kB is the cheaper side of that trade.
       */
      { asset: 3, name: 'card', quality: 90 },
      { asset: 2, name: 'venue', quality: 100 },
    ],
  },
  '07': {
    source: 'RSVP',
    out: 'public/assets/section-07',
    exports: [
      // Asset 8 is the curtains on an artboard-sized canvas, so it needs no placing at all —
      // only its empty lower third cropped off.
      { asset: 8, name: 'curtains', crop: '5120x9291+0+0', quality: 90 },
      { asset: 3, name: 'thanks', quality: 100 },
      { asset: 4, name: 'rsvp-button', quality: 100 },
      { asset: 5, name: 'livestream-button', quality: 100 },
      // Assets 2 and 6 are the same monogram, byte for byte; 2 is the one used.
      { asset: 2, name: 'monogram', quality: 100 },
      /*
       * Asset 1's lower band — the foot of this page's flower frame. It is the one band on
       * sections 2-7 that is not half of a seam: nothing follows the closing page, so it has
       * no opposite number to join up with and stays a plain artboard layer.
       */
      { asset: 1, name: 'bottom-foliage', crop: '5993x4025+947+7063', quality: 90 },
    ],
  },
}

/**
 * The flower artwork that straddles a section boundary, from
 * `project-info/per-asset-revision/Sambungan` (ANDEV-55).
 *
 * Nahla's page exports draw each of these clusters twice — once as the foot of the page above
 * and once as the head of the page below — and the two halves only line up when both pages are
 * drawn whole. On a phone they are not: `fit="fill"` crops each page's top and bottom to reach
 * the screen's width, so the upper page loses the bottom of its half and the lower page the top
 * of its own, and the cluster arrives on screen with a slice missing out of its middle. That is
 * the break in the report.
 *
 * So the seam artwork is now one drawing per boundary rather than two, cut here at the row the
 * two pages meet on and hung off the *screen* edge at each end (see `StageSeam`). Cutting it in
 * the build rather than shipping the whole image to both pages is what keeps a page's decode
 * cost the same as it was — each side still gets only the half it can show.
 *
 * `ink` is the drawing's bounding box in the source PNG, `split` the row inside that box where
 * the boundary falls: everything above it belongs to `above`'s page, everything below to
 * `below`'s. Both halves are cut at the ink's full width so they stay a matched pair — each is
 * centred on the artboard, and cropping them to their own tighter bounds would give them
 * different centres to be centred on.
 *
 * ## Why each half's filename carries its crop height
 *
 * These are the only assets in the project whose *shape* has changed under a URL that was
 * already live, and doing that once was enough to break the page for everyone who had opened
 * the invitation before (ANDEV-55 follow-up). Vite fingerprints the JS and CSS, so a returning
 * guest always gets the new layout; nothing fingerprints a file in `public/`, so the browser is
 * free to keep serving the old bytes for `bouquet.webp`. The new layout sizes that image by
 * `aspect-ratio` from the height declared in the section, so an old, taller half gets squashed
 * to fit — the whole cluster crushed onto the page above, and its tail drawn a second time on
 * the page below. Two flowers where the artwork has one.
 *
 * Putting the crop height in the name makes that impossible rather than merely unlikely: the
 * height *is* the layout contract — it is what the section declares and what `aspect-ratio`
 * resolves — so any change to it renames the file and no cache can pair new geometry with old
 * pixels. Redraw the artwork without moving the split and the URL does stay put, but so does
 * the shape, and a stale copy is then only stale art rather than a broken page.
 *
 * The splits are not estimates. Every one of these files is the two page exports drawn as one,
 * so each `split` is the height of the export it replaces — 4158 is exactly section 4's bottom
 * flowers, 2891 exactly section 6's top foliage, and so on — and each half was checked back
 * against that export at 0.2-0.3% RMSE, i.e. re-encoding noise.
 */
const SEAMS = {
  'hero-quote': {
    file: 'Nama Panggilan - Doa.png',
    ink: { width: 4623, height: 4063, x: 14, y: 18 },
    /*
     * Unlike the other three, this file is not two exports stacked: section 2's bouquet was
     * always drawn with its tail hanging off the bottom of the page, and section 3's top flower
     * is that tail. So the split is where the page edge crosses the one drawing — 2968 rows
     * down, leaving the 1095 that section 3 shipped separately.
     */
    split: 2968,
    above: { out: 'public/assets/section-02', name: 'seam-bottom' },
    below: { out: 'public/assets/section-03', name: 'seam-top' },
  },
  'couple-schedule': {
    file: 'Nama Panjang - Waktu.png',
    ink: { width: 6059, height: 5831, x: 16, y: 10 },
    split: 4158,
    above: { out: 'public/assets/section-04', name: 'seam-bottom' },
    below: { out: 'public/assets/section-05', name: 'seam-top' },
  },
  'schedule-location': {
    file: 'Waktu - Tempat.png',
    ink: { width: 7225, height: 5711, x: 7, y: 16 },
    split: 2820,
    above: { out: 'public/assets/section-05', name: 'seam-bottom' },
    below: { out: 'public/assets/section-06', name: 'seam-top' },
  },
  'location-closing': {
    file: 'Tempat - RSVP.png',
    ink: { width: 7225, height: 5711, x: 7, y: 16 },
    split: 2820,
    above: { out: 'public/assets/section-06', name: 'seam-bottom' },
    below: { out: 'public/assets/section-07', name: 'seam-top' },
  },
}

/**
 * Rows each half is cut past the split, so the two overlap rather than meet exactly.
 *
 * The halves are scaled independently at run time and each is pinned to its own side of the
 * boundary, so their inner edges land on the same line to within a rounding error — and a
 * rounding error that goes the wrong way is a hairline of background across the join. The
 * overlap is drawn outside the section that owns it and clipped away, so it costs a few rows
 * of webp and cannot be seen; 8 rows is 2 stage units, which is `SEAM_OVERLAP` in
 * `~/design/stage`, where the placement side of this reads it.
 */
const SEAM_OVERLAP = 8


const wanted = process.argv.slice(2)
for (const [id, section] of Object.entries(SECTIONS)) {
  if (wanted.length && !wanted.includes(id)) continue
  mkdirSync(section.out, { recursive: true })
  for (const { asset, file, name, crop, quality, scale = EXPORT_SCALE } of section.exports) {
    const src = `project-info/per-asset-revision/${section.source}/${file ?? `${section.source} - ${asset}.png`}`
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
    console.log(`${id} ${name.padEnd(22)} <- ${file ? file.replace('.png', '') : `asset ${asset}`.padEnd(8)} ${info}`)
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

if (!wanted.length || wanted.includes('seams')) for (const [id, { file, ink, split, above, below }] of Object.entries(SEAMS)) {
  const src = `project-info/per-asset-revision/Sambungan/${file}`
  const halves = [
    { ...above, top: 0, height: split + SEAM_OVERLAP },
    { ...below, top: split - SEAM_OVERLAP, height: ink.height - split + SEAM_OVERLAP },
  ]
  for (const { out, name, top, height } of halves) {
    mkdirSync(out, { recursive: true })
    const dest = `${out}/${name}-${height}.webp`
    execFileSync('magick', [
      src,
      '-crop', `${ink.width}x${height}+${ink.x}+${ink.y + top}`, '+repage',
      '-filter', 'Lanczos',
      '-resize', `${EXPORT_SCALE * 100}%`,
      '-quality', '90',
      '-define', 'webp:method=6',
      dest,
    ])
    const info = execFileSync('magick', [dest, '-format', '%wx%h', 'info:']).toString()
    console.log(`${id.padEnd(18)} ${dest.padEnd(44)} ${ink.width}x${height} @4x  ${info}`)
  }
}

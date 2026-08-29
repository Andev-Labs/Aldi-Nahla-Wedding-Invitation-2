import { Stage, StageImage } from '~/components/Stage'
import { ARTBOARD_REVISED } from '~/design/stage'

/**
 * Section 5 — date & time, on the revised 1280 x 2772 artwork Nahla sent with her feedback
 * revision (`project-info/per-asset-revision/Tanggal Waktu`, ANDEV-51).
 *
 * `asset` is the source file number in that folder (`Tanggal Waktu - <n>.png`), which
 * `scripts/build-revised-assets.mjs` turns into the webp under `src`. `x` / `y` are the
 * top-left corner in stage units and `width` / `height` the intrinsic @4x pixel sizes of the
 * source PNGs — `StageImage` divides by 4 to get stage units, so the source stays the one
 * place that size is written down.
 *
 * The background is unchanged: asset 6, the artboard-sized plate, is the same flat `#061A17`.
 *
 * ## Three layers are not from the revised set
 *
 * The revised folder has five usable files — garland, card, date, divider, resepsi. It has no
 * lead-in, no akad block and no bottom foliage, all three of which the page it replaces has and
 * needs. The akad is not a plausible cut: the divider *did* ship, and on this page the divider
 * exists only to separate akad from resepsi. So they are read as missing rather than dropped,
 * and each is the old page's export rescaled to sit on the revised artboard, marked `legacy` in
 * the build script. Their `alt` text and animation are the ones they always had.
 *
 * The scale is not guessed. Every piece of type that *did* ship is exactly 1.2018x its old
 * counterpart — date 2234/1858, divider 2264/1884, resepsi 1769/1472, three independent
 * elements agreeing to 0.1% — so the two missing type blocks are exported at that factor and
 * land at the size Nahla's own export would have. The foliage has no such factor to borrow (the
 * garland grew by 1.30 and the card by 1.07 wide / 1.11 tall, i.e. it was redrawn rather than
 * scaled), so the bottom pair takes the artboard's width ratio, 1280/1080, which is what holds
 * its size against the page.
 *
 * ## How these positions were arrived at
 *
 * As with sections 3 and 4, there is no reference render — asset 6 is the flat plate — so the
 * placements are derived from the page this replaces:
 *
 * - **Horizontal** is centring, which this page corroborates twice over: every element of the
 *   old page is centred on its artboard to within a unit, and the revised garland's canvas has
 *   the same 33 px margin at each side.
 * - **Vertical** keeps each element's position as a fraction of the page. The card's top and
 *   the garland's visible depth are the old page's 18.85% and 20.05%; the type inside the card
 *   keeps the old block's internal gaps scaled by the same 1.2018, positioned so the space
 *   above and below it splits the card the way it did before.
 * - **The bottom foliage** is placed to overlap the house's base by the same amount it used to,
 *   rather than by its own top edge — the revised card is proportionally shorter than the old
 *   one (53% of the page against 64%), so matching that overlap is what keeps the foot of the
 *   page reading as it did.
 *
 * Declared bottom-to-top; DOM order is the stacking order. Variants are carried over unchanged:
 * only the schedule type animates, and the garland, card, divider and foliage stay static.
 */
const LAYERS = [
  { asset: 2, key: 'top-garland', src: '/assets/section-05/top-garland.webp', x: -196.25, y: -728.5, width: 6690, height: 5137, variant: undefined },
  // Asset 1 is the cream card and the house on one canvas; the old page kept them as two
  // layers only because `per-asset/` exported them apart.
  { asset: 1, key: 'card', src: '/assets/section-05/card.webp', x: 89.875, y: 522.35, width: 4401, height: 5893, variant: undefined },
  { asset: 42, key: 'lead-in', src: '/assets/section-05/lead-in.webp', x: 379.5, y: 622.8, width: 2084, height: 154, variant: 'fadeUp' },
  { asset: 3, key: 'date', src: '/assets/section-05/date.webp', x: 360.75, y: 692.5, width: 2234, height: 1564, variant: 'fadeUp' },
  { asset: 44, key: 'akad-time', src: '/assets/section-05/akad-time.webp', x: 350, y: 1069.9, width: 2320, height: 695, variant: 'fadeUp' },
  { asset: 4, key: 'divider', src: '/assets/section-05/divider.webp', x: 357, y: 1276.6, width: 2264, height: 108, variant: undefined },
  { asset: 5, key: 'resepsi-time', src: '/assets/section-05/resepsi-time.webp', x: 418.875, y: 1340.3, width: 1769, height: 765, variant: 'fadeUp' },
  // Painted after the card so they overlap the house's base, the way they did before.
  { asset: 47, key: 'bottom-foliage-left', src: '/assets/section-05/bottom-foliage-left.webp', x: -177.8, y: 1830.3, width: 3071, height: 4659, variant: undefined },
  { asset: 48, key: 'bottom-foliage-right', src: '/assets/section-05/bottom-foliage-right.webp', x: 692.15, y: 1830.3, width: 3066, height: 4660, variant: undefined },
] as const

/** Asset 6 is the background plate: an artboard-sized export of nothing but this colour. */
const SCHEDULE_BACKGROUND = '#061a17'

const ALT: Record<string, string> = {
  'lead-in': 'Yang InsyaAllah akan dilaksanakan pada:',
  date: 'Sabtu, 5 September 2026',
  'akad-time': 'Maulid & Ahad, 08.00 WIB — hanya untuk keluarga terdekat',
  'resepsi-time': 'Resepsi, 13.00 - 15.00 WIB',
}

export function ScheduleSection() {
  return (
    /*
     * `fill`, as before. Nothing here is hurt by the vertical crop the taller artboard now
     * needs: the garland hangs in from above the page and the foliage runs off the bottom, so
     * both are already cropped by design and simply show a little less of themselves.
     */
    <Stage id="schedule" artboard={ARTBOARD_REVISED} background={SCHEDULE_BACKGROUND} fit="fill">
      {LAYERS.map((layer) => (
        <StageImage
          key={layer.key}
          dataAsset={layer.asset}
          src={layer.src}
          x={layer.x}
          y={layer.y}
          assetWidth={layer.width}
          assetHeight={layer.height}
          variant={layer.variant}
          alt={ALT[layer.key]}
          priority
        />
      ))}
    </Stage>
  )
}

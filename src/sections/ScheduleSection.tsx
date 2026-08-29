import { Stage, StageImage, StageSeam } from '~/components/Stage'
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
 * ## Two layers are not from the revised set
 *
 * The revised folder has no lead-in and no akad block, both of which the page it replaces has
 * and needs. The akad is not a plausible cut: the divider *did* ship, and on this page the
 * divider exists only to separate akad from resepsi. So they are read as missing rather than
 * dropped, and each is the old page's export rescaled to sit on the revised artboard, marked
 * `legacy` in the build script. Their `alt` text and animation are the ones they always had.
 *
 * The scale is not guessed. Every piece of type that *did* ship is exactly 1.2018x its old
 * counterpart — date 2234/1858, divider 2264/1884, resepsi 1769/1472, three independent
 * elements agreeing to 0.1% — so the two missing type blocks are exported at that factor and
 * land at the size Nahla's own export would have.
 *
 * ## How these positions were arrived at
 *
 * Asset 7 pins itself: its canvas is exactly the artboard's height, so it sits at y = 0, and
 * its two bands are what the rest of the page is measured against. Everything else was derived
 * from the page this replaces before it arrived — there is still no reference render, asset 6
 * being the flat plate — and asset 7 then corroborated it:
 *
 * - **Horizontal** is centring, which this page confirms three ways over: every element of the
 *   old page is centred on its artboard to within a unit, and both of asset 7's bands are
 *   centred on their canvas to within 9 px of 7016.
 * - **Vertical** keeps each element's position as a fraction of the page. The card's top is the
 *   old page's 18.85%; the type inside it keeps the old block's internal gaps scaled by the same
 *   1.2018, positioned so the space above and below it splits the card the way it did before.
 *   Asset 7 is the check on that: centring the card in the gap its two bands leave (418.25 to
 *   2067) would put its top at 506, against the 522.35 the old page's proportions give — 16
 *   units apart on a 2772-unit page, so the derivation is left as it stands.
 *
 * Declared bottom-to-top; DOM order is the stacking order, and also the order the reveal
 * cascades in. Everything inside the card animates — the type fades up in reading order and the
 * divider draws out from its centre between the two times — while the garland, the card itself
 * and the foliage stay static, as page furniture rather than content.
 */
const LAYERS = [
  // Asset 1 is the cream card and the house on one canvas; the old page kept them as two
  // layers only because `per-asset/` exported them apart.
  { asset: 1, key: 'card', src: '/assets/section-05/card.webp', x: 89.875, y: 522.35, width: 4401, height: 5893, variant: undefined },
  { asset: 42, key: 'lead-in', src: '/assets/section-05/lead-in.webp', x: 379.5, y: 622.8, width: 2084, height: 154, variant: 'fadeUp' },
  { asset: 3, key: 'date', src: '/assets/section-05/date.webp', x: 360.75, y: 692.5, width: 2234, height: 1564, variant: 'fadeUp' },
  { asset: 44, key: 'akad-time', src: '/assets/section-05/akad-time.webp', x: 350, y: 1069.9, width: 2320, height: 695, variant: 'fadeUp' },
  { asset: 4, key: 'divider', src: '/assets/section-05/divider.webp', x: 357, y: 1276.6, width: 2264, height: 108, variant: 'drawLine' },
  { asset: 5, key: 'resepsi-time', src: '/assets/section-05/resepsi-time.webp', x: 418.875, y: 1340.3, width: 1769, height: 765, variant: 'fadeUp' },
] as const

/**
 * Asset 7's two bands — the flower frame — which are halves of the clusters this page shares
 * with the pages either side of it, so both are placed against a section boundary rather than
 * on the artboard (ANDEV-55). See `StageSeam`.
 *
 * The garland is the lower half of `Sambungan/Nama Panjang - Waktu.png`, whose upper half is
 * section 4's bottom flowers; the foliage is the upper half of `Sambungan/Waktu - Tempat.png`,
 * whose lower half is section 6's top foliage. Both used to be cut from asset 7 and hung on the
 * artboard's own top and bottom edges, which is where they stopped joining up as soon as `fill`
 * started cropping those edges away.
 *
 * The foliage now sits over the house rather than clearing its base by 71 units, because the
 * screen's bottom edge is above the artboard's under `fill`. That is the order the page has
 * always declared — the old page's foliage painted over the house too — so it is left as it is.
 */
const FRAME = {
  garland: { src: '/assets/section-05/top-garland.webp', width: 6059, height: 1681 },
  foliage: { src: '/assets/section-05/bottom-foliage.webp', width: 7225, height: 2828 },
} as const

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
      {/* Declared first, so the card slides under the garland as it did when the garland was
          the page's first layer. */}
      <StageSeam
        src={FRAME.garland.src}
        anchor="top"
        assetWidth={FRAME.garland.width}
        assetHeight={FRAME.garland.height}
      />

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

      {/* Declared last, over the house — the order the design assumes. */}
      <StageSeam
        src={FRAME.foliage.src}
        anchor="bottom"
        assetWidth={FRAME.foliage.width}
        assetHeight={FRAME.foliage.height}
      />
    </Stage>
  )
}

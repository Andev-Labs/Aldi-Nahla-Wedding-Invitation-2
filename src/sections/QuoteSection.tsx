import { Stage, StageImage, StageSeam } from '~/components/Stage'
import { ARTBOARD_REVISED } from '~/design/stage'

/**
 * Section 3 — the Ar-Rum quote, on the revised 1280 x 2772 artwork Nahla sent with her
 * feedback revision (`project-info/per-asset-revision/Doa`, ANDEV-51).
 *
 * `asset` is the source file number in that folder (`Doa - <n>.png`), which
 * `scripts/build-revised-assets.mjs` turns into the webp under `src`. `x` / `y` are the
 * top-left corner in stage units and `width` / `height` the intrinsic @4x pixel sizes of the
 * source PNGs *after cropping* — `StageImage` divides by 4 to get stage units, so the source
 * stays the one place that size is written down.
 *
 * The page's two-tone background is gone: it used to be `#061A17` full-bleed with a flat
 * `#EDEAE2` panel inset for the full height, and asset 5 — the artboard-sized plate — is now
 * uniform `#EDEAE2` edge to edge (sampled; not a gradient, unlike section 1's). What used to
 * be the dark margin is the curtains' own artwork now.
 *
 * ## How these positions were arrived at
 *
 * As with section 4, this page has no reference render — asset 5 is the flat plate and nothing
 * in the folder is a composite — so the placements below are *derived* from the page this
 * replaces rather than measured against a target, and are the part most likely to want a pass
 * once a render exists.
 *
 * - **Horizontal** is per-canvas. The floral canvas is centred on the artboard: its ink sits
 *   12 px in from its left edge and 14 px from its right, so centring the canvas centres the
 *   drawing. The curtain canvas is *not* — its ink runs flush to the canvas' right edge and
 *   301 px in from the left — so centring it hung the pair 53.5 units right of where they
 *   belong and left a left margin nearly twice the right one (ANDEV-56). What is centred there
 *   is the cream panel the two curtains frame; see the note on the layer.
 * - **The edge furniture** anchors to the edge it belongs to. The curtains' ink is 2779.5 units
 *   tall against a 2772-unit page, so they span it with a hair over at each end; the floral
 *   columns are bottom-anchored, keeping the same fraction of a page (85.2% here, 85.4% before)
 *   and the same slight overhang past the bottom edge; the top flower hangs from the top.
 * - **The monogram and the card** are the derived part. Their gap is the old page's, scaled by
 *   the artboard's width ratio (73.25 x 1280/1080 = 86.8) — the elements themselves scale with
 *   the width, not the height. The block as a whole is then placed so the space above it (from
 *   the flower's ink, not the page edge) and below it keeps the old page's 0.745 ratio.
 *
 * Declared bottom-to-top; DOM order is the stacking order, and also the order the reveal
 * cascades in: the monogram, then the upper rule drawing out from its centre, then the quote,
 * then the lower rule. The curtains and the floral columns stay static.
 */
const LAYERS = [
  /*
   * Asset 2's two curtains are not the same width, so each is cropped to its own bounds; both
   * are hung from the same canvas origin, which keeps the gap between them the drawing's own
   * and puts their ink across the page's full height.
   *
   * That origin is fixed by the cream panel rather than by the canvas, because the canvas is
   * not centred on its contents (see above) and the curtains are not mirrors of each other —
   * the left one's body is 394 units wide against the right one's 361, so neither "centre the
   * canvas" nor "centre the ink" lands the panel on the page's centreline. Measuring the
   * opaque body edges every 400 px down the source puts the panel at canvas 1877..5657 @4x —
   * the left edge is straight, the right tapers 10 px over the full height, so the mean is
   * used — and origin -1207 @4x puts that span's centre on the artboard's. It leaves 167.5
   * units of curtain either side, against the 160 / 164.8 the pre-revision page measured off
   * the reference render (panel 135..941 on a 1080-wide artboard, scaled by 1280/1080).
   */
  { asset: 2, key: 'curtain-left', src: '/assets/section-03/curtain-left.webp', x: -226.5, y: -3.75, width: 1734, height: 11118, variant: undefined },
  { asset: 2, key: 'curtain-right', src: '/assets/section-03/curtain-right.webp', x: 1074.25, y: -3.75, width: 1602, height: 11118, variant: undefined },
  // Asset 1's two floral columns, bottom-anchored — see the note above.
  { asset: 1, key: 'floral-col-left', src: '/assets/section-03/floral-col-left.webp', x: -128.125, y: 429.5, width: 1841, height: 9452, variant: undefined },
  { asset: 1, key: 'floral-col-right', src: '/assets/section-03/floral-col-right.webp', x: 946.875, y: 429.5, width: 1843, height: 9452, variant: undefined },
  { asset: 3, key: 'monogram', src: '/assets/section-03/monogram.webp', x: 365.125, y: 844.25, width: 2199, height: 1039, variant: 'scaleIn' },
  // The quote card: asset 6's two trims framing asset 4's type. All three are placed off the
  // same card origin (332, 1190.75), so the frame and its contents cannot drift apart.
  { asset: 6, key: 'trim-top', src: '/assets/section-03/trim-top.webp', x: 332, y: 1190.75, width: 2464, height: 159, variant: 'drawLine' },
  { asset: 4, key: 'quote', src: '/assets/section-03/quote.webp', x: 353.75, y: 1300.75, width: 2264, height: 2388, variant: 'fadeUp' },
  { asset: 6, key: 'trim-bottom', src: '/assets/section-03/trim-bottom.webp', x: 332, y: 1966, width: 2464, height: 160, variant: 'drawLine' },
] as const

/**
 * Asset 7, the flower cluster across the page top — the lower half of the cluster this page
 * shares with the hero page, and section 2's bouquet is the upper half. It is one drawing cut
 * in two (`Sambungan/Nama Panggilan - Doa.png`), placed against the boundary between the two
 * pages rather than on either artboard, so the halves meet whatever the `fill` crop does to
 * each page's own edges (ANDEV-55). See `StageSeam`.
 *
 * It was already hung off the screen top before that, for a narrower reason — it is drawn flush
 * with the page top and only 274 units deep, against a crop that reaches 247 at a 9:16 viewport,
 * so fitting it to the artboard would have left almost nothing of it. What is new is that the
 * page above is now anchored to the same line.
 *
 * It also retires the old page's one hand-made asset — a direct crop of the reference render,
 * because the cluster existed in `per-asset/` only as ~20 separately-clipped mask/colour pairs
 * with no single-file export. The revised set ships it as one layer.
 */
const TOP_FLOWER = { src: '/assets/section-03/top-flower.webp', width: 4623, height: 1103 } as const

/** Asset 5 is the background plate: an artboard-sized export of nothing but this colour. */
const QUOTE_BACKGROUND = '#edeae2'

const QUOTE_ALT =
  'Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari ' +
  'jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di ' +
  'antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat ' +
  'tanda-tanda (kebesaran Allah) bagi kaum yang berpikir. (Q.S. Ar-Rum:21)'

export function QuoteSection() {
  return (
    /*
     * `fill`, as before the revision — but it does more work now. The old artboard was 9:16,
     * short enough to fill a phone's width on its own; the revised one is 9:19.5, so the page
     * has to grow into the width and give up its top and bottom to do it (ANDEV-51). That is
     * fine for everything here except the top flower, which `StageSeam` keeps.
     */
    <Stage
      id="quote"
      artboard={ARTBOARD_REVISED}
      background={QUOTE_BACKGROUND}
      fit="fill"
    >
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
          alt={layer.key === 'quote' ? QUOTE_ALT : undefined}
          priority
        />
      ))}

      {/* Declared last, so it paints over the curtains and the card exactly as it did while it
          was an `edges` layer rendered outside the artboard. */}
      <StageSeam src={TOP_FLOWER.src} anchor="top" assetWidth={TOP_FLOWER.width} assetHeight={TOP_FLOWER.height} />
    </Stage>
  )
}

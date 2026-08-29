import { Stage, StageEdge, StageImage, StageSeam } from '~/components/Stage'
import { ARTBOARD_REVISED } from '~/design/stage'

/**
 * Section 2 — the hero, on the revised 1280 x 2772 artwork Nahla sent with her feedback
 * revision (`project-info/per-asset-revision/Nama Panggilan`, ANDEV-51).
 *
 * `asset` is the source file number in that folder (`Nama Panggilan - <n>.png`), which
 * `scripts/build-revised-assets.mjs` turns into the webp under `src`. `x` / `y` are the
 * top-left corner in stage units and `width` / `height` the intrinsic @4x pixel sizes of the
 * source PNGs *after cropping* — not of the downscaled webp, since `StageImage` divides by 4
 * to get the size in stage units and the source stays the one place that size is written down.
 *
 * Positions were recovered by compositing the layers against Nahla's reference render of the
 * finished page and minimising the per-pixel error, not estimated by eye.
 *
 * Unlike the original page this replaces, the type is artwork rather than live text: the
 * revised set ships the eyebrow, the names and the date as one PNG (asset 3), so they are cut
 * out of it the same way the cover's salutation is. That also retires the two hand-extracted
 * name SVGs and the PDF-traced starburst the old layout needed — the revised export has all
 * three, correctly spaced.
 *
 * Declared bottom-to-top; DOM order is the stacking order.
 */
const DECOR_LAYERS = [
  /*
   * Asset 5 is the faint fern starburst pair, and its two halves are exact mirrors of each
   * other (they differ by 8e-6 mean per-pixel), so only the left half ships and the right is
   * the same file flipped. Placing them as two layers rather than one 2026-unit-wide image
   * also means neither half decodes the other's empty space.
   */
  { asset: 5, key: 'starburst-left', src: '/assets/section-02/starburst.webp', x: -373, y: 1648, width: 4052, height: 4074, flipped: false },
  { asset: 5, key: 'starburst-right', src: '/assets/section-02/starburst.webp', x: 640, y: 1648, width: 4052, height: 4074, flipped: true },
  // Asset 2 holds both curtains on one canvas; each is cropped out and placed against its
  // own edge of the artboard.
  { asset: 2, key: 'curtain-left', src: '/assets/section-02/curtain-left.webp', x: 0, y: 117, width: 1920, height: 5384, flipped: false },
  { asset: 2, key: 'curtain-right', src: '/assets/section-02/curtain-right.webp', x: 804, y: 117, width: 1902, height: 5384, flipped: false },
] as const

/**
 * Asset 4, the bouquet — the upper half of the cluster this page shares with the quote page,
 * so it is placed against the boundary between the two rather than on the artboard (ANDEV-55).
 *
 * It was always drawn with its tail hanging off the foot of the page, and section 3's top
 * flower is that tail; both are cut from one drawing now (`Sambungan/Nama Panggilan - Doa.png`)
 * and the pair join wherever the crop leaves the page's own bottom edge. See `StageSeam`.
 */
const BOUQUET = { src: '/assets/section-02/seam-bottom-2976.webp', width: 4623, height: 2976 } as const

/**
 * Asset 1, the scalloped pelmet — the one layer here that is not laid out on the artboard.
 *
 * It is drawn exactly artboard-wide (1297 units at x = -3) and hung flush with the page top,
 * which makes it the strip `fill`'s vertical crop reaches first: at a 9:16 viewport the crop is
 * 247 units deep and the pelmet is only 166 tall, so fitting it into the artboard would lose it
 * completely. `StageEdge` hangs it off the top of the screen instead, where the design has it,
 * and it spans whatever width that screen is.
 */
const VALANCE = { src: '/assets/section-02/valance.webp', x: -3, y: -4, width: 5188, height: 663 } as const

/**
 * Asset 6 is the background plate: 5120 x 11088 of nothing but fully transparent #061a17,
 * i.e. the artboard's own fill exported as an image. It is painted as a colour.
 */
const HERO_BACKGROUND = '#061a17'

export function HeroSection() {
  return (
    /*
     * `fill`. This page is drawn to touch all four edges — the curtains hang from the artboard's
     * own left and right — so fitting the whole 9:19.5 artboard into a phone's shorter viewport
     * pulled them away from the screen and left the flat background showing down both sides
     * (ANDEV-51). Unlike section 4, none of that edge artwork is drawn past the artboard, so
     * there is no overhang to spill into the bands and the page has to grow into them instead.
     *
     * What that costs is the top and bottom of the artboard, which here is the right trade: the
     * bottom is the bouquet, already running off the page, and the top is the pelmet, which
     * `edges` keeps by hanging it off the screen rather than the artboard.
     */
    <Stage
      id="hero"
      artboard={ARTBOARD_REVISED}
      background={HERO_BACKGROUND}
      fit="fill"
      edges={
        <StageEdge
          src={VALANCE.src}
          x={VALANCE.x}
          offset={VALANCE.y}
          anchor="top"
          assetWidth={VALANCE.width}
          assetHeight={VALANCE.height}
        />
      }
    >
      {DECOR_LAYERS.map((layer) => (
        <StageImage
          key={layer.key}
          dataAsset={layer.asset}
          src={layer.src}
          x={layer.x}
          y={layer.y}
          assetWidth={layer.width}
          assetHeight={layer.height}
          style={layer.flipped ? { transform: 'scaleX(-1)' } : undefined}
          priority
        />
      ))}

      <StageSeam src={BOUQUET.src} anchor="bottom" assetWidth={BOUQUET.width} assetHeight={BOUQUET.height} />

      {/* Asset 3, top band — "PERNIKAHAN". */}
      <StageImage
        dataAsset={3}
        src="/assets/section-02/eyebrow.webp"
        alt="Pernikahan"
        x={513}
        y={847}
        assetWidth={1065}
        assetHeight={91}
        variant="fadeUp"
        priority
      />

      {/* Asset 3, middle band — the two script lines. */}
      <StageImage
        dataAsset={3}
        src="/assets/section-02/names.webp"
        alt="Aldi & Nahla"
        x={263}
        y={966}
        assetWidth={3215}
        assetHeight={2044}
        variant="scaleIn"
        priority
      />

      {/* Asset 3, bottom band — the date. */}
      <StageImage
        dataAsset={3}
        src="/assets/section-02/date.webp"
        alt="Sabtu, 5 September 2026"
        x={372}
        y={1564}
        assetWidth={2191}
        assetHeight={133}
        variant="fadeUp"
        priority
      />
    </Stage>
  )
}

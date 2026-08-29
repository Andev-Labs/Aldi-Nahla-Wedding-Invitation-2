import { Stage, StageImage } from '~/components/Stage'
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
  { asset: 4, key: 'bouquet', src: '/assets/section-02/bouquet.webp', x: 62, y: 2032, width: 4623, height: 4063, flipped: false },
  // Scalloped pelmet, painted last so its teeth sit over the curtain tops.
  { asset: 1, key: 'valance', src: '/assets/section-02/valance.webp', x: -3, y: -4, width: 5188, height: 663, flipped: false },
] as const

/**
 * Asset 6 is the background plate: 5120 x 11088 of nothing but fully transparent #061a17,
 * i.e. the artboard's own fill exported as an image. It is painted as a colour.
 */
const HERO_BACKGROUND = '#061a17'

export function HeroSection() {
  return (
    /*
     * `contain`, not the `cover` the original-artboard layout used. The revised artwork sits
     * inside its artboard rather than bleeding past it, and every layer's background is the
     * flat `HERO_BACKGROUND` — so on a viewport taller than 9:19.5 there is nothing to gain
     * from cropping the sides, and matching the cover's fit keeps the two revised sections
     * scaling identically as the guest scrolls between them.
     */
    <Stage id="hero" artboard={ARTBOARD_REVISED} background={HERO_BACKGROUND}>
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

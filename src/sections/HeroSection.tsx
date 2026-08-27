import { Stage, StageImage, StageText, StageVector } from '~/components/Stage'

/**
 * Section 2 — the hero (page 2 of `Asset Undangan Digital.pdf`).
 *
 * `asset` is the original file number in `project-info/per-asset` (`Asset <n>@4x.png`).
 * `x` / `y` are the top-left corner in stage units; `width` / `height` are the intrinsic
 * @4x pixel sizes of the PNGs. Positions were recovered by matching each export against
 * the reference render — the artwork here is dark-on-dark, so both were contrast-stretched
 * around the background colour first to get any signal at all.
 *
 * Declared bottom-to-top; DOM order is the stacking order. All decorative — static, no
 * reveal; only the title/names/date (below) animate.
 */
const LAYERS = [
  // See ORNAMENT below — the pair is placed as two halves, not one image.
  { asset: 14, key: 'curtain-left', src: '/assets/section-02/curtain-left.webp', x: -195, y: -164, width: 2525, height: 4577 },
  { asset: 15, key: 'curtain-right', src: '/assets/section-02/curtain-right.webp', x: 571, y: -153, width: 2749, height: 4449 },
  { asset: 17, key: 'bouquet', src: '/assets/section-02/bouquet.webp', x: 7, y: 1245, width: 4269, height: 3759 },
  // Scalloped pelmet, painted last so its teeth sit over the curtain tops.
  { asset: 13, key: 'valance', src: '/assets/section-02/valance.webp', x: -270, y: -3, width: 6529, height: 493 },
] as const

/**
 * Asset 18 / 49 is a flat #061a17 panel exported at 4820 x 7678 — 37 megapixels that
 * Chrome refuses to decode. It is the section background, so it is painted as a colour.
 */
const HERO_BACKGROUND = '#061a17'

/**
 * The faint radial fern pattern behind the bouquet, at 10% opacity.
 *
 * Vector art taken from the PDF rather than `Asset 16@4x.png`: that export bundles both
 * starbursts at a spacing the design does not use, and no placement or scale of it matched.
 * See scripts/extract-ornament-art.mjs.
 */
const ORNAMENT = {
  src: '/assets/section-02/ornament.svg',
  x: 0,
  y: 1014,
  width: 1080,
  height: 795,
} as const

export function HeroSection() {
  return (
    <Stage id="hero" background={HERO_BACKGROUND} fit="cover">
      <StageVector
        src={ORNAMENT.src}
        x={ORNAMENT.x}
        y={ORNAMENT.y}
        width={ORNAMENT.width}
        height={ORNAMENT.height}
        priority
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
          priority
        />
      ))}

      <StageText x={435} baseline={471.8} size={24.75} tracking={6.5} color="#d0d2d3" variant="fadeUp">
        PERNIKAHAN
      </StageText>

      {/*
        The two script lines are vector outlines lifted from the PDF rather than live text:
        they were outlined in Illustrator with manual tracking and an alternate ampersand,
        so re-setting them in Aston Script does not come close. See scripts/extract-name-art.mjs.
      */}
      <StageVector
        src="/assets/section-02/name-aldi.svg"
        alt="Aldi &"
        x={237.42}
        y={548.54}
        width={550.55}
        height={207.79}
        variant="scaleIn"
        priority
      />
      <StageVector
        src="/assets/section-02/name-nahla.svg"
        alt="Nahla"
        x={378.76}
        y={738.55}
        width={493.84}
        height={213.68}
        variant="scaleIn"
        priority
      />

      <StageText x={323} baseline={1041} size={25.75} tracking={6.75} color="#d0d2d3" variant="fadeUp">
        Sabtu, 5 September 2026
      </StageText>
    </Stage>
  )
}

import { Stage, StageImage } from '~/components/Stage'

/**
 * Section 6 — venue & QR (page 6 of `Asset Undangan Digital.pdf`).
 *
 * Flat `#061A17` background, full-bleed — same as sections 2 and 5.
 *
 * `asset` is the original file number in `project-info/per-asset` (`Asset <n>@4x.png`).
 * `x` / `y` are the top-left corner in stage units; `width` / `height` are the intrinsic
 * @4x pixel sizes. Positions were recovered by matching each export against the reference
 * render. The card (40) and house (41) are the exact same assets and positions as section
 * 5 — this page reuses that layout wholesale and swaps only the card's content. Assets
 * 47/48 (the foliage sprigs) are each used twice on this one page: once as the top corners,
 * once as the bottom corners, at different y.
 *
 * Declared bottom-to-top; DOM order is the stacking order.
 */
const LAYERS = [
  { asset: 47, key: 'foliage-top-left', src: '/assets/section-06/foliage-a.png', x: -150, y: -461, width: 2591, height: 3931 },
  { asset: 48, key: 'foliage-top-right', src: '/assets/section-06/foliage-b.png', x: 583, y: -462, width: 2587, height: 3932 },
  { asset: 40, key: 'card', src: '/assets/section-05/card.png', x: 141, y: 361, width: 3192, height: 4324 },
  { asset: 50, key: 'location-card', src: '/assets/section-06/location-card.png', x: 208, y: 534, width: 2601, height: 2519 },
  { asset: 41, key: 'house', src: '/assets/section-05/house.png', x: 57, y: 1265, width: 3868, height: 1330 },
  { asset: 47, key: 'foliage-bottom-left', src: '/assets/section-06/foliage-a.png', x: -150, y: 1458, width: 2591, height: 3931 },
  { asset: 48, key: 'foliage-bottom-right', src: '/assets/section-06/foliage-b.png', x: 584, y: 1458, width: 2587, height: 3932 },
] as const

const LOCATION_BACKGROUND = '#061a17'

export function LocationSection() {
  return (
    <Stage id="location" background={LOCATION_BACKGROUND} fit="cover">
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
    </Stage>
  )
}

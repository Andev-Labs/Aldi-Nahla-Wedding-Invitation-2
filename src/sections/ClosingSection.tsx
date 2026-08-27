import { Stage, StageImage } from '~/components/Stage'

/**
 * Section 7 — closing, RSVP & live streaming (page 7 of `Asset Undangan Digital.pdf`).
 *
 * Flat `#061A17` background, full-bleed — same as sections 2, 5 and 6.
 *
 * `asset` is the original file number in `project-info/per-asset` (`Asset <n>@4x.png`).
 * `x` / `y` are the top-left corner in stage units; `width` / `height` are the intrinsic
 * @4x pixel sizes. Positions were recovered by matching each export against the reference
 * render. Curtains 14/15 are hero's assets again — but swapped left-for-right here, the
 * matcher caught that rather than assuming the same asset always plays the same role.
 * Foliage 47/48 double up top and bottom, but unlike section 6 the bottom pair sits much
 * higher (y 1120 vs section 6's 1458) and closer to centre (x -150/584 vs -184/628) — this
 * page's bottom corners bleed far less off-stage, so the lily and second heliconia lower in
 * each asset are fully in frame instead of being cropped away.
 *
 * Declared bottom-to-top; DOM order is the stacking order.
 */
const LAYERS = [
  { asset: 47, key: 'foliage-top-left', src: '/assets/section-06/foliage-a.png', x: -150, y: -461, width: 2591, height: 3931 },
  { asset: 48, key: 'foliage-top-right', src: '/assets/section-06/foliage-b.png', x: 583, y: -462, width: 2587, height: 3932 },
  { asset: 15, key: 'curtain-left', src: '/assets/section-02/curtain-right.png', x: -386, y: 192, width: 2749, height: 4449 },
  { asset: 14, key: 'curtain-right', src: '/assets/section-02/curtain-left.png', x: 776, y: 181, width: 2525, height: 4577 },
  { asset: 51, key: 'thanks', src: '/assets/section-07/thanks.png', x: 308, y: 530, width: 1854, height: 286 },
  { asset: 52, key: 'rsvp-button', src: '/assets/section-07/rsvp-button.png', x: 298, y: 619, width: 1936, height: 520 },
  { asset: 53, key: 'livestream-button', src: '/assets/section-07/livestream-button.png', x: 249, y: 756, width: 2328, height: 468 },
  { asset: 54, key: 'monogram', src: '/assets/section-07/monogram.png', x: 278, y: 1051, width: 2323, height: 1097 },
  { asset: 47, key: 'foliage-bottom-left', src: '/assets/section-06/foliage-a.png', x: -150, y: 1120, width: 2591, height: 3931 },
  { asset: 48, key: 'foliage-bottom-right', src: '/assets/section-06/foliage-b.png', x: 584, y: 1120, width: 2587, height: 3932 },
] as const

const CLOSING_BACKGROUND = '#061a17'

export function ClosingSection() {
  return (
    <Stage id="closing" background={CLOSING_BACKGROUND} fit="cover">
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

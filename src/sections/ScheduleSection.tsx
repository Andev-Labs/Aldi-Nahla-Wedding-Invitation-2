import { Stage, StageImage } from '~/components/Stage'

/**
 * Section 5 — date & time (page 5 of `Asset Undangan Digital.pdf`).
 *
 * Flat `#061A17` background, full-bleed — same base colour as section 2, no inset panel.
 *
 * `asset` is the original file number in `project-info/per-asset` (`Asset <n>@4x.png`).
 * `x` / `y` are the top-left corner in stage units; `width` / `height` are the intrinsic
 * @4x pixel sizes. Positions were recovered by matching each export against the reference
 * render. The top garland (37) is the same asset section 4 uses for its bottom garland,
 * just repositioned — placed far above the stage here (y=-604) so only its lower half
 * shows, which matched the reference far better than a naive "flip it the right way up"
 * guess would have.
 *
 * Declared bottom-to-top; DOM order is the stacking order.
 */
const LAYERS = [
  { asset: 37, key: 'top-garland', src: '/assets/section-05/top-garland.png', x: -70, y: -604, width: 5088, height: 3956, variant: 'fadeIn' },
  { asset: 40, key: 'card', src: '/assets/section-05/card.png', x: 140, y: 362, width: 3192, height: 4324, variant: 'scaleIn' },
  { asset: 42, key: 'lead-in', src: '/assets/section-05/lead-in.png', x: 323, y: 475, width: 1734, height: 128, variant: 'fadeUp' },
  { asset: 43, key: 'date', src: '/assets/section-05/date.png', x: 307, y: 533, width: 1858, height: 1302, variant: 'fadeUp' },
  { asset: 44, key: 'akad-time', src: '/assets/section-05/akad-time.png', x: 298, y: 847, width: 1930, height: 578, variant: 'fadeUp' },
  { asset: 45, key: 'divider', src: '/assets/section-05/divider.png', x: 305, y: 1019, width: 1884, height: 90, variant: 'fadeIn' },
  { asset: 46, key: 'resepsi-time', src: '/assets/section-05/resepsi-time.png', x: 355, y: 1072, width: 1472, height: 636, variant: 'fadeUp' },
  { asset: 41, key: 'house', src: '/assets/section-05/house.png', x: 57, y: 1265, width: 3868, height: 1330, variant: 'fadeUp' },
  { asset: 47, key: 'bottom-foliage-left', src: '/assets/section-05/bottom-foliage-left.png', x: -150, y: 1458, width: 2591, height: 3931, variant: 'slideRight' },
  { asset: 48, key: 'bottom-foliage-right', src: '/assets/section-05/bottom-foliage-right.png', x: 584, y: 1458, width: 2587, height: 3932, variant: 'slideLeft' },
] as const

const SCHEDULE_BACKGROUND = '#061a17'

export function ScheduleSection() {
  return (
    <Stage id="schedule" background={SCHEDULE_BACKGROUND} fit="cover">
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
          priority
        />
      ))}
    </Stage>
  )
}

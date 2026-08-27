import { Stage, StageImage } from '~/components/Stage'

/**
 * Section 1 — the envelope cover (page 1 of `Asset Undangan Digital.pdf`).
 *
 * `asset` is the original file number in `project-info/per-asset` (`Asset <n>@4x.png`).
 * `x` / `y` are the top-left corner in stage units and were recovered by matching each
 * export against the reference render, not estimated by eye. `width` / `height` are the
 * intrinsic @4x pixel sizes of the PNGs.
 *
 * Declared bottom-to-top; DOM order is the stacking order.
 */
const LAYERS = [
  { asset: 3, key: 'envelope', src: '/assets/section-01/envelope.png', x: 201, y: 417, width: 2712, height: 2856 },
  { asset: 4, key: 'card', src: '/assets/section-01/card.png', x: 270, y: 576, width: 2158, height: 1231 },
  { asset: 5, key: 'wax-seal', src: '/assets/section-01/wax-seal.png', x: 476, y: 850, width: 503, height: 511 },
  { asset: 1, key: 'floral-tl-back', src: '/assets/section-01/floral-tl-back.png', x: 69, y: 495, width: 1185, height: 1153 },
  { asset: 2, key: 'floral-tl-front', src: '/assets/section-01/floral-tl-front.png', x: 181, y: 528, width: 841, height: 1125 },
  { asset: 6, key: 'floral-br-back', src: '/assets/section-01/floral-br-back.png', x: 703, y: 978, width: 1253, height: 1161 },
  { asset: 7, key: 'floral-br-front', src: '/assets/section-01/floral-br-front.png', x: 686, y: 937, width: 869, height: 741 },
] as const

/**
 * Radial vignette: a cream core falling to warm grey at the corners. The ellipse and
 * stops were least-squares fitted against the background-only pixels of the reference
 * render, so it tracks the original to within ~1/255 on average.
 */
const COVER_BACKGROUND =
  'linear-gradient(180deg, rgba(0,0,0,0) 46%, rgba(0,0,0,0.025) 100%),' +
  'radial-gradient(ellipse 86% 58% at 50% 48%, #edeae2 0%, #edeae2 56%, #e5e2db 72%, #d7d4cd 86%, #c8c6bf 100%)'

export function CoverSection() {
  return (
    <Stage id="cover" background={COVER_BACKGROUND}>
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

      {/* Asset 8 — "Kepada Yth. / Bapak/Ibu/Saudara/i" plus the disclaimer line. */}
      <StageImage
        src="/assets/section-01/salutation.png"
        alt="Kepada Yth. Bapak/Ibu/Saudara/i"
        x={380}
        y={1168}
        assetWidth={1276}
        assetHeight={1217}
        priority
      />

      {/* Asset 11 — guest name placeholder, still the reference artwork. */}
      <StageImage
        src="/assets/section-01/guest-name.png"
        alt="Nama Tamu Undangan"
        x={328}
        y={1260}
        assetWidth={1694}
        assetHeight={213}
        priority
      />

      {/* Asset 10 — rule under the guest name. */}
      <StageImage
        src="/assets/section-01/guest-name-rule.png"
        x={283}
        y={1307}
        assetWidth={2052}
        assetHeight={9}
        priority
      />

      {/* Asset 9 — "Buka Undangan". Static artwork for now; the open interaction comes later. */}
      <StageImage
        src="/assets/section-01/open-button.png"
        alt="Buka Undangan"
        x={326}
        y={1334}
        assetWidth={1704}
        assetHeight={452}
        priority
      />
    </Stage>
  )
}

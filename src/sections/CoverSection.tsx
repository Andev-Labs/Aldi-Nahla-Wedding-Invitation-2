import { useState } from 'react'
import { Stage, StageImage } from '~/components/Stage'

/**
 * Section 1 — the envelope cover (page 1 of `Asset Undangan Digital.pdf`).
 *
 * `asset` is the original file number in `project-info/per-asset` (`Asset <n>@4x.png`).
 * `x` / `y` are the top-left corner in stage units and were recovered by matching each
 * export against the reference render, not estimated by eye. `width` / `height` are the
 * intrinsic @4x pixel sizes of the PNGs.
 *
 * `card` and `wax-seal` are pulled out of this array (below) because they carry the
 * open-envelope interaction. The florals here are decorative — static, no reveal.
 * Declared bottom-to-top; DOM order is the stacking order.
 */
const LAYERS = [
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
  const [isOpen, setIsOpen] = useState(false)
  const openInvitation = () => setIsOpen(true)

  return (
    <Stage id="cover" background={COVER_BACKGROUND}>
      {/* Asset 3 — envelope. Decorative backdrop for the card; static. */}
      <StageImage
        dataAsset={3}
        src="/assets/section-01/envelope.png"
        x={201}
        y={417}
        assetWidth={2712}
        assetHeight={2856}
        priority
      />

      {/*
        Asset 4 — the card tucked in the envelope. On open it lifts and settles forward,
        as if being drawn out.
      */}
      <StageImage
        dataAsset={4}
        src="/assets/section-01/card.png"
        x={270}
        y={576}
        assetWidth={2158}
        assetHeight={1231}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={isOpen ? { opacity: 1, y: -32, scale: 1.03 } : { opacity: 1, y: 0, scale: 1 }}
        priority
      />

      {/*
        Asset 5 — wax seal. Doubles as the open-envelope hit target: tapping it "breaks"
        the seal (shrinks, spins and fades away) and lifts the card above.
      */}
      <StageImage
        dataAsset={5}
        src="/assets/section-01/wax-seal.png"
        x={476}
        y={850}
        assetWidth={503}
        assetHeight={511}
        interactive={!isOpen}
        onClick={openInvitation}
        whileHover={!isOpen ? { scale: 1.06 } : undefined}
        whileTap={!isOpen ? { scale: 0.92 } : undefined}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={isOpen ? { opacity: 0, scale: 0, rotate: 35 } : { opacity: 1, scale: 1, rotate: 0 }}
        // A wax seal cracking is a quick, decisive snap, not a gentle settle — stiffer and
        // lighter than the default spring so it reads as breaking rather than drifting shut.
        transition={{ type: 'spring', stiffness: 260, damping: 20, mass: 0.6, opacity: { duration: 0.35, ease: 'easeOut' } }}
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

      {/* Asset 8 — "Kepada Yth. / Bapak/Ibu/Saudara/i" plus the disclaimer line. Content. */}
      <StageImage
        src="/assets/section-01/salutation.png"
        alt="Kepada Yth. Bapak/Ibu/Saudara/i"
        x={380}
        y={1168}
        assetWidth={1276}
        assetHeight={1217}
        variant="fadeUp"
        priority
      />

      {/* Asset 11 — guest name placeholder, still the reference artwork. Content. */}
      <StageImage
        src="/assets/section-01/guest-name.png"
        alt="Nama Tamu Undangan"
        x={328}
        y={1260}
        assetWidth={1694}
        assetHeight={213}
        variant="fadeUp"
        priority
      />

      {/* Asset 10 — rule under the guest name. Decorative; static. */}
      <StageImage
        src="/assets/section-01/guest-name-rule.png"
        x={283}
        y={1307}
        assetWidth={2052}
        assetHeight={9}
        priority
      />

      {/* Asset 9 — "Buka Undangan". Same tap target as the wax seal; fades once opened. */}
      <StageImage
        src="/assets/section-01/open-button.png"
        alt="Buka Undangan"
        x={326}
        y={1334}
        assetWidth={1704}
        assetHeight={452}
        interactive={!isOpen}
        onClick={openInvitation}
        whileHover={!isOpen ? { scale: 1.03 } : undefined}
        whileTap={!isOpen ? { scale: 0.96 } : undefined}
        initial={{ opacity: 0, y: 28 }}
        animate={isOpen ? { opacity: 0, y: 12 } : { opacity: 1, y: 0 }}
        priority
      />
    </Stage>
  )
}

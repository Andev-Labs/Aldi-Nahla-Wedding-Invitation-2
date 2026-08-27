import { Stage, StageButton, StageImage } from '~/components/Stage'

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
 * Declared bottom-to-top; DOM order is the stacking order. Only "thanks" and the two
 * buttons (below) animate in — foliage, curtains, monogram and the garland are decorative
 * and stay static.
 */
const LAYERS = [
  { asset: 47, key: 'foliage-top-left', src: '/assets/section-06/foliage-a.webp', x: -150, y: -461, width: 2591, height: 3931, variant: undefined },
  { asset: 48, key: 'foliage-top-right', src: '/assets/section-06/foliage-b.webp', x: 583, y: -462, width: 2587, height: 3932, variant: undefined },
  { asset: 15, key: 'curtain-left', src: '/assets/section-02/curtain-right.webp', x: -386, y: 192, width: 2749, height: 4449, variant: undefined },
  { asset: 14, key: 'curtain-right', src: '/assets/section-02/curtain-left.webp', x: 776, y: 181, width: 2525, height: 4577, variant: undefined },
  { asset: 51, key: 'thanks', src: '/assets/section-07/thanks.webp', x: 308, y: 530, width: 1854, height: 286, variant: 'fadeUp' },
  { asset: 54, key: 'monogram', src: '/assets/section-07/monogram.webp', x: 278, y: 1051, width: 2323, height: 1097, variant: undefined },
  { asset: 37, key: 'bottom-garland', src: '/assets/section-04/bottom-garland.webp', x: -96, y: 1245, width: 5088, height: 3956, variant: undefined },
] as const

/**
 * RSVP/livestream buttons get a hover/tap affordance on top of the usual fade-up reveal.
 * Live text, not the reference PDF's asset 52/53 PNGs — see `StageButton` (ANDEV-49). `x`/
 * `y`/`width`/`height` are the *visible pill's* box in stage units, recovered the same way
 * as the cover's "Buka Undangan" button — see `StageButton`'s doc comment.
 */
const BUTTONS = [
  {
    key: 'rsvp-button',
    x: 314,
    y: 635,
    width: 452,
    height: 98.5,
    size: 32,
    scriptSize: 50,
    runs: [
      { text: 'R', script: true },
      { text: 'svp ' },
      { text: 'K', script: true },
      { text: 'lik ' },
      { text: 'D', script: true },
      { text: 'isini' },
    ],
    href: 'https://forms.gle/TdMo5owtHoYuSMp7A',
  },
  {
    key: 'livestream-button',
    x: 264.5,
    y: 772,
    width: 551,
    height: 85.75,
    size: 28,
    scriptSize: 43,
    runs: [
      { text: 'L', script: true },
      { text: 'ive ' },
      { text: 'S', script: true },
      { text: 'treaming ' },
      { text: 'K', script: true },
      { text: 'lik ' },
      { text: 'D', script: true },
      { text: 'isini' },
    ],
    href: 'https://www.youtube.com/live/09ePEsYJyik?feature=share',
  },
] as const

const CLOSING_BACKGROUND = '#061a17'

export function ClosingSection() {
  return (
    <Stage id="closing" background={CLOSING_BACKGROUND} fit="cover">
      {/* foliage, curtains, "thanks". */}
      {LAYERS.slice(0, 5).map((layer) => (
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

      {BUTTONS.map((button) => (
        <StageButton
          key={button.key}
          x={button.x}
          y={button.y}
          width={button.width}
          height={button.height}
          runs={button.runs}
          background="var(--color-cream)"
          color="var(--color-green-600)"
          size={button.size}
          scriptSize={button.scriptSize}
          variant="fadeUp"
          onClick={() => window.open(button.href, '_blank', 'noopener,noreferrer')}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        />
      ))}

      {/* monogram, bottom garland. */}
      {LAYERS.slice(5).map((layer) => (
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

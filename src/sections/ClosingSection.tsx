import { Stage, StageImage } from '~/components/Stage'
import { ARTBOARD_REVISED } from '~/design/stage'

/**
 * Section 7 — closing, RSVP & live streaming, on the revised 1280 x 2772 artwork Nahla sent
 * with her feedback revision (`project-info/per-asset-revision/RSVP`, ANDEV-51).
 *
 * `asset` is the source file number in that folder (`RSVP - <n>.png`), which
 * `scripts/build-revised-assets.mjs` turns into the webp under `src`. `x` / `y` are the
 * top-left corner in stage units and `width` / `height` the intrinsic @4x pixel sizes of the
 * source PNGs *after cropping* — `StageImage` divides by 4 to get stage units, so the source
 * stays the one place that size is written down.
 *
 * The background is unchanged: asset 7, the artboard-sized plate, is the same flat `#061A17`.
 *
 * **The RSVP button's wording changed.** It reads "Rsvp & e-gift Klik Disini" now, where the
 * old one said only "Rsvp Klik Disini"; its `href` is untouched and still opens the same Google
 * Form, which may or may not be what "e-gift" is meant to reach.
 *
 * ## How these positions were arrived at
 *
 * Two of the three artwork layers place themselves. Asset 8's canvas is the artboard exactly,
 * so the curtains sit at 0, 0; asset 1's canvas is the artboard's height, so the flower frame
 * sits at y = 0 and both of its bands are centred on that canvas to within 3 px of 7890.
 *
 * The type block had to be derived, and the artwork gives its scale: the monogram is 1.2097x
 * its old counterpart on both axes and the thanks line 1.2093 wide — so this page is 1.2096,
 * which is neither section 5's 1.2018 nor section 6's 1.1178. The block keeps the old page's
 * gaps scaled by that, and is placed so the space above and below it holds the old page's
 * 530:594.75 ratio.
 *
 * The monogram is the one thing here not centred, and that is deliberate. Every other element
 * on the old page was fitted to within a unit of the artboard's centre; the monogram was fitted
 * 28.4 units right of it, and its canvas is a tight crop of the ink with no padding to explain
 * that away. The glyph's swash hangs left, so the offset is what optically centres it. It is
 * carried over as the same fraction of the page width, 2.63%, i.e. 33.6 units here.
 *
 * Declared bottom-to-top; DOM order is the stacking order — the flower frame's upper band paints
 * over the curtains, and its lower band over the monogram, as the old page's garland did — and
 * also the order the reveal cascades in. "Thanks", the two buttons and the monogram animate, in
 * that order; the curtains and the flower frame stay static.
 */
const LAYERS = [
  { asset: 8, key: 'curtains', src: '/assets/section-07/curtains.webp', x: 0, y: 0, width: 5120, height: 9291, variant: undefined },
  // Asset 1's upper band. Both bands are placed off the same canvas origin — x = -346.25, the
  // canvas centred on the page, y = 0 — plus their own crop offsets, so neither needed fitting.
  { asset: 1, key: 'top-foliage', src: '/assets/section-07/top-foliage.webp', x: -262.25, y: 0, width: 7225, height: 2891, variant: undefined },
  { asset: 3, key: 'thanks', src: '/assets/section-07/thanks.webp', x: 359.75, y: 867, width: 2242, height: 347, variant: 'fadeUp' },
] as const

/** RSVP/livestream buttons get a hover/tap affordance on top of the usual fade-up reveal. */
const BUTTONS = [
  {
    asset: 4,
    key: 'rsvp-button',
    src: '/assets/section-07/rsvp-button.webp',
    alt: 'Rsvp & e-gift, klik di sini',
    x: 277,
    y: 974.95,
    width: 2904,
    height: 535,
    href: 'https://forms.gle/TdMo5owtHoYuSMp7A',
  },
  {
    asset: 5,
    key: 'livestream-button',
    src: '/assets/section-07/livestream-button.webp',
    alt: 'Live streaming, klik di sini',
    x: 291.125,
    y: 1117.2,
    width: 2791,
    height: 539,
    href: 'https://www.youtube.com/live/09ePEsYJyik?feature=share',
  },
] as const

const AFTER_BUTTON_LAYERS = [
  { asset: 2, key: 'monogram', src: '/assets/section-07/monogram.webp', x: 322.4, y: 1467.25, width: 2810, height: 1327, variant: 'scaleIn' },
  // Asset 1's lower band, declared last so it paints over the monogram the way the old page's
  // garland did.
  { asset: 1, key: 'bottom-foliage', src: '/assets/section-07/bottom-foliage.webp', x: -109.5, y: 1765.75, width: 5993, height: 4025, variant: undefined },
] as const

/** Asset 7 is the background plate: an artboard-sized export of nothing but this colour. */
const CLOSING_BACKGROUND = '#061a17'

const THANKS_ALT = 'Atas kehadiran dan do’a restu kami ucapkan terima kasih.'

export function ClosingSection() {
  return (
    <Stage id="closing" artboard={ARTBOARD_REVISED} background={CLOSING_BACKGROUND} fit="fill">
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
          alt={layer.key === 'thanks' ? THANKS_ALT : undefined}
          priority
        />
      ))}

      {BUTTONS.map((button) => (
        <StageImage
          key={button.key}
          dataAsset={button.asset}
          src={button.src}
          alt={button.alt}
          x={button.x}
          y={button.y}
          assetWidth={button.width}
          assetHeight={button.height}
          variant="fadeUp"
          interactive
          onClick={() => window.open(button.href, '_blank', 'noopener,noreferrer')}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          priority
        />
      ))}

      {AFTER_BUTTON_LAYERS.map((layer) => (
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

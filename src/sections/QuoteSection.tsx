import { Stage, StageBox, StageImage } from '~/components/Stage'

/**
 * Section 3 — the Ar-Rum quote (page 3 of `Asset Undangan Digital.pdf`).
 *
 * Unlike sections 1 and 2, the background here is two-tone: `#061A17` full-bleed, with a
 * flat `#EDEAE2` panel (`Asset 21@4x.png`, sampled pixel by pixel — no vignette, unlike
 * section 1) inset from the left/right edges for the full page height. The panel is drawn
 * as a colour rather than that image: it's a perfectly solid fill, and the file is
 * 4320x7748px (~33 MP), over what Chrome will decode.
 *
 * `asset` is the original file number in `project-info/per-asset` (`Asset <n>@4x.png`).
 * `x` / `y` are the top-left corner in stage units; `width` / `height` are the intrinsic
 * @4x pixel sizes. Positions were recovered by matching each export against the reference
 * render. Curtains 14/15 are the same PNGs section 2 uses, repositioned — the design reuses
 * them page to page.
 *
 * Declared bottom-to-top; DOM order is the stacking order.
 */
const LAYERS = [
  { asset: 14, key: 'curtain-left', src: '/assets/section-02/curtain-left.png', x: -292, y: -132, width: 2525, height: 4577, variant: 'curtainLeft' },
  { asset: 15, key: 'curtain-right', src: '/assets/section-02/curtain-right.png', x: 660, y: -100, width: 2749, height: 4449, variant: 'curtainRight' },
  { asset: 22, key: 'floral-col-left', src: '/assets/section-03/floral-col-left.png', x: -109, y: 295, width: 1717, height: 6557, variant: 'slideRight' },
  { asset: 23, key: 'floral-col-right', src: '/assets/section-03/floral-col-right.png', x: 761, y: 295, width: 1721, height: 6557, variant: 'slideLeft' },
  { asset: 24, key: 'monogram', src: '/assets/section-03/monogram.png', x: 344, y: 517, width: 1793, height: 847, variant: 'scaleIn' },
  { asset: 25, key: 'quote', src: '/assets/section-03/quote.png', x: 274, y: 802, width: 2126, height: 2814, variant: 'fadeUp' },
] as const

/**
 * The top-centre flower is genuinely absent from `per-asset/` — the page composites it from
 * ~20 individually-clipped raster fragments (mask + colour pairs per petal) that have no
 * single-file export, unlike every other element on this page. Reconstructing that from the
 * PDF's own layer graph was not worth it for one decorative cluster, so this is a direct
 * high-DPI crop of the reference render (page 3, 0,0–1080,480) instead. It sits on the same
 * flat #EDEAE2 as the rest of the section, so the seam where it ends is invisible, and it is
 * layered above the curtains so it doesn't depend on their alignment being exact underneath.
 */
const TOP_STRIP = {
  src: '/assets/section-03/top-strip.png',
  x: 0,
  y: 0,
  width: 4320,
  height: 1920,
} as const

const QUOTE_BACKGROUND = '#061a17'

/** The cream panel's edges, measured from the reference render (constant for its full height). */
const PANEL = { x: 135, y: 0, width: 806, height: 1920 } as const

export function QuoteSection() {
  return (
    <Stage id="quote" background={QUOTE_BACKGROUND} fit="cover">
      <StageBox x={PANEL.x} y={PANEL.y} width={PANEL.width} height={PANEL.height} color="#edeae2" />

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
          alt={layer.key === 'quote' ? "Dan di antara tanda-tanda kebesaran-Nya... (Q.S. Ar-Rum:21)" : undefined}
          priority
        />
      ))}

      <StageImage
        src={TOP_STRIP.src}
        x={TOP_STRIP.x}
        y={TOP_STRIP.y}
        assetWidth={TOP_STRIP.width}
        assetHeight={TOP_STRIP.height}
        variant="fadeIn"
        priority
      />
    </Stage>
  )
}

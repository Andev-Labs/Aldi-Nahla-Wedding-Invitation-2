import { Stage, StageImage } from '~/components/Stage'

/**
 * Section 4 — the bride & groom (page 4 of `Asset Undangan Digital.pdf`).
 *
 * Flat `#EDEAE2` background, full-bleed this time — unlike section 3, nothing sits in an
 * inset panel here (sampled the extreme page edges past the curtains' reach: pure cream).
 *
 * `asset` is the original file number in `project-info/per-asset` (`Asset <n>@4x.png`).
 * `x` / `y` are the top-left corner in stage units; `width` / `height` are the intrinsic
 * @4x pixel sizes. Positions were recovered by matching each export against the reference
 * render. Curtains 26/28 and the bottom garland 37 are reused verbatim from other pages —
 * 37 is the same twin-cluster asset section 5 uses.
 *
 * Every text element in this section — including both names — ships as a PNG here (unlike
 * section 2's names, these have no distinct outlined vector in the PDF to fall back to), so
 * unlike section 2 there's no live HTML text or extracted vector art in this section.
 *
 * Declared bottom-to-top; DOM order is the stacking order. Only the names/bismillah/
 * "dengan" text animate in — trims, curtains, ornaments and the garland are decorative
 * and stay static.
 */
const LAYERS = [
  // Gold scallop trims sit behind the curtains: the reference shows them clipped by the
  // curtain fabric on both sides, not painted over it.
  { asset: 27, key: 'trim-top', src: '/assets/section-04/trim-top.png', x: 338, y: -3, width: 6450, height: 417, variant: undefined },
  { asset: 38, key: 'trim-bottom', src: '/assets/section-04/trim-bottom.png', x: 294, y: 1868, width: 6450, height: 417, variant: undefined },
  { asset: 26, key: 'curtain-left', src: '/assets/section-04/curtain-left.png', x: -225, y: -36, width: 2525, height: 4577, variant: undefined },
  { asset: 28, key: 'curtain-right', src: '/assets/section-04/curtain-right.png', x: 601, y: -27, width: 2749, height: 4449, variant: undefined },
  { asset: 35, key: 'ornament-a', src: '/assets/section-04/ornament-a.png', x: -614, y: 877, width: 4722, height: 1801, variant: undefined },
  { asset: 36, key: 'ornament-b', src: '/assets/section-04/ornament-b.png', x: 263, y: 617, width: 7224, height: 2756, variant: undefined },
  { asset: 29, key: 'bismillah', src: '/assets/section-04/bismillah.png', x: 324, y: 273, width: 1722, height: 1389, variant: 'scaleIn' },
  { asset: 30, key: 'name-nahla-karima', src: '/assets/section-04/name-nahla-karima.png', x: 325, y: 661, width: 1723, height: 1223, variant: 'fadeUp' },
  { asset: 31, key: 'parents-nahla', src: '/assets/section-04/parents-nahla.png', x: 242, y: 997, width: 2382, height: 150, variant: 'fadeUp' },
  { asset: 32, key: 'dengan', src: '/assets/section-04/dengan.png', x: 482, y: 1078, width: 464, height: 102, variant: 'fadeIn' },
  { asset: 33, key: 'name-aldi-ramadhan', src: '/assets/section-04/name-aldi-ramadhan.png', x: 269, y: 1160, width: 2182, height: 937, variant: 'fadeUp' },
  { asset: 34, key: 'parents-aldi', src: '/assets/section-04/parents-aldi.png', x: 253, y: 1424, width: 2294, height: 150, variant: 'fadeUp' },
  { asset: 37, key: 'bottom-garland', src: '/assets/section-04/bottom-garland.png', x: -96, y: 1245, width: 5088, height: 3956, variant: undefined },
] as const

const COUPLE_BACKGROUND = '#edeae2'

export function CoupleSection() {
  return (
    <Stage id="couple" background={COUPLE_BACKGROUND} fit="cover">
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

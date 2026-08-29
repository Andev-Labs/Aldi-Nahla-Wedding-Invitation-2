import { Stage, StageImage } from '~/components/Stage'
import { ARTBOARD_REVISED } from '~/design/stage'

/**
 * Section 4 — the bride & groom, on the revised 1280 x 2772 artwork Nahla sent with her
 * feedback revision (`project-info/per-asset-revision/Nama Panjang`, ANDEV-51).
 *
 * `asset` is the source file number in that folder (`Nama Panjang - <n>.png`), which
 * `scripts/build-revised-assets.mjs` turns into the webp under `src`. `x` / `y` are the
 * top-left corner in stage units and `width` / `height` the intrinsic @4x pixel sizes of the
 * source PNGs *after cropping* — `StageImage` divides by 4 to get stage units, so the source
 * stays the one place that size is written down.
 *
 * Every element here is artwork, including all the type — the same as the page this replaces,
 * where none of the lettering had a live-text or vector equivalent either.
 *
 * ## How these positions were arrived at
 *
 * Unlike sections 1 and 2, this page has no reference render of the finished composition — the
 * revised set for it is loose layers only, and `Nama Panjang - 11.png` (the artboard-sized
 * plate) is empty apart from the background colour. So the placements below are *derived*, not
 * measured against a target, and are the part of this section most likely to need a pass once a
 * render exists:
 *
 * - **Horizontal** is solid. Every layer is centred on the artboard, which is how the revised
 *   pages that *could* be measured turned out: on sections 1 and 2 the centred prediction
 *   matched the fitted x to within a stage unit for every asset whose canvas was not itself
 *   asymmetric.
 * - **Scale** is solid, and comes from the artwork rather than from a choice: every text export
 *   here is 1.2769x its counterpart on the original page (592/464, 2200/1723, 2787/2182,
 *   3042/2382, 2930/2294 — five independent elements agreeing to 0.1%). The revision is the
 *   same design enlarged by that factor, so the type's internal rhythm is the original's gaps
 *   scaled by it, which is what sets the spacing of the block below.
 * - **Vertical placement of the block as a whole** is the derived part. The page furniture is
 *   anchored to the edges it belongs to (curtains and their trim at the top, the matching trim
 *   at the bottom), and the type block is placed so the space above and below it keeps the
 *   original page's ratio. The taller artboard makes that a judgement rather than a
 *   measurement — the revision re-flowed section 2's verticals rather than scaling them, so it
 *   may well have re-flowed these too.
 *
 * Declared bottom-to-top; DOM order is the stacking order. Variants are carried over unchanged
 * from the page this replaces.
 */
const DECOR_LAYERS = [
  /*
   * Asset 10 — the faint cream starburst pair, sitting behind the names. Its two bursts are on
   * a diagonal rather than mirrored, so it ships as one image instead of a flipped half.
   */
  { asset: 10, key: 'starburst', src: '/assets/section-04/starburst.webp', x: -318.875, y: 502, width: 7671, height: 6760, flipped: false },
  // Asset 1 — the scalloped gold trim and both curtains on one canvas, hung from the page top.
  { asset: 1, key: 'curtains', src: '/assets/section-04/curtains.webp', x: -295.25, y: -32, width: 7482, height: 5283, flipped: false },
  /*
   * Asset 12 — the matching trim at the foot of the page, flush with its bottom edge.
   *
   * It goes *under* the flowers, unlike asset 1's trim, which sits over the curtain tops. That
   * was the right way round for the floral columns this replaces — thin enough that the trim
   * crossing them read as a frame — but the new flowers run the full width and all the way to
   * the page edge, so painting the trim last cut through the blooms and showed their colour
   * through its pierced circles. Under them, the flowers grow up over the trim, which is what
   * the artwork is drawn for: it does not stop where the trim starts.
   */
  { asset: 12, key: 'trim-bottom', src: '/assets/section-04/trim-bottom.webp', x: -295.25, y: 2651, width: 7482, height: 483, flipped: false },
  /*
   * The bottom flowers, from `Bunga di bawah nama panjang.png` — the export Nahla sent later,
   * which supersedes asset 2's pair of mirrored columns. Its canvas is the artboard exactly, so
   * unlike everything else on this page it needed no fitting: x = 0, y = 0 plus the crop's own
   * offset, and it is the mirrored pair drawn as one layer.
   *
   * It is also the one layer here with no overhang past the artboard, where asset 2 had 121.375
   * units of it. On a viewport shorter than the artboard's 9:19.5 the trims still reach the
   * screen (they carry 295.25 units, see `COUPLE_BLEED`) but these flowers stop at the artboard
   * edge, leaving a strip of background beside them — 24 px a side at 393 x 746, nothing at all
   * at 393 x 852. Closing that needs the export drawn past the canvas, as the trims are.
   */
  { asset: 2, key: 'bottom-flowers', src: '/assets/section-04/bottom-flowers.webp', x: 0, y: 1732.5, width: 5120, height: 4158, flipped: false },
] as const

/**
 * The type, top to bottom. Spacing is the original page's gaps scaled by the 1.2769 the artwork
 * itself is scaled by (see above); `y` is the layer's canvas top, which sits a few units above
 * its ink where the export has padding.
 */
const TEXT_LAYERS = [
  { asset: 3, key: 'bismillah', src: '/assets/section-04/bismillah.webp', alt: 'Bismillahirrahmanirrahim. Assalamu’alaikum Warahmatullahi Wabarakatu', x: 436.75, y: 468, width: 1626, height: 514, variant: 'scaleIn' },
  { asset: 4, key: 'invitation', src: '/assets/section-04/invitation.webp', alt: 'Dengan rahmat Allah SWT, kami mengundang Bapak/Ibu, Saudara/i pada acara pernikahan kami:', x: 365, y: 747, width: 2200, height: 658, variant: 'scaleIn' },
  { asset: 5, key: 'name-nahla', src: '/assets/section-04/name-nahla.webp', alt: 'Nahla Karima', x: 365, y: 963, width: 2200, height: 1562, variant: 'fadeUp' },
  { asset: 6, key: 'parents-nahla', src: '/assets/section-04/parents-nahla.webp', alt: 'Putri pertama dari Bapak Yakub & Ibu Halimah', x: 259.75, y: 1392, width: 3042, height: 191, variant: 'fadeUp' },
  { asset: 7, key: 'dengan', src: '/assets/section-04/dengan.webp', alt: 'dengan', x: 566, y: 1496, width: 592, height: 130, variant: 'fadeIn' },
  { asset: 8, key: 'name-aldi', src: '/assets/section-04/name-aldi.webp', alt: 'Aldi Ramadhan', x: 291.625, y: 1600, width: 2787, height: 1196, variant: 'fadeUp' },
  { asset: 9, key: 'parents-aldi', src: '/assets/section-04/parents-aldi.webp', alt: 'Putra kedua dari Bapak Nurdin & Ibu Endang', x: 273.75, y: 1938, width: 2930, height: 191, variant: 'fadeUp' },
] as const

/** Asset 11 is the background plate: an artboard-sized export of nothing but this colour. */
const COUPLE_BACKGROUND = '#edeae2'

/**
 * How far past each side of the artboard this page's edge artwork is drawn, in stage units.
 *
 * Assets 1 and 12 — the two gold trims, the elements that define the page's left and right
 * edges — are 1870.5 units wide on a 1280 artboard, hung at x = -295.25, and their scallop
 * pattern runs the whole canvas rather than stopping at the artboard. So the page has 295.25
 * units of real edge artwork in reserve on each side, and `Stage` spills it into the side
 * bands a phone's viewport leaves (see `stageBleedColumn`). That covers every phone: the
 * widest band comes from the shortest viewport, and even 4:3 only asks for 160 units.
 */
const COUPLE_BLEED = 295.25

export function CoupleSection() {
  return (
    /*
     * The artboard is 9:19.5, taller than any browser viewport on a phone, so fitting it whole
     * used to leave background bands down both sides (ANDEV-51). `bleed` fills them with the
     * trims' own overhang instead: the composition still scales exactly as before — nothing is
     * cropped, resized or stretched — the page just now reaches both screen edges.
     */
    <Stage id="couple" artboard={ARTBOARD_REVISED} background={COUPLE_BACKGROUND} bleed={COUPLE_BLEED}>
      {DECOR_LAYERS.map((layer) => (
        <StageImage
          key={layer.key}
          dataAsset={layer.asset}
          src={layer.src}
          x={layer.x}
          y={layer.y}
          assetWidth={layer.width}
          assetHeight={layer.height}
          style={layer.flipped ? { transform: 'scaleX(-1)' } : undefined}
          priority
        />
      ))}

      {TEXT_LAYERS.map((layer) => (
        <StageImage
          key={layer.key}
          dataAsset={layer.asset}
          src={layer.src}
          alt={layer.alt}
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

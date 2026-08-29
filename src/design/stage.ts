/**
 * The invitation is designed on a fixed artboard, one per page, and every source asset is
 * exported @4x — so an asset's intrinsic pixel size divided by 4 is its size in stage units,
 * and that is the only conversion needed to place anything.
 *
 * Sections are laid out in stage units and the whole stage is then scaled to the viewport,
 * which keeps the composition pixel-accurate to the reference at any size.
 *
 * There are two artboard sizes in play while Nahla's feedback revision (ANDEV-51) rolls out
 * page by page, so the size is a per-`Stage` value rather than a module-level constant.
 */
export type Artboard = {
  readonly width: number
  readonly height: number
}

/**
 * The original artboard — pages of `project-info/Asset Undangan Digital.pdf`, sliced from
 * `project-info/per-asset`. Still what sections 2-7 are laid out against.
 */
export const ARTBOARD_ORIGINAL: Artboard = { width: 1080, height: 1920 }

/**
 * The revised artboard — the artwork in `project-info/per-asset-revision`, which Nahla
 * redrew at 1280 x 2772 per page. Section 1 is the first page moved over to it.
 */
export const ARTBOARD_REVISED: Artboard = { width: 1280, height: 2772 }

/** Scale factor the source assets were exported at. */
export const ASSET_SCALE = 4

/** Converts an intrinsic asset dimension (in @4x pixels) to stage units. */
export function fromAssetPx(px: number): number {
  return px / ASSET_SCALE
}

/**
 * Converts stage units to a CSS length that tracks the stage's rendered size.
 *
 * Positions and sizes can be expressed as percentages of the stage, but font sizes and
 * other non-geometric lengths cannot — so the stage is a query container and those
 * lengths are resolved against its width.
 */
export function su(units: number, artboard: Artboard): string {
  return `calc(${units} * 100cqw / ${artboard.width})`
}

/** Aspect ratio of the artboard, as a CSS value. */
export function stageAspect(artboard: Artboard): string {
  return `${artboard.width} / ${artboard.height}`
}

/**
 * Width of a column with the artboard's aspect ratio that is exactly as tall as the viewport.
 *
 * Uses `lvh`, not `dvh`: on iOS Safari/Chrome, `dvh` is re-evaluated live as the address bar
 * collapses mid-scroll, so every section's height (and, through this column, every asset's
 * on-screen size) grew smoothly while a guest was mid-scroll between sections — read as the
 * whole page "zooming in" a little. `lvh` is pinned to the largest viewport (chrome retracted)
 * up front, so the column's size is fixed for the scroll's whole duration; the only cost is
 * that a section can run slightly taller than the viewport while the chrome is still expanded,
 * which just needs a touch more scroll rather than causing a live resize.
 */
export function stageColumn(artboard: Artboard): string {
  return `calc(100lvh * ${artboard.width} / ${artboard.height})`
}

/**
 * Width of the box a bleeding section is clipped to: the stage column plus `bleed` stage
 * units of artwork on each side, but never wider than the viewport.
 *
 * Nahla's revised pages are 1280 x 2772 — 9:19.5, a phone screen with no browser chrome on
 * it. A real browser never gets that, so on most phones the page is limited by height, the
 * column comes out narrower than the screen, and the leftover shows up as background bands
 * down both sides (ANDEV-51). The page is not actually only 1280 wide, though: its edge
 * furniture is drawn past the artboard — section 4's trims run the full 1870.5 units of
 * their canvas — and that overhang is exactly what the bands need. Letting it out of the
 * column and clipping at the viewport instead fills them with the artwork's own continuation,
 * at the artwork's own scale, with nothing cropped and nothing stretched.
 *
 * `min` caps it at the viewport so only as much overhang as a screen actually needs is ever
 * shown; a section whose artwork stops at the artboard edge passes no `bleed` and is unchanged.
 */
export function stageBleedColumn(artboard: Artboard, bleed: number): string {
  return `min(100%, calc(${stageColumn(artboard)} * ${(artboard.width + 2 * bleed) / artboard.width}))`
}

/**
 * Distance from the top of a `line-height: 1` box to the alphabetic baseline, in em.
 *
 * Charter reports ascent 0.98em and descent 0.24em, so a `line-height: 1` box has
 * negative half-leading of (1 - 1.22) / 2, putting the baseline at -0.11 + 0.98.
 * Text is positioned by baseline because that is the one anchor that does not move
 * with the string, unlike the ink top which depends on whether the glyphs have ascenders.
 */
export const CHARTER_BASELINE_EM = 0.87

/**
 * The invitation is designed on a fixed 1080 x 1920 artboard (see
 * `project-info/Asset Undangan Digital.pdf`). Every asset in `project-info/per-asset`
 * is exported @4x, so an asset's intrinsic pixel size divided by 4 is its size in
 * stage units — that is the only conversion needed to place anything.
 *
 * Sections are laid out in stage units and the whole stage is then scaled to the
 * viewport, which keeps the composition pixel-accurate to the reference at any size.
 *
 * This is the *default* artboard every `<Stage>` uses; a section can override it (see
 * `StageProps['width'/'height']` in `Stage.tsx`) when its own reference render was built
 * on a different canvas — e.g. `CoverSection`'s ANDEV-50 art, exported on a 1280 x 2772
 * artboard. The override is per-`<Stage>`, so sections still on the original 1080 x 1920
 * artwork are unaffected.
 */
export const STAGE_WIDTH = 1080
export const STAGE_HEIGHT = 1920

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
 * lengths are resolved against its width. `stageWidth` defaults to the shared artboard's
 * width; a section rendering on an overridden artboard (see `STAGE_WIDTH` above) passes
 * its own width so lengths resolve against the right container query.
 */
export function su(units: number, stageWidth: number = STAGE_WIDTH): string {
  return `calc(${units} * 100cqw / ${stageWidth})`
}

/** Aspect ratio of an artboard, as a CSS value. */
export function stageAspect(width: number, height: number): string {
  return `${width} / ${height}`
}

/** Aspect ratio of the default artboard, as a CSS value. */
export const STAGE_ASPECT = stageAspect(STAGE_WIDTH, STAGE_HEIGHT)

/**
 * Width of a column, at a given artboard aspect ratio, that is exactly as tall as the
 * viewport.
 *
 * Uses `lvh`, not `dvh`: on iOS Safari/Chrome, `dvh` is re-evaluated live as the address bar
 * collapses mid-scroll, so every section's height (and, through this column, every asset's
 * on-screen size) grew smoothly while a guest was mid-scroll between sections — read as the
 * whole page "zooming in" a little. `lvh` is pinned to the largest viewport (chrome retracted)
 * up front, so the column's size is fixed for the scroll's whole duration; the only cost is
 * that a section can run slightly taller than the viewport while the chrome is still expanded,
 * which just needs a touch more scroll rather than causing a live resize.
 */
export function stageColumn(width: number, height: number): string {
  return `calc(100lvh * ${width} / ${height})`
}

/** Column width for the default artboard. */
export const STAGE_COLUMN = stageColumn(STAGE_WIDTH, STAGE_HEIGHT)

/**
 * Distance from the top of a `line-height: 1` box to the alphabetic baseline, in em.
 *
 * Charter reports ascent 0.98em and descent 0.24em, so a `line-height: 1` box has
 * negative half-leading of (1 - 1.22) / 2, putting the baseline at -0.11 + 0.98.
 * Text is positioned by baseline because that is the one anchor that does not move
 * with the string, unlike the ink top which depends on whether the glyphs have ascenders.
 */
export const CHARTER_BASELINE_EM = 0.87

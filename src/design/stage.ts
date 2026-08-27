/**
 * The invitation is designed on a fixed 1080 x 1920 artboard (see
 * `project-info/Asset Undangan Digital.pdf`). Every asset in `project-info/per-asset`
 * is exported @4x, so an asset's intrinsic pixel size divided by 4 is its size in
 * stage units — that is the only conversion needed to place anything.
 *
 * Sections are laid out in stage units and the whole stage is then scaled to the
 * viewport, which keeps the composition pixel-accurate to the reference at any size.
 */
export const STAGE_WIDTH = 1080
export const STAGE_HEIGHT = 1920

/** Scale factor the source assets were exported at. */
export const ASSET_SCALE = 4

/** Converts an intrinsic asset dimension (in @4x pixels) to stage units. */
export function fromAssetPx(px: number): number {
  return px / ASSET_SCALE
}

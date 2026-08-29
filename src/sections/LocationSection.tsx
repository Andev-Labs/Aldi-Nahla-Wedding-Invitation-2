import { Stage, StageEmbed, StageImage, StageSeam, StageText } from '~/components/Stage'
import { ARTBOARD_REVISED } from '~/design/stage'

/**
 * Section 6 — venue & map, on the revised 1280 x 2772 artwork Nahla sent with her feedback
 * revision (`project-info/per-asset-revision/Tempat`, ANDEV-51).
 *
 * `asset` is the source file number in that folder (`Tempat - <n>.png`), which
 * `scripts/build-revised-assets.mjs` turns into the webp under `src`. `x` / `y` are the
 * top-left corner in stage units and `width` / `height` the intrinsic @4x pixel sizes of the
 * source PNGs *after cropping* — `StageImage` divides by 4 to get stage units, so the source
 * stays the one place that size is written down.
 *
 * The background is unchanged: asset 4, the artboard-sized plate, is byte-identical to section
 * 5's and is the same flat `#061A17`.
 *
 * The map is still not artwork. The original export (asset 50) flattened the venue name and
 * address, a static QR code and a "Scan Di sini" caption into one PNG; a QR code that only ever
 * points at one fixed Maps pin does not need scanning, so it was replaced with a live embed and
 * a real link. The revised set draws the same conclusion on its own — asset 2 is the venue text
 * with no QR code at all — so the embed and link stay, re-measured for this artboard.
 *
 * ## How these positions were arrived at
 *
 * The two artwork layers pin themselves: asset 1's canvas is exactly the artboard's height, so
 * it sits at y = 0, and both of its bands are centred on that canvas to within a pixel. The card
 * is section 5's, at section 5's position — the old page put it at 141/361 against section 5's
 * 140/362, i.e. the two pages share the layout, and the revision has not changed that.
 *
 * What had to be derived is what sits *inside* the card, and there the revised artwork supplies
 * the scale: the two address lines are set in the same words as before, at 2089/1869 and
 * 1569/1404 of their old width, and "Bertempat di:" at 629/562 — three independent measurements
 * of the same 1.1178. Note that this is not section 5's 1.2018; each page was redrawn on its own
 * terms rather than the set being scaled as a whole.
 *
 * - **Horizontal**: asset 2 sits 132.9 units in from each side of the card, 15.53% of its width.
 *   The old page's map inset was 15.54%, so the map is given the same margins, which makes it
 *   exactly as wide as the venue block above it.
 * - **Vertical**: the block runs venue text -> map -> link, with the old page's gaps between them
 *   scaled by the card's own 1.1071, and the whole block placed so the space above and below it
 *   keeps the old page's 177:217 ratio. It ends up occupying more of the card than before (71%
 *   against 64%) because the revised venue block is half as tall again — Nahla set "Kediaman
 *   Mempelai Wanita" over two lines where it used to be one.
 *
 * Declared bottom-to-top; DOM order is the stacking order. Variants are carried over unchanged:
 * the venue text, the map and the link animate in, and the foliage and card stay static.
 */
const BEFORE_MAP_LAYERS = [
  // Asset 3 — the cream card with the house composited onto it, as on section 5.
  { asset: 3, key: 'card', src: '/assets/section-06/card.webp', x: 89.875, y: 522.35, width: 4401, height: 5893, variant: undefined },
  { asset: 2, key: 'venue', src: '/assets/section-06/venue.webp', x: 345, y: 672.45, width: 2360, height: 1318, variant: 'scaleIn' },
] as const

/**
 * Asset 1's two bands — the flower frame — which are halves of the clusters this page shares
 * with the pages either side of it, so both are placed against a section boundary rather than
 * on the artboard (ANDEV-55). See `StageSeam`.
 *
 * The top band is the lower half of `Sambungan/Waktu - Tempat.png`, whose upper half is section
 * 5's bottom foliage — this is the join in the report, the one Nahla photographed. The bottom
 * band is the upper half of `Sambungan/Tempat - RSVP.png`, whose lower half is section 7's top
 * foliage. Both used to be cut from asset 1 and hung on the artboard's own edges, which under
 * `fill` are not where the screen's are.
 *
 * As on section 5, the foot of the frame now sits over the house rather than clearing its base:
 * the screen's bottom edge is above the artboard's, so the band lands that much higher up the
 * page. It is declared last either way, which is the order the design assumes.
 */
const FRAME = {
  top: { src: '/assets/section-06/top-foliage.webp', width: 7225, height: 2899 },
  bottom: { src: '/assets/section-06/bottom-foliage.webp', width: 7225, height: 2828 },
} as const

/** Asset 4 is the background plate: an artboard-sized export of nothing but this colour. */
const LOCATION_BACKGROUND = '#061a17'

const VENUE_ALT =
  'Bertempat di Kediaman Mempelai Wanita, Jl. Sawah Barat dlm II, RT.001/RW.06, Pondok Bambu, Duren Sawit'

/** The venue the couple shared — resolves to a car park right by "Kediaman Mempelai Wanita". */
const LOCATION_MAPS_LINK = 'https://maps.app.goo.gl/hsEgzZNjyDdzSbYZ8'

/**
 * `cid` is the Google-internal id of the single place the share link above resolves to —
 * the decimal form of the `ftid` pair's second half (`0xc4339d17d79cae7d`). Passing it
 * alongside `output=embed` drops one pin on exactly that place without a Maps API key.
 * A `q=` text query is what the embed used before, and it ran a *search*: the neighbouring
 * "lahan parkir umum" scored high enough to be plotted too, so the map showed two pins.
 */
const LOCATION_MAPS_EMBED_SRC =
  'https://www.google.com/maps?cid=14137816380973297277&z=15&output=embed'

export function LocationSection() {
  return (
    <Stage id="location" artboard={ARTBOARD_REVISED} background={LOCATION_BACKGROUND} fit="fill">
      {/* Declared first, so the card sits over the foliage as it did when the foliage was the
          page's first layer — the band reaches well past the card's top edge. */}
      <StageSeam src={FRAME.top.src} anchor="top" assetWidth={FRAME.top.width} assetHeight={FRAME.top.height} />

      {BEFORE_MAP_LAYERS.map((layer) => (
        <StageImage
          key={layer.key}
          dataAsset={layer.asset}
          src={layer.src}
          x={layer.x}
          y={layer.y}
          assetWidth={layer.width}
          assetHeight={layer.height}
          variant={layer.variant}
          alt={layer.key === 'venue' ? VENUE_ALT : undefined}
          priority
        />
      ))}

      {/* Same 15.5% card margins as the venue block above, so the two line up. */}
      <StageEmbed
        src={LOCATION_MAPS_EMBED_SRC}
        title="Peta lokasi acara"
        x={345}
        y={1062.55}
        width={590}
        height={418}
        variant="scaleIn"
        className="rounded-2xl border-2 border-[#193938]"
      />

      <StageText x={640} baseline={1530.35} size={29} color="#193938" align="center" href={LOCATION_MAPS_LINK} variant="fadeUp">
        Buka di Google Maps ↗
      </StageText>

      {/* Declared last, over the house — the order the design assumes. */}
      <StageSeam
        src={FRAME.bottom.src}
        anchor="bottom"
        assetWidth={FRAME.bottom.width}
        assetHeight={FRAME.bottom.height}
      />
    </Stage>
  )
}
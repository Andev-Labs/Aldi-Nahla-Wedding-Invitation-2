import { Stage, StageEmbed, StageImage, StageText } from '~/components/Stage'

/**
 * Section 6 — venue & map (page 6 of `Asset Undangan Digital.pdf`).
 *
 * Flat `#061A17` background, full-bleed — same as sections 2 and 5.
 *
 * `asset` is the original file number in `project-info/per-asset` (`Asset <n>@4x.png`).
 * `x` / `y` are the top-left corner in stage units; `width` / `height` are the intrinsic
 * @4x pixel sizes. Positions were recovered by matching each export against the reference
 * render. The card (40) and house (41) are the exact same assets and positions as section
 * 5 — this page reuses that layout wholesale and swaps only the card's content. Assets
 * 47/48 (the foliage sprigs) are each used twice on this one page: once as the top corners,
 * once as the bottom corners, at different y.
 *
 * The original export (asset 50, `location-card.png`) flattened the venue name/address, a
 * static QR-code graphic and a "Scan Di sini" caption into one PNG. A QR code that only
 * ever points at one fixed Google Maps pin doesn't need scanning — so the QR/caption half
 * of that asset was cropped away (`location-card-address.png` keeps just the top,
 * text-only half) and replaced with a live `StageEmbed` iframe plus a real "open in Maps"
 * link, both driven by the address the couple shared.
 *
 * Declared bottom-to-top; DOM order is the stacking order. Only the location card text and
 * the map embed animate in — the frame, house and foliage are decorative and stay static.
 */
const BEFORE_MAP_LAYERS = [
  { asset: 47, key: 'foliage-top-left', src: '/assets/section-06/foliage-a.webp', x: -150, y: -461, width: 2591, height: 3931, variant: undefined },
  { asset: 48, key: 'foliage-top-right', src: '/assets/section-06/foliage-b.webp', x: 583, y: -462, width: 2587, height: 3932, variant: undefined },
  { asset: 40, key: 'card', src: '/assets/section-06/card.webp', x: 141, y: 361, width: 3192, height: 4324, variant: undefined },
  { asset: 50, key: 'location-card-address', src: '/assets/section-06/location-card-address.webp', x: 208, y: 534, width: 2601, height: 780, variant: 'scaleIn' },
] as const

const AFTER_MAP_LAYERS = [
  { asset: 41, key: 'house', src: '/assets/section-06/house.webp', x: 57, y: 1265, width: 3868, height: 1330, variant: undefined },
  { asset: 47, key: 'foliage-bottom-left', src: '/assets/section-06/foliage-a.webp', x: -150, y: 1458, width: 2591, height: 3931, variant: undefined },
  { asset: 48, key: 'foliage-bottom-right', src: '/assets/section-06/foliage-b.webp', x: 584, y: 1458, width: 2587, height: 3932, variant: undefined },
] as const

const LOCATION_BACKGROUND = '#061a17'

/** The venue the couple shared — resolves to a car park right by "Kediaman Mempelai Wanita". */
const LOCATION_MAPS_LINK = 'https://maps.app.goo.gl/azCjyatufgPnTA21A?g_st=ic'

/**
 * `ftid` is the Google-internal feature id the share link above resolves to — passing it
 * alongside `output=embed` pins the embed to that exact place without needing a Maps API key.
 */
const LOCATION_MAPS_EMBED_SRC =
  'https://www.google.com/maps?q=Parkiran+mobil+umum+(bang+Jack),+Jl.+Buluh+Perindu+Raya,+Pondok+Bambu,+Duren+Sawit&ftid=0x2e69f300560f4b91:0xc4339d17d79cae7d&output=embed'

export function LocationSection() {
  return (
    <Stage id="location" background={LOCATION_BACKGROUND} fit="fill">
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
          priority
        />
      ))}

      <StageEmbed
        src={LOCATION_MAPS_EMBED_SRC}
        title="Peta lokasi acara"
        x={265}
        y={790}
        width={550}
        height={390}
        variant="scaleIn"
        className="rounded-2xl border-2 border-[#193938]"
      />

      <StageText x={540} baseline={1225} size={26} color="#193938" align="center" href={LOCATION_MAPS_LINK} variant="fadeUp">
        Buka di Google Maps ↗
      </StageText>

      {AFTER_MAP_LAYERS.map((layer) => (
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

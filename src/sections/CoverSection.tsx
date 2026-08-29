import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSearch } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Stage, StageImage, StageText } from '~/components/Stage'
import { ARTBOARD_REVISED } from '~/design/stage'

/**
 * The original artwork's own label (`Amplop Undangan - 4.png`) — shown when the link carries
 * no `?to=` guest name, e.g. a bare share of the invitation. Exported so `/tamu`'s WhatsApp
 * template falls back to the same placeholder instead of inventing a second one.
 */
export const FALLBACK_GUEST_NAME = 'Nama Tamu Undangan'

/**
 * The guest name slot has room for two lines before it runs into the salutation above it (see
 * `CoverSection`'s guest-name `StageText`, which stacks upwards). A name from the URL has no
 * length limit of its own, so it's clamped here to keep that layout intact.
 *
 * This is the *readability* bound, not the layout guarantee — a single 40-character word still
 * wraps past two lines, so the `StageText` also carries `maxLines={2}` as the hard backstop.
 */
const MAX_GUEST_NAME_LENGTH = 40

function clampGuestName(name: string): string {
  return name.length > MAX_GUEST_NAME_LENGTH ? `${name.slice(0, MAX_GUEST_NAME_LENGTH - 1).trimEnd()}…` : name
}

/** How long the card-lift/seal-break open animation takes to settle before we scroll away. */
const OPEN_ANIMATION_MS = 900

/**
 * Section 1 — the envelope cover, on the revised 1280 x 2772 artwork Nahla sent with her
 * feedback revision (`project-info/per-asset-revision/Amplop Undangan`, ANDEV-51).
 *
 * `asset` is the source file number in that folder (`Amplop Undangan - <n>.png`), which
 * `scripts/build-section-01-assets.mjs` turns into the webp under `src`. `x` / `y` are the
 * top-left corner in stage units and `width` / `height` the intrinsic @4x pixel sizes of the
 * source PNGs — not of the downscaled webp, since `StageImage` divides by 4 to get the size
 * in stage units and the source stays the one place that size is written down.
 *
 * Every position and stacking decision here was recovered by compositing the layers against
 * Nahla's reference render of the finished page and minimising the per-pixel error, not
 * estimated by eye; the result matches it to 1.6/255 mean absolute error.
 *
 * One thing that does not survive as flat layers: in the reference, asset 5's top-left
 * cluster is interleaved with the card rather than wholly behind it — the leaves pass under
 * the card's left edge but the heliconia spike crosses over it. It ships behind the card,
 * which is what most of that overlap wants; the cost is ~470 pixels of the frame where a
 * sliver of that spike is hidden. Splitting the spike out of the cluster is the fix if it
 * ever reads as wrong at real size.
 *
 * The decorative artwork splits either side of the envelope, so it comes as two arrays rather
 * than one: the leaves tuck in behind it, the flower bunches sit in front of the card. Both
 * are static — no reveal. `envelope`, `card` and `wax-seal` are inline below, between the two,
 * because they carry the open-envelope interaction. Declared bottom-to-top; DOM order is the
 * stacking order.
 *
 * Asset 5 holds both leaf clusters on one canvas with ~400 stage units of empty space between
 * them, so it is cropped into `foliage-tl` / `foliage-br` — each cluster sits behind its own
 * flower bunch anyway, and neither layer then pays to decode the other's dead space.
 */
const FOLIAGE_LAYERS = [
  { asset: 5, key: 'foliage-tl', src: '/assets/section-01/foliage-tl.webp', x: 124.75, y: 892.25, width: 1226, height: 1212 },
  { asset: 5, key: 'foliage-br', src: '/assets/section-01/foliage-br.webp', x: 829.75, y: 1434.25, width: 1303, height: 1219 },
] as const

const FLORAL_LAYERS = [
  { asset: 6, key: 'floral-tl', src: '/assets/section-01/floral-tl.webp', x: 238.2, y: 922.6, width: 920, height: 1245 },
  { asset: 7, key: 'floral-br', src: '/assets/section-01/floral-br.webp', x: 801.4, y: 1379.6, width: 959, height: 812 },
] as const

/**
 * Radial vignette: a cream core falling to warm grey at the corners.
 *
 * This is the revised background plate (`Amplop Undangan - 10.png`) as CSS rather than a
 * 5120 x 11089 PNG. The ellipse was fitted by searching for the centre and radii that make
 * the plate's colour a pure function of elliptical radius, then the stops were read off that
 * radial profile; it tracks the plate to 0.3/255 mean absolute error, 1.9/255 at worst.
 * Stops run past 100% because the artboard's corners sit at ~1.42 of the fitted radius.
 */
const COVER_BACKGROUND =
  'radial-gradient(ellipse 53.5% 51% at 48.25% 47.25%,' +
  '#edeae2 0%, #edeae2 62%, #e4e1d9 78%, #d5d2cb 97%, #c8c6bf 110%, #b4b2ac 128%, #b2b0aa 140%)'

export function CoverSection() {
  const [isOpen, setIsOpen] = useState(false)
  // Flips true once the open animation + auto-scroll have fully settled on `#hero`; from
  // then on the cover unmounts entirely (see the `isCollapsed` guard below) rather than just
  // losing its scroll lock, because a plain unlock still leaves the cover in the document
  // for a guest to scroll straight back up into (ANDEV-44 follow-up).
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const openInvitation = () => {
    setIsOpen(true)
    // Fire audio.play() synchronously inside the click handler so the browser still
    // attributes it to the user gesture; a delayed call (e.g. inside the setTimeout
    // below) would get blocked by autoplay policies.
    void audioRef.current?.play()
    window.setTimeout(() => {
      // Sections are sized off `lvh`, not `dvh` (see `stageColumn`), so their height no longer
      // shifts as the mobile address bar collapses mid-scroll. Re-issuing an immediate scroll
      // once the smooth one settles is now just a defensive re-measure of `#hero` in case
      // anything else nudged scroll position during the animation.
      document.querySelector('#hero')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.setTimeout(() => {
        document.querySelector('#hero')?.scrollIntoView({ behavior: 'instant', block: 'start' })
        setIsCollapsed(true)
      }, OPEN_ANIMATION_MS)
    }, OPEN_ANIMATION_MS)
  }

  // Removing the cover shifts every later section up by its own height, which would jump
  // whatever's on screen unless the scroll position is corrected in the same breath. Doing
  // that correction here (layout effect, so it lands before the browser paints the unmount)
  // rather than inline in `openInvitation` keeps it tied to the unmount itself instead of to
  // one particular caller. Target is always 0: hero is now the first section in the document,
  // and the guest is already looking at its top edge from the `scrollIntoView` above.
  useLayoutEffect(() => {
    if (!isCollapsed) return
    window.scrollTo(0, 0)
  }, [isCollapsed])

  // Locks page scroll until the guest taps "Buka Undangan" (ANDEV-44): without this, a
  // guest could scroll straight past the cover into the rest of the invitation and skip
  // the open-envelope reveal (and the backsound gesture it grants) entirely.
  useEffect(() => {
    if (isOpen) return
    const { documentElement, body } = document
    const previous = {
      htmlOverflow: documentElement.style.overflow,
      htmlHeight: documentElement.style.height,
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
      bodyOverscroll: body.style.overscrollBehavior,
    }
    documentElement.style.overflow = 'hidden'
    documentElement.style.height = '100%'
    body.style.overflow = 'hidden'
    body.style.height = '100%'
    body.style.overscrollBehavior = 'none'

    // `overflow: hidden` alone doesn't stop iOS Safari's touch-drag scroll/rubber-band,
    // so block touchmove directly while the lock is active.
    const preventTouchMove = (event: TouchEvent) => event.preventDefault()
    document.addEventListener('touchmove', preventTouchMove, { passive: false })

    return () => {
      documentElement.style.overflow = previous.htmlOverflow
      documentElement.style.height = previous.htmlHeight
      body.style.overflow = previous.bodyOverflow
      body.style.height = previous.bodyHeight
      body.style.overscrollBehavior = previous.bodyOverscroll
      document.removeEventListener('touchmove', preventTouchMove)
    }
  }, [isOpen])

  // Toggles the backsound on/off via the sound indicator (ANDEV-39). Muting rather than
  // pausing keeps the track's position (and its autoplay-gesture grant) intact, so turning
  // it back on doesn't need another `.play()` call.
  const toggleSound = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !audio.muted
    setIsMuted(audio.muted)
  }

  // `strict: false` so this also renders cleanly under `/preview/$section`, which has no
  // `?to=` search schema of its own.
  const { to } = useSearch({ strict: false })
  const guestName = to?.trim() ? clampGuestName(to.trim()) : FALLBACK_GUEST_NAME

  return (
    <>
      {/*
        Rendered as a sibling of `<Stage>`, not a child — `fixed` positioning needs to
        resolve against the viewport, not whichever section's `<motion.section>` happens to
        be its containing block. Once opened, it stays pinned to the same corner across
        every section as the guest scrolls, since the backsound keeps playing throughout.
      */}
      <AnimatePresence>{isOpen && <SoundToggle muted={isMuted} onToggle={toggleSound} />}</AnimatePresence>

      {/*
        Also a sibling of `Stage`, and unconditionally mounted (unlike it) — the backsound
        `openInvitation` starts needs to keep playing straight through the cover unmounting
        below, not restart or cut out with it.
      */}
      <audio ref={audioRef} src="/audio/backsound.mp3" loop preload="auto" />

      {/*
        Torn down once `isCollapsed` (see the layout effect above) so there's nothing left in
        the document for a guest to scroll back up into.
      */}
      {!isCollapsed && (
        <Stage id="cover" artboard={ARTBOARD_REVISED} background={COVER_BACKGROUND}>
          {FOLIAGE_LAYERS.map((layer) => (
            <StageImage
              key={layer.key}
              dataAsset={layer.asset}
              src={layer.src}
              x={layer.x}
              y={layer.y}
              assetWidth={layer.width}
              assetHeight={layer.height}
              priority
            />
          ))}

          {/* Asset 9 — envelope. Decorative backdrop for the card; static. */}
          <StageImage
            dataAsset={9}
            src="/assets/section-01/envelope.webp"
            x={262.1}
            y={801.4}
            assetWidth={3006}
            assetHeight={3161}
            priority
          />

          {/*
            Asset 8 — the card tucked in the envelope. On open it lifts and settles forward,
            as if being drawn out.

            The export is already clipped to the shape that shows above the envelope's front
            flap — squared off at the top, cut to a wide inverted V at the bottom — so it
            stacks *over* the envelope rather than being sandwiched inside it.
          */}
          <StageImage
            dataAsset={8}
            src="/assets/section-01/card.webp"
            x={305.4}
            y={944.3}
            assetWidth={2654}
            assetHeight={1620}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={isOpen ? { opacity: 1, y: -32, scale: 1.03 } : { opacity: 1, y: 0, scale: 1 }}
            priority
          />

          {/*
            Asset 1 — wax seal. Doubles as the open-envelope hit target: tapping it "breaks"
            the seal (shrinks, spins and fades away) and lifts the card above.
          */}
          <StageImage
            dataAsset={1}
            src="/assets/section-01/wax-seal.webp"
            x={566}
            y={1282}
            assetWidth={562}
            assetHeight={572}
            interactive={!isOpen}
            onClick={openInvitation}
            whileHover={!isOpen ? { scale: 1.06 } : undefined}
            whileTap={!isOpen ? { scale: 0.92 } : undefined}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={isOpen ? { opacity: 0, scale: 0, rotate: 35 } : { opacity: 1, scale: 1, rotate: 0 }}
            // A wax seal cracking is a quick, decisive snap, not a gentle settle — stiffer and
            // lighter than the default spring so it reads as breaking rather than drifting shut.
            transition={{ type: 'spring', stiffness: 260, damping: 20, mass: 0.6, opacity: { duration: 0.35, ease: 'easeOut' } }}
            priority
          />

          {FLORAL_LAYERS.map((layer) => (
            <StageImage
              key={layer.key}
              dataAsset={layer.asset}
              src={layer.src}
              x={layer.x}
              y={layer.y}
              assetWidth={layer.width}
              assetHeight={layer.height}
              priority
            />
          ))}

          {/*
            Asset 3 — "Kepada Yth. / Bapak/Ibu/Saudara/i", the rule under the guest name, and
            the disclaimer under the button. One export in the revised set, where the original
            artwork had the rule as its own file. Content.
          */}
          <StageImage
            dataAsset={3}
            src="/assets/section-01/salutation.webp"
            alt="Kepada Yth. Bapak/Ibu/Saudara/i"
            x={350.6}
            y={1637}
            assetWidth={2295}
            assetHeight={1360}
            variant="fadeUp"
            priority
          />

          {/*
            Asset 4 slot — the reference artwork was a static "Nama Tamu Undangan" label; this
            is now live text filled from the `?to=` query param (ANDEV-37).

            Weight, size and baseline were matched against that artwork by rendering the page
            headlessly and minimising the per-pixel error over this band: Charter *Bold* at
            44.6, not Black, which is what makes the stroke weight and the 467.8-unit ink width
            of the placeholder land together — Black at any size that fits the width comes out
            visibly heavier.

            `baselineOf="last"` because the rule sits only ~14 stage units below that baseline
            now that it's baked into the salutation above — a name long enough to wrap has to
            stack up into the gap under the salutation instead of down through the rule.
          */}
          <StageText
            x={636.8}
            baseline={1779}
            baselineOf="last"
            size={44.6}
            weight={700}
            color="#720e2b"
            align="center"
            maxWidth={560}
            maxLines={2}
            variant="fadeUp"
          >
            {guestName}
          </StageText>

          {/*
            Asset 2 — "Buka Undangan". Same tap target as the wax seal; fades once opened.
            While closed it breathes a soft gold glow (ANDEV-44) — a cue that this is the one
            thing on the page a guest needs to tap, now that scrolling past it is locked.
          */}
          <StageImage
            dataAsset={2}
            src="/assets/section-01/open-button.webp"
            alt="Buka Undangan"
            x={400.5}
            y={1823.5}
            assetWidth={1888}
            assetHeight={495}
            interactive={!isOpen}
            onClick={openInvitation}
            whileHover={!isOpen ? { scale: 1.03 } : undefined}
            whileTap={!isOpen ? { scale: 0.96 } : undefined}
            initial={{ opacity: 0, y: 28 }}
            animate={
              isOpen
                ? { opacity: 0, y: 12 }
                : {
                    opacity: 1,
                    y: 0,
                    scale: [1, 1.05, 1],
                    filter: [
                      'drop-shadow(0 0 0px rgba(183, 139, 78, 0))',
                      'drop-shadow(0 0 22px rgba(183, 139, 78, 0.9))',
                      'drop-shadow(0 0 0px rgba(183, 139, 78, 0))',
                    ],
                  }
            }
            transition={
              isOpen
                ? { duration: 0.35, ease: 'easeOut' }
                : {
                    opacity: { duration: 0.5, ease: 'easeOut' },
                    y: { type: 'spring', stiffness: 140, damping: 20, mass: 0.8 },
                    scale: { duration: 1.4, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.3 },
                    filter: { duration: 1.4, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.3 },
                  }
            }
            priority
          />
        </Stage>
      )}
    </>
  )
}

/**
 * Speaker glyph for `SoundToggle` — waves when the backsound is on, a strike-through when
 * muted. Inline SVG rather than an asset: this control has no equivalent in the original
 * artwork (see ANDEV-39), so there is no reference PNG to export it from.
 */
function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      {muted ? (
        <path d="M16 9.5 21 14.5M21 9.5 16 14.5" />
      ) : (
        <>
          <path d="M16.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.7 6a8 8 0 0 1 0 12" opacity={0.6} />
        </>
      )}
    </svg>
  )
}

type SoundToggleProps = {
  muted: boolean
  onToggle: () => void
}

/**
 * The sound indicator requested in ANDEV-39: a floating control in the top-right corner
 * that turns the backsound (started by `openInvitation`) on or off.
 */
function SoundToggle({ muted, onToggle }: SoundToggleProps) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-label={muted ? 'Nyalakan backsound' : 'Matikan backsound'}
      aria-pressed={!muted}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileTap={{ scale: 0.9 }}
      className="fixed z-50 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#b78b4e] bg-[#061a17]/70 text-[#edeae2] shadow-lg backdrop-blur-sm"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
        right: 'calc(env(safe-area-inset-right, 0px) + 1rem)',
      }}
    >
      <SpeakerIcon muted={muted} />
    </motion.button>
  )
}

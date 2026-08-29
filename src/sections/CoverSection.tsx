import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSearch } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Stage, StageImage, StageText } from '~/components/Stage'

/**
 * The original artwork's own label (`Asset 11@4x.png`) — shown when the link carries no
 * `?to=` guest name, e.g. a bare share of the invitation. Exported so `/tamu`'s WhatsApp
 * template falls back to the same placeholder instead of inventing a second one.
 */
export const FALLBACK_GUEST_NAME = 'Nama Tamu Undangan'

/**
 * The guest name slot wraps to at most two lines before it runs into the rule below it (see
 * `CoverSection`'s guest-name `StageText`). A name from the URL has no length limit of its
 * own, so it's clamped here to keep that layout intact for any input.
 */
const MAX_GUEST_NAME_LENGTH = 40

/**
 * Cover artboard size (ANDEV-50) — Kak Nahla's replacement art for this section was exported
 * on a 1280 x 2772 canvas, not the invitation's usual 1080 x 1920 (see `project-info/per-asset-revision/Amplop Undangan`,
 * where every asset is still @4x but the full-bleed background layer is 5120 x 11089 ≈ 1280 x
 * 2772 @4x). Passed as `Stage`'s `width`/`height` override so only this section's coordinate
 * space changes — every other section stays on the shared 1080 x 1920 artboard untouched.
 */
const COVER_STAGE_WIDTH = 1280
const COVER_STAGE_HEIGHT = 2772

function clampGuestName(name: string): string {
  return name.length > MAX_GUEST_NAME_LENGTH ? `${name.slice(0, MAX_GUEST_NAME_LENGTH - 1).trimEnd()}…` : name
}

/** How long the card-lift/seal-break open animation takes to settle before we scroll away. */
const OPEN_ANIMATION_MS = 900

/**
 * Section 1 — the envelope cover (ANDEV-50 replaces every asset here with Kak Nahla's new
 * artwork; see `project-info/per-asset-revision/Amplop Undangan`).
 *
 * `x` / `y` are the top-left corner in stage units (on the `COVER_STAGE_WIDTH` x
 * `COVER_STAGE_HEIGHT` artboard above), eyeballed against the individual layer exports —
 * unlike the rest of the invitation, this revision shipped as ten cropped per-layer PNGs
 * with no full-page mockup or updated reference PDF to match positions against (the only
 * `project-info/*.pdf` on hand is still the *old* 1080 x 1920 deck), so these are a
 * best-effort composition, not a pixel-matched one. Flag anything that looks off.
 * `width` / `height` are the intrinsic @4x pixel sizes of the PNGs.
 *
 * `envelope` and `wax-seal` are pulled out of this array (below) because they carry the
 * open-envelope interaction. The rest are decorative — static, no reveal. Declared
 * bottom-to-top; DOM order is the stacking order.
 */
const LAYERS = [
  // The two corner clusters are pre-composited into one export (positions relative to each
  // other are already baked in) — sat behind the envelope/tag so only their edges peek out.
  { key: 'floral-frame', src: '/assets/section-01/floral-frame.webp', x: 113, y: 30, width: 4219, height: 3441 },
  { key: 'floral-accent-b', src: '/assets/section-01/floral-accent-b.webp', x: 40, y: 1550, width: 959, height: 812 },
  { key: 'floral-accent-a', src: '/assets/section-01/floral-accent-a.webp', x: 1010, y: 1750, width: 920, height: 1245 },
] as const

/**
 * Radial vignette: a cream core falling to warm grey at the corners. The ellipse and
 * stops were least-squares fitted against the background-only pixels of the reference
 * render, so it tracks the original to within ~1/255 on average.
 *
 * ANDEV-50's revision includes a full-bleed background layer (`Amplop Undangan - 10.png`)
 * that renders visually identical to this gradient, so it's kept as CSS rather than
 * swapping in an 800KB raster of the same vignette.
 */
const COVER_BACKGROUND =
  'linear-gradient(180deg, rgba(0,0,0,0) 46%, rgba(0,0,0,0.025) 100%),' +
  'radial-gradient(ellipse 86% 58% at 50% 48%, #edeae2 0%, #edeae2 56%, #e5e2db 72%, #d7d4cd 86%, #c8c6bf 100%)'

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
      // Sections are sized off `lvh`, not `dvh` (see `STAGE_COLUMN`), so their height no longer
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
        <Stage id="cover" background={COVER_BACKGROUND} width={COVER_STAGE_WIDTH} height={COVER_STAGE_HEIGHT}>
          {/*
            The corner florals sit behind the tag/envelope/seal cluster so only their edges
            peek out around it, same framing role the old floral layers played.
          */}
          {LAYERS.map((layer) => (
            <StageImage key={layer.key} src={layer.src} x={layer.x} y={layer.y} assetWidth={layer.width} assetHeight={layer.height} priority />
          ))}

          {/*
            New in this revision — a monogram tag ("N", 26.9.5) with no equivalent in the old
            artwork. Hangs above the envelope, overlapping its top flap. Decorative; static.
          */}
          <StageImage
            dataAsset={8}
            src="/assets/section-01/monogram-tag.webp"
            x={308}
            y={10}
            assetWidth={2654}
            assetHeight={1620}
            priority
          />

          {/* Envelope — decorative backdrop for the seal/salutation below it; static. */}
          <StageImage
            dataAsset={9}
            src="/assets/section-01/envelope.webp"
            x={264}
            y={300}
            assetWidth={3006}
            assetHeight={3161}
            priority
          />

          {/*
            Wax seal. Doubles as the open-envelope hit target: tapping it "breaks" the seal
            (shrinks, spins and fades away). This revision has no separate card element to lift
            out from behind it — the salutation block below sits directly on the envelope.
          */}
          <StageImage
            dataAsset={1}
            src="/assets/section-01/wax-seal.webp"
            x={570}
            y={632}
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

          {/*
            "Kepada Yth. / Bapak/Ibu/Saudara/i" plus the disclaimer line — this revision bakes
            both into one export, with the rule pre-drawn below the salutation and a blank gap
            between them for the guest name (see the `StageText` below). Content.
          */}
          <StageImage
            dataAsset={3}
            src="/assets/section-01/salutation.webp"
            alt="Kepada Yth. Bapak/Ibu/Saudara/i"
            x={353}
            y={1170}
            assetWidth={2295}
            assetHeight={1360}
            variant="fadeUp"
            priority
          />

          {/*
            The reference artwork's own label for this slot was a static "Nama Tamu Undangan"
            (`Amplop Undangan - 4.png`); this is live text filled from the `?to=` query param
            (ANDEV-37), sat in the blank gap `salutation.webp` leaves between its heading and
            its rule, centred and wrapping within `maxWidth` since a real guest name's length
            isn't fixed the way the placeholder string's was.
          */}
          <StageText
            x={640}
            baseline={1310}
            size={32}
            weight={900}
            color="#720e2b"
            align="center"
            maxWidth={520}
            variant="fadeUp"
          >
            {guestName}
          </StageText>

          {/*
            "Buka Undangan". Same tap target as the wax seal; fades once opened. While closed
            it breathes a soft gold glow (ANDEV-44) — a cue that this is the one thing on the
            page a guest needs to tap, now that scrolling past it is locked.
          */}
          <StageImage
            dataAsset={2}
            src="/assets/section-01/open-button.webp"
            alt="Buka Undangan"
            x={404}
            y={1926}
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

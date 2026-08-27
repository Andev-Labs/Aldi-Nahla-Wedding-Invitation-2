import { useEffect, useRef, useState } from 'react'
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
 * The guest name slot wraps to at most two lines before it runs into the rule/button below
 * it (see `CoverSection`'s guest-name `StageText`). A name from the URL has no length limit
 * of its own, so it's clamped here to keep that layout intact for any input.
 */
const MAX_GUEST_NAME_LENGTH = 40

function clampGuestName(name: string): string {
  return name.length > MAX_GUEST_NAME_LENGTH ? `${name.slice(0, MAX_GUEST_NAME_LENGTH - 1).trimEnd()}…` : name
}

/** How long the card-lift/seal-break open animation takes to settle before we scroll away. */
const OPEN_ANIMATION_MS = 900

/**
 * Section 1 — the envelope cover (page 1 of `Asset Undangan Digital.pdf`).
 *
 * `asset` is the original file number in `project-info/per-asset` (`Asset <n>@4x.png`).
 * `x` / `y` are the top-left corner in stage units and were recovered by matching each
 * export against the reference render, not estimated by eye. `width` / `height` are the
 * intrinsic @4x pixel sizes of the PNGs.
 *
 * `card` and `wax-seal` are pulled out of this array (below) because they carry the
 * open-envelope interaction. The florals here are decorative — static, no reveal.
 * Declared bottom-to-top; DOM order is the stacking order.
 */
const LAYERS = [
  { asset: 1, key: 'floral-tl-back', src: '/assets/section-01/floral-tl-back.webp', x: 69, y: 495, width: 1185, height: 1153 },
  { asset: 2, key: 'floral-tl-front', src: '/assets/section-01/floral-tl-front.webp', x: 181, y: 528, width: 841, height: 1125 },
  { asset: 6, key: 'floral-br-back', src: '/assets/section-01/floral-br-back.webp', x: 703, y: 978, width: 1253, height: 1161 },
  { asset: 7, key: 'floral-br-front', src: '/assets/section-01/floral-br-front.webp', x: 686, y: 937, width: 869, height: 741 },
] as const

/**
 * Radial vignette: a cream core falling to warm grey at the corners. The ellipse and
 * stops were least-squares fitted against the background-only pixels of the reference
 * render, so it tracks the original to within ~1/255 on average.
 */
const COVER_BACKGROUND =
  'linear-gradient(180deg, rgba(0,0,0,0) 46%, rgba(0,0,0,0.025) 100%),' +
  'radial-gradient(ellipse 86% 58% at 50% 48%, #edeae2 0%, #edeae2 56%, #e5e2db 72%, #d7d4cd 86%, #c8c6bf 100%)'

export function CoverSection() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const openInvitation = () => {
    setIsOpen(true)
    // Fire audio.play() synchronously inside the click handler so the browser still
    // attributes it to the user gesture; a delayed call (e.g. inside the setTimeout
    // below) would get blocked by autoplay policies.
    void audioRef.current?.play()
    window.setTimeout(() => {
      // Every section is `h-dvh`: on mobile, the address bar collapses as this scroll gets
      // under way, which grows `dvh` (and so every section's real height) mid-flight. Re-issuing
      // an immediate scroll once the smooth one settles re-measures `#hero` against the
      // now-collapsed chrome and snaps out any drift left by that growth.
      document.querySelector('#hero')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.setTimeout(() => {
        document.querySelector('#hero')?.scrollIntoView({ behavior: 'instant', block: 'start' })
      }, OPEN_ANIMATION_MS)
    }, OPEN_ANIMATION_MS)
  }

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

      <Stage id="cover" background={COVER_BACKGROUND}>
        <audio ref={audioRef} src="/audio/backsound.mp3" loop preload="auto" />

        {/* Asset 3 — envelope. Decorative backdrop for the card; static. */}
        <StageImage
          dataAsset={3}
          src="/assets/section-01/envelope.webp"
          x={201}
          y={417}
          assetWidth={2712}
          assetHeight={2856}
          priority
        />

        {/*
          Asset 4 — the card tucked in the envelope. On open it lifts and settles forward,
          as if being drawn out.
        */}
        <StageImage
          dataAsset={4}
          src="/assets/section-01/card.webp"
          x={270}
          y={576}
          assetWidth={2158}
          assetHeight={1231}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={isOpen ? { opacity: 1, y: -32, scale: 1.03 } : { opacity: 1, y: 0, scale: 1 }}
          priority
        />

        {/*
          Asset 5 — wax seal. Doubles as the open-envelope hit target: tapping it "breaks"
          the seal (shrinks, spins and fades away) and lifts the card above.
        */}
        <StageImage
          dataAsset={5}
          src="/assets/section-01/wax-seal.webp"
          x={476}
          y={850}
          assetWidth={503}
          assetHeight={511}
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

        {LAYERS.map((layer) => (
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

        {/* Asset 8 — "Kepada Yth. / Bapak/Ibu/Saudara/i" plus the disclaimer line. Content. */}
        <StageImage
          src="/assets/section-01/salutation.webp"
          alt="Kepada Yth. Bapak/Ibu/Saudara/i"
          x={380}
          y={1168}
          assetWidth={1276}
          assetHeight={1217}
          variant="fadeUp"
          priority
        />

        {/*
          Asset 11 slot — the reference artwork was a static "Nama Tamu Undangan" label; this
          is now live text filled from the `?to=` query param (ANDEV-37), centred on the same
          midpoint the artwork sat on and wrapping within `maxWidth` since a real guest name's
          length isn't fixed the way the placeholder string's was.
        */}
        <StageText
          x={540}
          baseline={1274}
          size={32}
          weight={900}
          color="#720e2b"
          align="center"
          maxWidth={480}
          variant="fadeUp"
        >
          {guestName}
        </StageText>

        {/* Asset 10 — rule under the guest name. Decorative; static. */}
        <StageImage
          src="/assets/section-01/guest-name-rule.webp"
          x={283}
          y={1307}
          assetWidth={2052}
          assetHeight={9}
          priority
        />

        {/*
          Asset 9 — "Buka Undangan". Same tap target as the wax seal; fades once opened.
          While closed it breathes a soft gold glow (ANDEV-44) — a cue that this is the one
          thing on the page a guest needs to tap, now that scrolling past it is locked.
        */}
        <StageImage
          src="/assets/section-01/open-button.webp"
          alt="Buka Undangan"
          x={326}
          y={1334}
          assetWidth={1704}
          assetHeight={452}
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

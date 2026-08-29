import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'
import { motion, type HTMLMotionProps, type Variants } from 'motion/react'
import {
  CHARTER_BASELINE_EM,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  fromAssetPx,
  stageAspect,
  stageColumn,
  su,
} from '~/design/stage'

/**
 * The artboard size the nearest `<Stage>` was given — defaults to the shared 1080 x 1920
 * artboard. Every layer primitive below reads this instead of the `STAGE_WIDTH`/`STAGE_HEIGHT`
 * constants directly, so a section can override it (see `StageProps`) without touching any
 * other section's layout math.
 */
const StageDimensionsContext = createContext({ width: STAGE_WIDTH, height: STAGE_HEIGHT })

/**
 * Reveal variants a layer can opt into via `variant`. Only content layers (text, names,
 * dates, the quote, CTAs — what a guest actually reads) opt in; decorative/background
 * artwork (curtains, florals, ornaments, envelope, garlands, ...) is static and renders
 * with no `variant` at all, so it's simply always there, unanimated. Every variant shares
 * the same "hidden" -> "visible" labels so a single `whileInView="visible"` on `Stage`
 * drives all of them without each layer repeating it.
 *
 * Position/scale animate on a spring and opacity on a plain tween — that's Motion's own
 * default split for "physical" vs "visual" properties, and it reads as noticeably more
 * natural than a single shared cubic-bezier duration across every property.
 */
const OPACITY_TWEEN = { duration: 0.5, ease: 'easeOut' } as const

/** General-purpose settle: text, names, cards. Minimal overshoot. */
const SPRING = { type: 'spring', stiffness: 140, damping: 20, mass: 0.8, opacity: OPACITY_TWEEN } as const

export const MOTION_VARIANTS = {
  fadeUp: {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: SPRING },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: OPACITY_TWEEN },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { opacity: 1, scale: 1, transition: SPRING },
  },
} as const satisfies Record<string, Variants>

/** Stagger the reveal of a stage's layers instead of popping them all in at once. */
const STAGE_VARIANTS: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}

/**
 * How the 1080 x 1920 artboard is fitted into the viewport.
 * - `contain` — the whole artboard is visible; the section background fills the rest.
 *   Use this where the artwork sits inside the artboard with margin around it.
 * - `cover` — the artboard fills the viewport height and the sides are cropped. Use this
 *   where the artwork deliberately bleeds off the artboard edges.
 */
export type StageFit = 'contain' | 'cover'

type StageProps = {
  children: ReactNode
  /** Section background, applied to the full viewport behind the artboard. */
  background?: string
  fit?: StageFit
  className?: string
  id?: string
  /**
   * Overrides the shared 1080 x 1920 artboard for this section only — for a section whose
   * reference render was built on a different canvas (e.g. `CoverSection`'s ANDEV-50 art,
   * exported on a 1280 x 2772 artboard). Every layer primitive inside this `<Stage>` resolves
   * its `x`/`y`/`width`/`height` against these dimensions instead; other sections are
   * unaffected since the override doesn't escape this subtree.
   */
  width?: number
  height?: number
}

/**
 * Establishes the fixed coordinate space (1080 x 1920 by default, or `width`/`height` if
 * given) that the layer primitives position against, and scales it to the viewport.
 *
 * The artboard is capped to a column matching its own aspect ratio, so that a wide viewport
 * shows the invitation as a centred phone-shaped frame rather than blowing the artwork up to
 * desktop width.
 */
export function Stage({ children, background, fit = 'contain', className, id, width = STAGE_WIDTH, height = STAGE_HEIGHT }: StageProps) {
  const dimensions = { width, height }
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={STAGE_VARIANTS}
      // `h-lvh`, not `h-dvh` — see `stageColumn` in `~/design/stage` for why: `dvh` tracks the
      // iOS address bar live during scroll, which reads as the whole section zooming in.
      className={`relative flex h-lvh w-full items-center justify-center overflow-hidden ${className ?? ''}`}
      style={{ background }}
    >
      <div
        className="relative flex h-full flex-none items-center justify-center overflow-hidden"
        style={{ width: `min(100%, ${stageColumn(width, height)})` }}
      >
        <div
          data-stage=""
          className="relative flex-none"
          style={{
            aspectRatio: stageAspect(width, height),
            containerType: 'inline-size',
            // `contain` fits the artboard to the column's width; `cover` scales it to the
            // column's height so the sides bleed past the edges and get clipped.
            ...(fit === 'cover' ? { height: '100%' } : { width: '100%' }),
          }}
        >
          <StageDimensionsContext.Provider value={dimensions}>{children}</StageDimensionsContext.Provider>
        </div>
      </div>
    </motion.section>
  )
}

/** Absolute placement in stage units, expressed as percentages so it scales with the stage. */
function box(x: number, y: number, width: number, height: number, stageWidth: number, stageHeight: number): CSSProperties {
  return {
    left: `${(x / stageWidth) * 100}%`,
    top: `${(y / stageHeight) * 100}%`,
    width: `${(width / stageWidth) * 100}%`,
    height: `${(height / stageHeight) * 100}%`,
  }
}

type LayerProps = {
  src: string
  alt?: string
  /** Top-left corner in stage units. */
  x: number
  y: number
  className?: string
  style?: CSSProperties
  priority?: boolean
  /** Original file number in `project-info/per-asset`, kept in the DOM for traceability. */
  dataAsset?: number
  /** Which `MOTION_VARIANTS` entry drives this layer's reveal. Omit for a static (no animation) layer. */
  variant?: keyof typeof MOTION_VARIANTS
  /** Enables pointer events + a pointer cursor for layers that are actually tappable. */
  interactive?: boolean
  onClick?: () => void
  whileTap?: HTMLMotionProps<'img'>['whileTap']
  whileHover?: HTMLMotionProps<'img'>['whileHover']
  /**
   * Escape hatch for a fully local, state-driven animation (e.g. the cover's open-envelope
   * interaction) — pass both together. This bypasses the shared `variant` reveal entirely:
   * mixing the stage's inherited "visible" variant state with a local `animate` target lets
   * the inherited state keep winning for any key (opacity, scale, ...) the two share, so a
   * controlled layer needs to own its full animation lifecycle instead of layering on top.
   */
  initial?: HTMLMotionProps<'img'>['initial']
  animate?: HTMLMotionProps<'img'>['animate']
  /** Only meaningful alongside `animate` — a controlled layer has no `variant` transition to fall back on. */
  transition?: HTMLMotionProps<'img'>['transition']
}

/** Size in stage units. */
type LayerSize = { width: number; height: number }

function Layer({
  src,
  alt = '',
  x,
  y,
  width,
  height,
  className,
  style,
  priority = false,
  dataAsset,
  variant,
  interactive = false,
  onClick,
  whileTap,
  whileHover,
  initial,
  animate,
  transition,
}: LayerProps & LayerSize) {
  const controlled = initial !== undefined
  const { width: stageWidth, height: stageHeight } = useContext(StageDimensionsContext)
  return (
    /*
     * The hit area and the artwork are split across two elements on purpose. This div owns
     * the box (x/y/width/height) and everything about being a tap target — pointer-events,
     * cursor, the click handler, and the tap highlight below; the `motion.img` inside owns
     * only the pixels and their animation, sized to fill it.
     *
     * Every tappable layer (wax seal, open button, ...) is sized to its source PNG's full
     * canvas, which is padded well past the visible artwork to fit a soft drop shadow (see
     * e.g. `open-button.webp`). Mobile WebKit's default tap highlight paints over the tapped
     * element's whole box, not just its visible pixels — on a tap it used to show up as a
     * faint rectangle bleeding past the pill on both sides (ANDEV-46), back when this style
     * lived on the `<img>` itself. Switching it off here instead keeps it scoped to "this is a
     * tap target's own highlight", not something that happens to leak from image styling.
     */
    <div
      className={`absolute ${interactive ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}`}
      style={{ ...box(x, y, width, height, stageWidth, stageHeight), ...(interactive ? { WebkitTapHighlightColor: 'transparent' } : null) }}
      onClick={onClick}
    >
      <motion.img
        src={src}
        alt={alt}
        data-asset={dataAsset}
        aria-hidden={alt === '' ? true : undefined}
        draggable={false}
        decoding={priority ? 'sync' : 'async'}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        className={`block h-full w-full select-none ${className ?? ''}`}
        // `maxWidth`/`maxHeight` are reset because Tailwind's preflight caps images at 100% of
        // their container — belt-and-braces alongside `h-full w-full` above, which already
        // pins both to exactly this wrapper's box.
        style={{ maxWidth: 'none', maxHeight: 'none', ...style }}
        variants={controlled || !variant ? undefined : MOTION_VARIANTS[variant]}
        initial={controlled ? initial : undefined}
        animate={controlled ? animate : undefined}
        transition={controlled ? transition : undefined}
        whileTap={whileTap}
        whileHover={whileHover}
      />
    </div>
  )
}

/**
 * A single artwork element placed on the stage, sized from the intrinsic dimensions of its
 * @4x PNG so the source file stays the only place the size is written down.
 *
 * Each asset gets its own element rather than being baked into a flattened background,
 * so the animation pass can target them individually.
 */
export function StageImage({
  assetWidth,
  assetHeight,
  ...props
}: LayerProps & { assetWidth: number; assetHeight: number }) {
  return <Layer {...props} width={fromAssetPx(assetWidth)} height={fromAssetPx(assetHeight)} />
}

/** Vector artwork whose dimensions are already in stage units (see scripts/extract-name-art.mjs). */
export function StageVector(props: LayerProps & LayerSize) {
  return <Layer {...props} />
}

type StageBoxProps = {
  /** Top-left corner in stage units. */
  x: number
  y: number
  width: number
  height: number
  color: string
  className?: string
}

/**
 * A flat-coloured rect on the stage, in stage units — for panels that are a solid fill in
 * the reference (confirmed by sampling the source asset) rather than an image worth loading.
 */
export function StageBox({ x, y, width, height, color, className }: StageBoxProps) {
  const { width: stageWidth, height: stageHeight } = useContext(StageDimensionsContext)
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute ${className ?? ''}`}
      style={{ ...box(x, y, width, height, stageWidth, stageHeight), background: color }}
    />
  )
}

type StageTextProps = {
  children: string
  /** Left edge of the first glyph, in stage units — the horizontal anchor point when `align="center"`. */
  x: number
  /** Alphabetic baseline, in stage units. */
  baseline: number
  /** Font size in stage units. */
  size: number
  /** Letter-spacing in stage units. */
  tracking?: number
  color: string
  weight?: 400 | 700 | 900
  family?: 'serif' | 'script'
  /**
   * `left` (default) anchors `x` to the first glyph, matching a known, fixed string.
   * `center` treats `x` as the text's horizontal midpoint instead — for labels whose width
   * isn't known up front (e.g. a caption under a live embed) or content whose length isn't
   * fixed at design time (e.g. a guest name from the URL). Pair with `maxWidth` to wrap.
   */
  align?: 'left' | 'center'
  /** Wrap width in stage units. Only meaningful alongside `align="center"`. */
  maxWidth?: number
  className?: string
  /** Which `MOTION_VARIANTS` entry drives this text's reveal. Omit for a static (no animation) label. */
  variant?: keyof typeof MOTION_VARIANTS
  /** Renders the label as a real link (new tab) instead of inert text — for tappable captions. */
  href?: string
}

/**
 * Live text on the stage, in stage units.
 *
 * Font size and tracking resolve against the stage's width, so text scales with the
 * artwork instead of drifting out of the composition.
 */
export function StageText({
  children,
  x,
  baseline,
  size,
  tracking = 0,
  color,
  weight = 400,
  family = 'serif',
  align = 'left',
  maxWidth,
  className,
  variant,
  href,
}: StageTextProps) {
  const centered = align === 'center'
  const wraps = centered && maxWidth != null
  const { width: stageWidth, height: stageHeight } = useContext(StageDimensionsContext)

  // Positioning (including the `translateX(-50%)` centering) lives on a plain, non-motion
  // wrapper — not the animated element itself. Motion owns the `transform` CSS property on
  // an animated component: it recomposes `transform` from its own x/y/scale/rotate motion
  // values every frame, so a `transform` set by hand in `style` gets silently clobbered the
  // instant a variant animates any of those (every `variant` here animates `y`). Splitting
  // position from animation keeps both working.
  const positionStyle: CSSProperties = {
    left: `${(x / stageWidth) * 100}%`,
    top: `${((baseline - CHARTER_BASELINE_EM * size) / stageHeight) * 100}%`,
    transform: centered ? 'translateX(-50%)' : undefined,
    // Needed so `maxWidth` actually constrains wrapping instead of the text overflowing.
    width: wraps ? su(maxWidth, stageWidth) : undefined,
  }
  const textStyle: CSSProperties = {
    color,
    fontFamily: family === 'script' ? 'var(--font-script)' : 'var(--font-serif)',
    fontWeight: weight,
    fontSize: su(size, stageWidth),
    letterSpacing: su(tracking, stageWidth),
    lineHeight: 1,
  }
  const spanVariants = variant ? MOTION_VARIANTS[variant] : undefined
  const textClassName = `block ${wraps ? 'text-center' : 'whitespace-nowrap'} ${className ?? ''}`

  if (href) {
    return (
      <span className="absolute" style={positionStyle}>
        <motion.a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          variants={spanVariants}
          className={`pointer-events-auto cursor-pointer ${textClassName}`}
          style={textStyle}
        >
          {children}
        </motion.a>
      </span>
    )
  }

  return (
    <span className="absolute" style={positionStyle}>
      <motion.span variants={spanVariants} className={textClassName} style={textStyle}>
        {children}
      </motion.span>
    </span>
  )
}

type StageEmbedProps = {
  /** Iframe document to embed — the only content type on the stage that can't be a
   * pre-rendered asset (a live Google Maps view, in practice). */
  src: string
  title: string
  /** Top-left corner, in stage units (unlike `StageImage`, there's no source asset to derive
   * a natural size from, so width/height are given directly in stage units). */
  x: number
  y: number
  width: number
  height: number
  className?: string
  /** Which `MOTION_VARIANTS` entry drives this embed's reveal. Omit for a static (no animation) box. */
  variant?: keyof typeof MOTION_VARIANTS
}

/**
 * A live third-party embed placed on the stage, in stage units.
 *
 * Unlike every other layer primitive here, this renders real interactive content (the map
 * can be panned/zoomed), so — unlike `Layer` — it does not set `pointer-events-none`.
 */
export function StageEmbed({ src, title, x, y, width, height, className, variant }: StageEmbedProps) {
  const { width: stageWidth, height: stageHeight } = useContext(StageDimensionsContext)
  return (
    <motion.div
      variants={variant ? MOTION_VARIANTS[variant] : undefined}
      className={`absolute overflow-hidden ${className ?? ''}`}
      style={box(x, y, width, height, stageWidth, stageHeight)}
    >
      <iframe
        src={src}
        title={title}
        className="h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </motion.div>
  )
}

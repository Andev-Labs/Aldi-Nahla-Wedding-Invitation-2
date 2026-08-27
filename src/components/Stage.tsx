import type { CSSProperties, ReactNode } from 'react'
import { motion, type HTMLMotionProps, type Variants } from 'motion/react'
import {
  CHARTER_BASELINE_EM,
  STAGE_ASPECT,
  STAGE_COLUMN,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  fromAssetPx,
  su,
} from '~/design/stage'

/**
 * Reveal variants a layer can opt into via `variant`. Picked per-asset in each section to
 * match how that piece of artwork should arrive (a name-card settles differently than a
 * curtain panel), but every variant shares the same "hidden" -> "visible" labels so a single
 * `whileInView="visible"` on `Stage` drives all of them without each layer repeating it.
 */
const EASE_OUT = [0.16, 1, 0.3, 1] as const

export const MOTION_VARIANTS = {
  fadeUp: {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8, ease: EASE_OUT } },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.65, ease: EASE_OUT } },
  },
  slideLeft: {
    hidden: { opacity: 0, x: -60 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.75, ease: EASE_OUT } },
  },
  slideRight: {
    hidden: { opacity: 0, x: 60 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.75, ease: EASE_OUT } },
  },
  /** Curtain panels get a bigger, slower throw so the "opening" reads clearly. */
  curtainLeft: {
    hidden: { opacity: 0, x: -180 },
    visible: { opacity: 1, x: 0, transition: { duration: 1.1, ease: EASE_OUT } },
  },
  curtainRight: {
    hidden: { opacity: 0, x: 180 },
    visible: { opacity: 1, x: 0, transition: { duration: 1.1, ease: EASE_OUT } },
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
}

/**
 * Establishes the fixed 1080 x 1920 coordinate space that the layer primitives position
 * against, and scales it to the viewport.
 *
 * The artboard is capped to a 9:16 column so that a wide viewport shows the invitation as
 * a centred phone-shaped frame rather than blowing the artwork up to desktop width.
 */
export function Stage({ children, background, fit = 'contain', className, id }: StageProps) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={STAGE_VARIANTS}
      className={`relative flex h-dvh w-full items-center justify-center overflow-hidden ${className ?? ''}`}
      style={{ background }}
    >
      <div
        className="relative flex h-full flex-none items-center justify-center overflow-hidden"
        style={{ width: `min(100%, ${STAGE_COLUMN})` }}
      >
        <div
          data-stage=""
          className="relative flex-none"
          style={{
            aspectRatio: STAGE_ASPECT,
            containerType: 'inline-size',
            // `contain` fits the artboard to the column's width; `cover` scales it to the
            // column's height so the sides bleed past the edges and get clipped.
            ...(fit === 'cover' ? { height: '100%' } : { width: '100%' }),
          }}
        >
          {children}
        </div>
      </div>
    </motion.section>
  )
}

/**
 * Absolute placement in stage units, expressed as percentages so it scales with the stage.
 *
 * `maxWidth`/`maxHeight` are reset because Tailwind's preflight caps images at 100% of their
 * container, which silently shrinks any asset that deliberately bleeds past the artboard.
 */
function box(x: number, y: number, width: number, height: number): CSSProperties {
  return {
    left: `${(x / STAGE_WIDTH) * 100}%`,
    top: `${(y / STAGE_HEIGHT) * 100}%`,
    width: `${(width / STAGE_WIDTH) * 100}%`,
    height: `${(height / STAGE_HEIGHT) * 100}%`,
    maxWidth: 'none',
    maxHeight: 'none',
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
  /** Which `MOTION_VARIANTS` entry drives this layer's reveal. Defaults to a plain fade-up. */
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
  variant = 'fadeUp',
  interactive = false,
  onClick,
  whileTap,
  whileHover,
  initial,
  animate,
}: LayerProps & LayerSize) {
  const controlled = initial !== undefined
  return (
    <motion.img
      src={src}
      alt={alt}
      data-asset={dataAsset}
      aria-hidden={alt === '' ? true : undefined}
      draggable={false}
      decoding={priority ? 'sync' : 'async'}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      className={`absolute select-none ${interactive ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'} ${className ?? ''}`}
      style={{ ...box(x, y, width, height), ...style }}
      variants={controlled ? undefined : MOTION_VARIANTS[variant]}
      initial={controlled ? initial : undefined}
      animate={controlled ? animate : undefined}
      onClick={onClick}
      whileTap={whileTap}
      whileHover={whileHover}
    />
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
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute ${className ?? ''}`}
      style={{ ...box(x, y, width, height), background: color }}
    />
  )
}

type StageTextProps = {
  children: string
  /** Left edge of the first glyph, in stage units. */
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
  className?: string
  /** Which `MOTION_VARIANTS` entry drives this text's reveal. Defaults to a plain fade-up. */
  variant?: keyof typeof MOTION_VARIANTS
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
  className,
  variant = 'fadeUp',
}: StageTextProps) {
  return (
    <motion.span
      variants={MOTION_VARIANTS[variant]}
      className={`absolute whitespace-nowrap ${className ?? ''}`}
      style={{
        left: `${(x / STAGE_WIDTH) * 100}%`,
        top: `${((baseline - CHARTER_BASELINE_EM * size) / STAGE_HEIGHT) * 100}%`,
        color,
        fontFamily: family === 'script' ? 'var(--font-script)' : 'var(--font-serif)',
        fontWeight: weight,
        fontSize: su(size),
        letterSpacing: su(tracking),
        lineHeight: 1,
      }}
    >
      {children}
    </motion.span>
  )
}

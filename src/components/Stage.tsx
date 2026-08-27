import type { CSSProperties, ReactNode } from 'react'
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
    <section
      id={id}
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
    </section>
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
}: LayerProps & LayerSize) {
  return (
    <img
      src={src}
      alt={alt}
      data-asset={dataAsset}
      aria-hidden={alt === '' ? true : undefined}
      draggable={false}
      decoding={priority ? 'sync' : 'async'}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      className={`pointer-events-none absolute select-none ${className ?? ''}`}
      style={{ ...box(x, y, width, height), ...style }}
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
}: StageTextProps) {
  return (
    <span
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
    </span>
  )
}

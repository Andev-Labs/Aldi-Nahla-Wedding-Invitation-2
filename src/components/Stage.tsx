import type { CSSProperties, ReactNode } from 'react'
import { STAGE_HEIGHT, STAGE_WIDTH, fromAssetPx } from '~/design/stage'

/**
 * How the 1080 x 1920 artboard is fitted into the viewport.
 * - `contain` — the whole artboard is visible; the section background fills the rest.
 * - `cover` — the artboard fills the viewport and overflow is cropped. Use this for
 *   sections whose artwork bleeds off the artboard edges.
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
 * Establishes the fixed 1080 x 1920 coordinate space that `StageImage` positions
 * against. Children use stage units; the artboard itself is scaled to the viewport,
 * so the composition stays pixel-accurate to the reference at any size.
 */
export function Stage({ children, background, fit = 'contain', className, id }: StageProps) {
  return (
    <section
      id={id}
      data-fit={fit}
      className={`relative flex min-h-dvh w-full items-center justify-center overflow-hidden ${className ?? ''}`}
      style={{ background }}
    >
      <div
        className="relative flex-none"
        style={{
          aspectRatio: `${STAGE_WIDTH} / ${STAGE_HEIGHT}`,
          width:
            fit === 'cover'
              ? `max(100%, calc(100dvh * ${STAGE_WIDTH} / ${STAGE_HEIGHT}))`
              : `min(100%, calc(100dvh * ${STAGE_WIDTH} / ${STAGE_HEIGHT}))`,
        }}
      >
        {children}
      </div>
    </section>
  )
}

type StageImageProps = {
  src: string
  alt?: string
  /** Top-left corner in stage units. */
  x: number
  y: number
  /** Intrinsic size of the source PNG, which is exported @4x. */
  assetWidth: number
  assetHeight: number
  className?: string
  style?: CSSProperties
  priority?: boolean
  /** Original file number in `project-info/per-asset`, kept in the DOM for traceability. */
  dataAsset?: number
}

/**
 * A single artwork element placed on the stage.
 *
 * Each asset gets its own element rather than being baked into a flattened
 * background, so the animation pass can target them individually.
 */
export function StageImage({
  src,
  alt = '',
  x,
  y,
  assetWidth,
  assetHeight,
  className,
  style,
  priority = false,
  dataAsset,
}: StageImageProps) {
  const width = fromAssetPx(assetWidth)
  const height = fromAssetPx(assetHeight)

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
      style={{
        left: `${(x / STAGE_WIDTH) * 100}%`,
        top: `${(y / STAGE_HEIGHT) * 100}%`,
        width: `${(width / STAGE_WIDTH) * 100}%`,
        height: `${(height / STAGE_HEIGHT) * 100}%`,
        ...style,
      }}
    />
  )
}

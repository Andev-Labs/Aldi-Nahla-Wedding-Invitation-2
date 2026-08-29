import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'
import { motion, type HTMLMotionProps, type Variants } from 'motion/react'
import {
  ARTBOARD_ORIGINAL,
  CHARTER_BASELINE_EM,
  fromAssetPx,
  stageAspect,
  stageBleedColumn,
  stageColumn,
  stageColumnCapped,
  su,
  type Artboard,
} from '~/design/stage'

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
const OPACITY_TWEEN = { duration: 0.7, ease: [0.22, 0.61, 0.36, 1] } as const

/**
 * General-purpose settle: text, names, cards.
 *
 * Overdamped on purpose — the damping ratio here is 1.22 (22 / 2 x sqrt(90 x 0.9)), so the
 * spring eases to rest without crossing its target. An invitation wants unhurried and settled,
 * not bouncy; the previous values overshot on every element, which at this scale read as a
 * small flick at the end of each reveal.
 */
const SPRING = { type: 'spring', stiffness: 90, damping: 22, mass: 0.9, opacity: OPACITY_TWEEN } as const

/** Ornamental rules draw rather than settle, so they get a tween of their own. */
const DRAW_TWEEN = { duration: 0.8, ease: [0.33, 1, 0.68, 1], opacity: { duration: 0.35 } } as const

export const MOTION_VARIANTS = {
  fadeUp: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: SPRING },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: OPACITY_TWEEN },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: SPRING },
  },
  /**
   * For the gold rules — the quote card's two trims, the schedule's divider. They are a single
   * horizontal stroke, and a stroke that grows from its own centre reads as being drawn, which
   * fading or sliding it does not. Scale, not width, so it stays on the compositor.
   */
  drawLine: {
    hidden: { opacity: 0, scaleX: 0 },
    visible: { opacity: 1, scaleX: 1, transition: DRAW_TWEEN },
  },
} as const satisfies Record<string, Variants>

/**
 * Stagger the reveal of a stage's layers instead of popping them all in at once.
 *
 * The cascade runs in DOM order over the layers that actually animate. That is only true
 * because a layer with no `variant` is rendered as a plain `img` rather than a `motion.img`
 * (see `Layer`), which keeps it out of the variant tree entirely — when every layer was a
 * motion component, the static artwork took slots in the stagger and pushed the content behind
 * it. On the quote page that left its one animated element waiting 520 ms for six pieces of
 * scenery that were never going to move.
 */
const STAGE_VARIANTS: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

/**
 * How the artboard is fitted into the viewport.
 *
 * - `contain` — the whole artboard is visible and the section background fills the rest. For a
 *   page whose artwork sits inside the artboard with margin around it, and for anything that
 *   must never lose an edge (see `bleed`, which closes `contain`'s side bands without cropping).
 * - `fill` — the artboard covers the viewport in both directions: it grows until neither a
 *   side nor a top/bottom band is left, and whichever axis ends up longer is cropped. For a
 *   page drawn to touch all four edges, where the artwork nearest an edge is foliage that is
 *   already half off the page.
 *
 * Neither one distorts: the artboard keeps its aspect ratio in every case, and the choice is
 * only ever about which of "show all of it" and "leave no gap" wins when a viewport's shape
 * does not match the artboard's — which, on a phone, it essentially never does.
 */
export type StageFit = 'contain' | 'fill'

/**
 * The artboard the enclosing `Stage` was given, so every layer primitive inside it resolves
 * stage units against the same page size without each one being handed it explicitly.
 *
 * Defaults to the original artboard, which every section has now moved off — the default is
 * what the sections relied on while the revision rolled out page by page, and nothing passes
 * it any more. Left in place rather than made required: it costs nothing, and a page that
 * needs to go back to the original artwork is a smaller change with it here.
 */
const ArtboardContext = createContext<Artboard>(ARTBOARD_ORIGINAL)

type StageProps = {
  children: ReactNode
  /** Section background, applied to the full viewport behind the artboard. */
  background?: string
  /** The page size this section's layout is measured in. See `~/design/stage`. */
  artboard?: Artboard
  fit?: StageFit
  /**
   * How far, in stage units, this section's edge artwork is drawn past each side of the
   * artboard — 0 (the default) for a section whose artwork stops at the artboard edge.
   *
   * A phone's browser viewport is always shorter than the 9:19.5 the revised artboard is,
   * so the stage column comes out narrower than the screen and leaves a background band down
   * each side. Declaring the overhang lets the stage spill that much artwork into the bands
   * instead of clipping it at the artboard, which fills them at the artwork's own scale.
   * See `stageBleedColumn`.
   */
  bleed?: number
  /**
   * Layers pinned to the top or bottom of the *screen* rather than of the artboard — see
   * `StageEdge`. They render in the clip box, outside the stage, so `fill`'s vertical crop
   * cannot reach them.
   */
  edges?: ReactNode
  className?: string
  id?: string
}

/**
 * Establishes the fixed coordinate space that the layer primitives position against, and
 * scales it to the viewport.
 *
 * The artboard is capped to a column of its own aspect ratio so that a wide viewport shows
 * the invitation as a centred phone-shaped frame rather than blowing the artwork up to
 * desktop width.
 */
export function Stage({
  children,
  background,
  artboard = ARTBOARD_ORIGINAL,
  fit = 'contain',
  bleed = 0,
  edges,
  className,
  id,
}: StageProps) {
  /*
   * The three fits, as one width each, all resolved against the clip box — and all of them
   * phone-only. `fill` and `bleed` both trade something away to reach the screen edges, which
   * is worth it on a phone and is not worth it anywhere else, so off a phone every section
   * falls back to `contain`: the whole page, centred, nothing cropped. See `.stage-box` in
   * `~/styles/app.css` for where that switch happens.
   *
   * - `fill` — `max` of the box's own width and the column that is exactly as tall as the
   *   viewport, so whichever axis would have left a gap is the one that gets covered.
   * - `bleed` — the column, always. The composition stays fitted to the height exactly as it
   *   was; it is the box around it that has widened, and all that reaches the extra width is
   *   the overhang the artwork already had.
   * - `contain` — the box's width, which is the column itself.
   */
  const stageWidthPhone =
    fit === 'fill' ? `max(100%, ${stageColumn(artboard)})` : bleed > 0 ? stageColumn(artboard) : '100%'
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
        className="stage-box relative flex h-full flex-none items-center justify-center overflow-hidden"
        /*
         * Every width this section can take, handed to `~/styles/app.css` as custom properties
         * so the choice between them can be made in a media query — which is the only place it
         * *can* be made, since no viewport-unit expression can tell a phone from a window that
         * happens to be the same width.
         *
         * The `-phone` pair is what a phone gets: the box as wide as it can usefully be (the
         * whole screen under `fill`, the column plus its overhang under `bleed`) because that
         * is where side bands are a defect. The plain pair is what everything else gets: the
         * capped column, contained, whole.
         */
        style={
          {
            '--stage-column': stageColumnCapped(artboard),
            '--stage-width': '100%',
            '--stage-width-phone': stageWidthPhone,
            ...(fit === 'fill' ? { '--stage-column-phone': '100%' } : null),
            ...(bleed > 0 ? { '--stage-column-phone': stageBleedColumn(artboard, bleed) } : null),
          } as CSSProperties
        }
      >
        {/* Wraps the edge layers too — they are laid out in the same stage units the stage is. */}
        <ArtboardContext.Provider value={artboard}>
          <div
            data-stage=""
            className="stage-artboard relative flex-none"
            style={{
              aspectRatio: stageAspect(artboard),
              containerType: 'inline-size',
            }}
          >
            {children}
          </div>
          {edges}
        </ArtboardContext.Provider>
      </div>
    </motion.section>
  )
}

/** Absolute placement in stage units, expressed as percentages so it scales with the stage. */
function box(artboard: Artboard, x: number, y: number, width: number, height: number): CSSProperties {
  return {
    left: `${(x / artboard.width) * 100}%`,
    top: `${(y / artboard.height) * 100}%`,
    width: `${(width / artboard.width) * 100}%`,
    height: `${(height / artboard.height) * 100}%`,
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
  /** Source file number in the section's asset folder, kept in the DOM for traceability. */
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
  const artboard = useContext(ArtboardContext)
  const controlled = initial !== undefined
  const animated = controlled || variant !== undefined || whileTap !== undefined || whileHover !== undefined
  const imgProps = {
    src,
    alt,
    'data-asset': dataAsset,
    'aria-hidden': alt === '' ? true : undefined,
    draggable: false,
    decoding: priority ? ('sync' as const) : ('async' as const),
    loading: priority ? ('eager' as const) : ('lazy' as const),
    fetchPriority: priority ? ('high' as const) : ('auto' as const),
    className: `block h-full w-full select-none ${className ?? ''}`,
    // `maxWidth`/`maxHeight` are reset because Tailwind's preflight caps images at 100% of
    // their container — belt-and-braces alongside `h-full w-full` above, which already
    // pins both to exactly this wrapper's box.
    style: { maxWidth: 'none', maxHeight: 'none', ...style } as CSSProperties,
  }
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
      style={{
        ...box(artboard, x, y, width, height),
        ...(interactive ? { WebkitTapHighlightColor: 'transparent' } : null),
      }}
      onClick={onClick}
    >
      {/*
        A layer that never moves renders as a plain `img`, not a `motion.img`. That is not only
        about the work a motion component does per layer — it is what keeps the stagger honest.
        Motion counts every variant child when it spaces a `staggerChildren`, so while the
        scenery was motion components it took slots in the cascade and delayed the content
        behind it. Out of the tree, the stagger runs over the animated layers alone.
      */}
      {animated ? (
        <motion.img
          {...imgProps}
          variants={controlled || !variant ? undefined : MOTION_VARIANTS[variant]}
          initial={controlled ? initial : undefined}
          animate={controlled ? animate : undefined}
          transition={controlled ? transition : undefined}
          whileTap={whileTap}
          whileHover={whileHover}
        />
      ) : (
        <img {...imgProps} />
      )}
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

type StageEdgeProps = {
  src: string
  /** Left edge in stage units, exactly as for a `StageImage` on the artboard. */
  x: number
  /**
   * Distance from the anchored screen edge to the layer's near edge, in stage units — its `y`
   * for `anchor="top"`, and `artboard.height - (y + height)` for `anchor="bottom"`. Usually ~0,
   * since a band that needs this treatment is one drawn flush with the page edge.
   */
  offset: number
  /** Which screen edge the band hangs from. */
  anchor: 'top' | 'bottom'
  /** Intrinsic @4x pixel size of the source PNG, as for `StageImage`. */
  assetWidth: number
  assetHeight: number
  className?: string
}

/**
 * A band hung from the top or bottom of the *screen*, for the one kind of layer `fill` cannot
 * serve: a page's edge trim.
 *
 * `fill` grows the artboard until no side band is left and crops whatever then overflows top
 * and bottom — right for foliage already running off the page, wrong for a pelmet or a trim
 * drawn flush with the artboard edge, which is exactly the strip that crop eats first. Hanging
 * it off the screen edge instead keeps it where the design put it at any viewport shape.
 *
 * Everything is a percentage of the clip box's width, which under `fill` is the stage's own
 * width — so horizontally this places the layer on precisely the stage units it was laid out
 * on, and vertically it is the same scale measured from the screen edge instead of the
 * artboard's. Percentages, including the offset's, all resolve against that one length
 * (margins resolve against inline size, which is why the offset is one), so the band and its
 * offset scale together instead of drifting apart as the viewport changes shape.
 */
export function StageEdge({ src, x, offset, anchor, assetWidth, assetHeight, className }: StageEdgeProps) {
  const artboard = useContext(ArtboardContext)
  const pct = (units: number) => `${(units / artboard.width) * 100}%`
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      decoding="sync"
      fetchPriority="high"
      className={`pointer-events-none absolute block select-none ${className ?? ''}`}
      style={{
        left: pct(x),
        width: pct(fromAssetPx(assetWidth)),
        aspectRatio: `${assetWidth} / ${assetHeight}`,
        maxWidth: 'none',
        maxHeight: 'none',
        ...(anchor === 'top' ? { top: 0, marginTop: pct(offset) } : { bottom: 0, marginBottom: pct(offset) }),
      }}
    />
  )
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
  const artboard = useContext(ArtboardContext)
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute ${className ?? ''}`}
      style={{ ...box(artboard, x, y, width, height), background: color }}
    />
  )
}

type StageTextProps = {
  children: string
  /** Left edge of the first glyph, in stage units — the horizontal anchor point when `align="center"`. */
  x: number
  /** Alphabetic baseline, in stage units. Which line it pins is `baselineOf`. */
  baseline: number
  /**
   * Which line `baseline` pins, for text that can wrap.
   *
   * `first` (default) grows downwards, which is right whenever there is open space below.
   * `last` grows upwards instead — for a slot with fixed artwork immediately under it, where
   * a second line would otherwise land on top of it. Section 1's guest name needs it: its
   * rule is baked into the salutation artwork, so the name has to stack up towards the
   * salutation rather than down into the rule.
   */
  baselineOf?: 'first' | 'last'
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
  /**
   * Hard ceiling on wrapped lines: past it the text is ellipsised instead of growing.
   *
   * A slot in a fixed composition has a finite band to grow into, and a wrapping length limit
   * cannot guarantee a line count — wrapping breaks on words, so one long word pushes a name
   * onto an extra line that a character count says should fit. This is the backstop that keeps
   * a pathological value from painting over whatever sits at the end of the band.
   */
  maxLines?: number
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
  baselineOf = 'first',
  size,
  tracking = 0,
  color,
  weight = 400,
  family = 'serif',
  align = 'left',
  maxWidth,
  maxLines,
  className,
  variant,
  href,
}: StageTextProps) {
  const artboard = useContext(ArtboardContext)
  const centered = align === 'center'
  const wraps = centered && maxWidth != null

  // Positioning (including the `translateX(-50%)` centering) lives on a plain, non-motion
  // wrapper — not the animated element itself. Motion owns the `transform` CSS property on
  // an animated component: it recomposes `transform` from its own x/y/scale/rotate motion
  // values every frame, so a `transform` set by hand in `style` gets silently clobbered the
  // instant a variant animates any of those (every `variant` here animates `y`). Splitting
  // position from animation keeps both working.
  //
  // `first` pins the box's top edge, `last` its bottom edge — with `line-height: 1` a line
  // box is exactly `size` tall, so its baseline sits `CHARTER_BASELINE_EM * size` below its
  // own top and `(1 - CHARTER_BASELINE_EM) * size` above its own bottom. Anchoring the
  // bottom therefore holds the *last* line's baseline still however many lines there are.
  const positionStyle: CSSProperties = {
    left: `${(x / artboard.width) * 100}%`,
    ...(baselineOf === 'last'
      ? { bottom: `${((artboard.height - (baseline + (1 - CHARTER_BASELINE_EM) * size)) / artboard.height) * 100}%` }
      : { top: `${((baseline - CHARTER_BASELINE_EM * size) / artboard.height) * 100}%` }),
    transform: centered ? 'translateX(-50%)' : undefined,
    // Needed so `maxWidth` actually constrains wrapping instead of the text overflowing.
    width: wraps ? su(maxWidth, artboard) : undefined,
  }
  const clamps = wraps && maxLines != null
  const textStyle: CSSProperties = {
    color,
    fontFamily: family === 'script' ? 'var(--font-script)' : 'var(--font-serif)',
    fontWeight: weight,
    fontSize: su(size, artboard),
    letterSpacing: su(tracking, artboard),
    lineHeight: 1,
    // A word with no break opportunity ignores `maxWidth` and runs straight out of the box
    // sideways, where `maxLines` cannot see it because it is still one line. Letting it break
    // mid-word turns that into extra lines, which the clamp does handle.
    ...(wraps ? { overflowWrap: 'anywhere' } : null),
    // `-webkit-line-clamp` fills from the top of the box, so under `baselineOf="last"` the
    // clamped box is still anchored by its bottom and the final visible line's baseline stays
    // exactly where the design put it.
    ...(clamps
      ? { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: maxLines, overflow: 'hidden' }
      : null),
  }
  const spanVariants = variant ? MOTION_VARIANTS[variant] : undefined
  const textClassName = `${clamps ? '' : 'block'} ${wraps ? 'text-center' : 'whitespace-nowrap'} ${className ?? ''}`

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
  const artboard = useContext(ArtboardContext)
  return (
    <motion.div
      variants={variant ? MOTION_VARIANTS[variant] : undefined}
      className={`absolute overflow-hidden ${className ?? ''}`}
      style={box(artboard, x, y, width, height)}
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

# Aldi & Nahla — Wedding Invitation

Digital wedding invitation built with TanStack Start, React 19, TypeScript and Tailwind CSS v4.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run typecheck
npm run lint
```

## Slicing conventions

The design lives in `project-info/Asset Undangan Digital.pdf` — seven 1080 × 1920 pages, one
per section. Everything below follows from that.

**The artboard is 1080 × 1920 stage units.** `src/design/stage.ts` holds the constants.
`Stage` sets up that coordinate space and scales it to the viewport; `StageImage` places a
single asset by its top-left corner in stage units. Positions are emitted as percentages, so
the composition stays pixel-accurate at any size without JS measurement.

**Assets are exported @4x.** Every PNG in `project-info/per-asset` is four times its design
size, so `intrinsic pixels ÷ 4 = stage units`. `StageImage` takes the intrinsic size and does
the division, which keeps the source file the single point of truth for an asset's size.

**One element per asset.** Each asset is its own `<img>` rather than a flattened background,
because the animation pass targets them individually. Section files declare layers
bottom-to-top and DOM order is the stacking order. Each element carries `data-asset="<n>"`,
the original file number in `project-info/per-asset` (`Asset <n>@4x.png`).

**Positions are measured, not eyeballed.** Each asset was matched against the reference render
of its page, then the whole composite was refined against that render as a group. Section 1
lands at a mean per-pixel error of ~1.9/255 versus the PDF; the residual is antialiasing on
artwork edges.

## Fonts

`project-info/fonts/Charter.ttc` is a TrueType Collection holding six faces, which browsers
cannot load directly. `npm run fonts` extracts each face by index and re-emits it as woff2 into
`public/fonts` (already committed, so this only needs re-running if the source fonts change).

It needs fontTools + brotli, and uses `python3` unless you point it elsewhere:

```bash
pip install fonttools brotli
PYTHON=/path/to/python3 npm run fonts
```

## Sections

| # | Section | Status |
|---|---------|--------|
| 1 | Cover / envelope | sliced — `src/sections/CoverSection.tsx` |
| 2 | Hero "Aldi & Nahla" | not started |
| 3 | Quote (Q.S. Ar-Rum:21) | not started |
| 4 | Bride & groom | not started |
| 5 | Date & time | not started |
| 6 | Location + QR | not started |
| 7 | Closing + RSVP | not started |

Animation, transitions and interactions are a later stage — sections are static for now.

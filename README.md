# Aldi & Nahla — Wedding Invitation

Digital wedding invitation built with TanStack Start, React 19, TypeScript and Tailwind CSS v4.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run typecheck
npm run lint
```

The dev server runs on 5173 (`PORT=... npm run dev` to change it) — 3000 is taken by Multica.

`/preview/<slug>` renders one section on its own, which is how each one gets compared against
its page of the reference PDF. Slugs are listed in `src/sections/index.ts`.

## Slicing conventions

The design lives in `project-info/Asset Undangan Digital.pdf` — seven 1080 × 1920 pages, one
per section. Everything below follows from that.

**The artboard is 1080 × 1920 stage units.** `src/design/stage.ts` holds the constants.
`Stage` sets up that coordinate space and scales it to the viewport; `StageImage`,
`StageVector` and `StageText` place things by their top-left corner (or baseline) in stage
units. Geometry is emitted as percentages, so the composition stays pixel-accurate at any
size without JS measurement. The artboard is capped to a 9:16 column, so a wide viewport
shows the invitation as a centred phone-shaped frame.

Each section picks a fit:

- `contain` — the whole artboard is visible and the section background fills the rest. For
  artwork that sits inside the artboard with margin around it (section 1).
- `cover` — the artboard fills the viewport height and the sides are cropped. For artwork
  that deliberately bleeds off the artboard edges (section 2). On a 390 × 844 phone this
  crops 96 stage units per side, which the designs keep clear of their content.

**Assets are exported @4x.** Every PNG in `project-info/per-asset` is four times its design
size, so `intrinsic pixels ÷ 4 = stage units`. `StageImage` takes the intrinsic size and does
the division, which keeps the source file the single point of truth for an asset's size.

**One element per asset.** Each asset is its own element rather than a flattened background,
because the animation pass targets them individually. Section files declare layers
bottom-to-top and DOM order is the stacking order. Raster layers carry `data-asset="<n>"`,
the original file number in `project-info/per-asset` (`Asset <n>@4x.png`).

**Positions are measured, not eyeballed.** Each asset is matched against the reference render
of its page, then the composite is refined against that render as a group. Dark-on-dark
sections are contrast-stretched around the background colour first, otherwise there is no
signal to match on. Current mean per-pixel error against the PDF: section 1 ≈ 1.9/255,
section 2 ≈ 1.7/255. The residual is antialiasing on artwork edges.

## Vector art taken from the PDF

Three pieces of section 2 could not come from `per-asset/`, so they are extracted from the
PDF's own vector outlines instead. Both scripts need poppler's `pdftocairo` on PATH.

| Script | Output | Why |
| --- | --- | --- |
| `scripts/extract-name-art.mjs` | `name-aldi.svg`, `name-nahla.svg` | The script lettering was outlined in Illustrator with manual tracking and an alternate ampersand. Re-setting the strings in Aston Script lands nowhere near it (IoU ≈ 0.27). |
| `scripts/extract-ornament-art.mjs` | `ornament.svg` | `Asset 16@4x.png` bundles both starbursts at a spacing the design does not use. A full-page sweep scored that export barely better than omitting the ornament. |

Both outputs are committed, so a normal build does not need poppler.

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

| # | Section | Slug | Status |
|---|---------|------|--------|
| 1 | Cover / envelope | `cover` | sliced |
| 2 | Hero "Aldi & Nahla" | `hero` | sliced |
| 3 | Quote (Q.S. Ar-Rum:21) | — | not started |
| 4 | Bride & groom | — | not started |
| 5 | Date & time | — | not started |
| 6 | Location + QR | — | not started |
| 7 | Closing + RSVP | — | not started |

Animation, transitions and interactions are a later stage — sections are static for now.

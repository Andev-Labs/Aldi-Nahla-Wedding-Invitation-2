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
`StageVector`, `StageBox` and `StageText` place things by their top-left corner (or baseline)
in stage units. Geometry is emitted as percentages, so the composition stays pixel-accurate at
any size without JS measurement. The artboard is capped to a 9:16 column, so a wide viewport
shows the invitation as a centred phone-shaped frame.

Each section picks a fit:

- `contain` — the whole artboard is visible and the section background fills the rest.
- `cover` — the artboard fills the viewport height and the sides are cropped, for artwork
  that deliberately bleeds off the artboard edges. Every section but the cover uses this.

**Backgrounds are not always one flat colour.** Section 1's cream is a fitted radial
vignette; section 3 is two-tone — `#061A17` full-bleed with a flat `#EDEAE2` panel inset from
the edges — while sections 2, 5, 6, 7 are flat `#061A17` and section 4 is flat `#EDEAE2`
full-bleed. Always sample the extreme page edges (past where curtains/florals reach) before
assuming which one a new page needs; section 3 only revealed its dark margins once the outer
edge was checked specifically, well after the rest of the layout was placed.

**Assets are exported @4x.** Every PNG in `project-info/per-asset` is four times its design
size, so `intrinsic pixels ÷ 4 = stage units`. `StageImage` takes the intrinsic size and does
the division, which keeps the source file the single point of truth for an asset's size.

**Assets are reused across pages.** The same PNG frequently plays a different role on a
different page — section 2's curtains reappear in sections 3 and 4 (and mirrored, in section
7); the twin-bouquet garland is section 4's bottom flourish and section 5's top one; the
foliage sprigs in section 6 are placed twice on that one page, once as the top corners and
once as the bottom. Never assume an asset belongs to one section — match it fresh each time.

**One element per asset.** Each asset is its own element rather than a flattened background,
because the animation pass targets them individually. Section files declare layers
bottom-to-top and DOM order is the stacking order. Raster layers carry `data-asset="<n>"`,
the original file number in `project-info/per-asset` (`Asset <n>@4x.png`).

**Positions are measured, not eyeballed.** Each asset is matched against the reference render
of its page, then the composite is refined against that render as a group. Dark-on-dark
sections are contrast-stretched around the background colour first, otherwise there is no
signal to match on. Small or thin assets (text lines, monograms, gold trims) need a visual
hint before a local search — the naive global search reliably locks onto the wrong periodic
repeat or loses a low-contrast element entirely; see the per-section notes below.

## Vector art and raster crops taken from the PDF

A few pieces of section 2 and 3 could not come from `per-asset/`, so they're extracted from
the PDF directly instead. Both scripts need poppler's `pdftocairo` on PATH.

| Source | Output | Why |
| --- | --- | --- |
| `scripts/extract-name-art.mjs` | section 2's `name-aldi.svg`, `name-nahla.svg` | The script lettering was outlined in Illustrator with manual tracking and an alternate ampersand — re-setting the strings in Aston Script lands nowhere near it. |
| `scripts/extract-ornament-art.mjs` | section 2's `ornament.svg` | `Asset 16@4x.png` bundles both starbursts at a spacing the design doesn't use. |
| direct `pdftoppm` crop | section 3's `top-strip.png` | The top-centre flower is composited from ~20 individually-clipped raster fragments with no single-file export. A high-DPI crop of the reference render, layered above the curtains, was the practical fix — not worth reconstructing from the PDF's layer graph for one cluster. |

All three outputs are committed, so a normal build does not need poppler.

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

All seven are sliced. Mean per-pixel error against the reference PDF render, section by section:

| # | Section | Slug | Error (/255) |
|---|---------|------|---------------|
| 1 | Cover / envelope | `cover` | 1.9 |
| 2 | Hero "Aldi & Nahla" | `hero` | 1.7 |
| 3 | Quote (Q.S. Ar-Rum:21) | `quote` | 3.5 |
| 4 | Bride & groom | `couple` | 4.8 |
| 5 | Date & time | `schedule` | 8.9 |
| 6 | Location + QR | `location` | 3.7 |
| 7 | Closing + RSVP | `closing` | 12.8 |

Sections 5 and 7 sit higher mostly because of fine-line artwork (the house illustration's thin
gold strokes, curtain velvet folds) amplifying per-pixel diff even when the layers are
correctly placed — confirmed by eye against the reference, not just the number. Worth a second
pass if pixel accuracy on those two needs to come down further.

Animation, transitions and interactions are a later stage — sections are static for now.

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

**There are two artboards, and a section says which one it uses.** Nahla's feedback revision
(ANDEV-51) redrew the pages at 1280 × 2772 and ships them as loose PNGs in
`project-info/per-asset-revision/<Page Name>` rather than as a PDF. Sections move over one at
a time, so `src/design/stage.ts` exports both `ARTBOARD_ORIGINAL` (1080 × 1920, the PDF) and
`ARTBOARD_REVISED` (1280 × 2772), and `Stage` takes an `artboard` prop that defaults to the
original — only a migrated section passes one. Sections 1 and 2 are migrated; 3-7 are not.

`Stage` sets up that coordinate space and scales it to the viewport, publishing the artboard on
a context so `StageImage`, `StageBox`, `StageText` and `StageEmbed` all resolve
against the same page size. They place things by their top-left corner (or baseline) in stage
units. Geometry is emitted as percentages, so the composition stays pixel-accurate at any size
without JS measurement. The artboard is capped to a column of its own aspect ratio, so a wide
viewport shows the invitation as a centred phone-shaped frame.

One consequence of migrating page by page: the revised artboard is 9:19.5 where the original is
9:16, so on a 9:16 viewport sections 1-2 render ~9% narrower than the sections after them, each
filling the margin with its own background. It resolves itself as the remaining pages move over.

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

**Assets are exported @4x.** Every PNG in `project-info/per-asset` and
`project-info/per-asset-revision` is four times its design size, so
`intrinsic pixels ÷ 4 = stage units`. `StageImage` takes the intrinsic size and does the
division, which keeps the source file the single point of truth for an asset's size — note
`assetWidth`/`assetHeight` are the *source* PNG's size even where the shipped webp is
downscaled from it (see below), because that ratio is what the stage-unit maths needs.

**Web assets are built by script, not by hand.** `node scripts/build-revised-assets.mjs` writes
`public/assets/section-<nn>` from the revised source PNGs — every migrated section, or just the
one named as an argument: 0.5× (so 2× stage units, still oversampled at DPR 3 on a phone), lossy
webp for shaded artwork and lossless for flat type and line work, plus the crops where one source
file holds several independently-placed pieces. Needs ImageMagick 7; outputs are committed, so a
normal build does not. Sections 3-7 predate the script and their assets were cut by hand.

**Assets are reused across pages.** The same PNG frequently plays a different role on a
different page — section 2's curtains reappear in sections 3 and 4 (and mirrored, in section
7); the twin-bouquet garland is section 4's bottom flourish and section 5's top one; the
foliage sprigs in section 6 are placed twice on that one page, once as the top corners and
once as the bottom. Never assume an asset belongs to one section — match it fresh each time.

**One element per asset.** Each asset is its own element rather than a flattened background,
because the animation pass targets them individually. Section files declare layers
bottom-to-top and DOM order is the stacking order. Raster layers carry `data-asset="<n>"`,
the source file number in that section's asset folder.

**Positions are measured, not eyeballed.** Each asset is matched against the reference render
of its page, then the composite is refined against that render as a group. Dark-on-dark
sections are contrast-stretched around the background colour first, otherwise there is no
signal to match on. Small or thin assets (text lines, monograms, gold trims) need a visual
hint before a local search — the naive global search reliably locks onto the wrong periodic
repeat or loses a low-contrast element entirely; see the per-section notes below.

**Stacking order is measured too, and it is not always consistent.** Where two layers overlap,
compare the reference against each layer's own pixels over the overlap and count which one it
matches — that answers "which is on top" without guessing. It can come back *mixed*, because
the source artwork interleaves pieces that ship as one flat PNG: in section 1, asset 5's
top-left leaves pass under the card but its heliconia spike crosses over it. Take the majority
and note the residual rather than assuming a single order must be right.

**Live text has to be matched to the artwork it replaces, weight included.** The guest-name slot
is real text, and reproducing its placeholder art needed Charter *Bold*, not Black — the
`?to=`-driven `StageText` renders headlessly and gets swept over size and baseline against the
reference until the band's per-pixel error bottoms out. Matching the ink width alone is not
enough: several (weight, size) pairs hit the right width and only one has the right stroke.

## Raster crops taken from the PDF

One piece of section 3 could not come from `per-asset/`, so it is cropped out of the PDF
directly instead: section 3's `top-strip.png`, whose top-centre flower is composited from ~20
individually-clipped raster fragments with no single-file export. A high-DPI `pdftoppm` crop of
the reference render, layered above the curtains, was the practical fix — not worth
reconstructing from the PDF's layer graph for one cluster. The output is committed, so a normal
build does not need poppler.

Section 2 used to need two more of these — the script lettering and the fern starburst, both
traced out of the PDF because `per-asset/`'s exports of them were unusable. Nahla's revised set
carries both correctly, so those scripts and their SVGs are gone.

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

All seven are sliced. Mean per-pixel error against the reference render, section by section
(sections 1-2 against Nahla's renders of the revised pages, the rest against the PDF):

| # | Section | Slug | Error (/255) |
|---|---------|------|---------------|
| 1 | Cover / envelope | `cover` | 1.8 |
| 2 | Hero "Aldi & Nahla" | `hero` | 2.6 |
| 3 | Quote (Q.S. Ar-Rum:21) | `quote` | 3.5 |
| 4 | Bride & groom | `couple` | 4.8 |
| 5 | Date & time | `schedule` | 8.9 |
| 6 | Location + QR | `location` | 3.7 |
| 7 | Closing + RSVP | `closing` | 12.8 |

Sections 5 and 7 sit higher mostly because of fine-line artwork (the house illustration's thin
gold strokes, curtain velvet folds) amplifying per-pixel diff even when the layers are
correctly placed — confirmed by eye against the reference, not just the number. Worth a second
pass if pixel accuracy on those two needs to come down further.

Sections 1-2 are measured from a live headless render rather than a static composite. Section
1's figure excludes the band holding the "Buka Undangan" CTA — its gold glow pulses (ANDEV-44),
so that band never matches a still reference on any given frame. Section 2's reference is a
screenshot rather than a direct export, so it carries a display colour profile; converting it to
sRGB before measuring is what takes its figure from 21 to 2.6, and skipping that step makes any
comparison against it meaningless.

Sections 3-7 are still on the original artwork; Nahla's revised pages for them are sitting in
`project-info/per-asset-revision` (`Doa`, `Nama Panjang`, `RSVP`, `Tanggal Waktu`, `Tempat`)
waiting to be sliced the same way.

Animation, transitions and interactions are a later stage — sections are static for now, apart
from section 1's open-envelope interaction.

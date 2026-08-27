/**
 * Extracts the faint radial fern ornament from page 2 of the reference PDF as SVG.
 *
 * `Asset 16@4x.png` bundles both starbursts into a single 1581-unit-wide export, but the
 * design places two independent instances, each clipped to 545 units. No placement or scale
 * of that export reproduces the reference — a full-page sweep scored it barely better than
 * omitting the ornament entirely — so the vector art is taken from the PDF instead. It is
 * also smaller than the PNG (~280 KB of path data against 677 KB) and stays crisp.
 *
 * The PDF applies a uniform 10% soft mask to each instance, which becomes a group opacity.
 *
 * Requires poppler's `pdftocairo` on PATH (`brew install poppler`).
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PDF = 'project-info/Asset Undangan Digital.pdf'
const OUT = 'public/assets/section-02/ornament.svg'

/** The two ornament instances on page 2, with where the page places each one. */
const INSTANCES = [
  { id: 'source-12', translate: [0, 1014] },
  { id: 'source-9', translate: [535, 1014] },
]
/** Opacity of the soft mask the PDF applies to both instances. */
const OPACITY = 0.1
/** Page-space box the two instances cover together. */
const VIEWBOX = { x: 0, y: 1014, width: 1080, height: 795 }

const work = join(tmpdir(), `ornament-art-${process.pid}`)
mkdirSync(work, { recursive: true })
const svgPath = join(work, 'page2.svg')
execFileSync('pdftocairo', ['-svg', '-f', '2', '-l', '2', PDF, svgPath], { stdio: 'inherit' })
const svg = readFileSync(svgPath, 'utf8')

/** Returns the full `<g id="...">…</g>` element, matching nested groups. */
function groupElement(source, id) {
  const start = source.indexOf(`<g id="${id}"`)
  if (start < 0) throw new Error(`group ${id} not found`)
  const openEnd = source.indexOf('>', start) + 1
  let depth = 1
  let cursor = openEnd
  while (depth > 0) {
    const nextOpen = source.indexOf('<g', cursor)
    const nextClose = source.indexOf('</g>', cursor)
    if (nextClose < 0) throw new Error(`group ${id} is unterminated`)
    if (nextOpen >= 0 && nextOpen < nextClose) {
      depth += 1
      cursor = source.indexOf('>', nextOpen) + 1
    } else {
      depth -= 1
      cursor = nextClose + 4
    }
  }
  return { open: source.slice(start, openEnd), inner: source.slice(openEnd, cursor - 4) }
}

/** Every `<clipPath>` the markup references, following references found inside them. */
function collectClipPaths(source, markup) {
  const wanted = new Set()
  const queue = [...markup.matchAll(/clip-path="url\(#([^)]+)\)"/g)].map((m) => m[1])
  const defs = []
  while (queue.length) {
    const id = queue.shift()
    if (wanted.has(id)) continue
    wanted.add(id)
    const start = source.indexOf(`<clipPath id="${id}">`)
    if (start < 0) throw new Error(`clipPath ${id} not found`)
    const end = source.indexOf('</clipPath>', start) + '</clipPath>'.length
    const def = source.slice(start, end)
    defs.push(def)
    for (const m of def.matchAll(/clip-path="url\(#([^)]+)\)"/g)) queue.push(m[1])
  }
  return defs
}

const defs = []
const bodies = []
for (const { id, translate } of INSTANCES) {
  const { open, inner } = groupElement(svg, id)
  defs.push(...collectClipPaths(svg, open + inner))
  const clip = open.match(/clip-path="url\(#([^)]+)\)"/)
  const clipAttr = clip ? ` clip-path="url(#${clip[1]})"` : ''
  bodies.push(
    `<g transform="translate(${translate[0]},${translate[1]})"><g${clipAttr}>${inner}</g></g>`,
  )
}

const out =
  `<svg xmlns="http://www.w3.org/2000/svg" ` +
  `viewBox="${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.width} ${VIEWBOX.height}">` +
  `<defs>${[...new Set(defs)].join('')}</defs>` +
  `<g opacity="${OPACITY}">${bodies.join('')}</g></svg>\n`

mkdirSync('public/assets/section-02', { recursive: true })
writeFileSync(OUT, out)
rmSync(work, { recursive: true, force: true })
console.log(`${OUT} — ${(out.length / 1024).toFixed(0)} KB, ${defs.length} clip paths`)

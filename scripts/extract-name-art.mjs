/**
 * Extracts the gold "Aldi &" / "Nahla" lettering from page 2 of the reference PDF as SVG.
 *
 * Those two lines are the only text in the design that cannot be reproduced with the
 * supplied fonts: they were outlined in Illustrator with manual tracking and an alternate
 * ampersand, so setting the same strings in Aston Script lands nowhere near the original
 * (measured IoU ~0.27). Taking the vector outlines straight from the PDF is exact, stays
 * crisp at any scale, and keeps each word as its own element for the animation pass.
 *
 * Requires poppler's `pdftocairo` on PATH (`brew install poppler`).
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PDF = 'project-info/Asset Undangan Digital.pdf'
const OUT = 'public/assets/section-02'

/** Fill emitted by pdftocairo for the gold #b78b4e. */
const GOLD_FILL = /fill="rgb\(71\.\d+%, ?54\.\d+%, ?30\.\d+%\)"/
/** Vertical split between the two lines, in page units. */
const LINE_SPLIT_Y = 760

const work = join(tmpdir(), `name-art-${process.pid}`)
mkdirSync(work, { recursive: true })
const svgPath = join(work, 'page2.svg')

execFileSync('pdftocairo', ['-svg', '-f', '2', '-l', '2', PDF, svgPath], { stdio: 'inherit' })
const svg = readFileSync(svgPath, 'utf8')

const goldPath = svg.match(
  new RegExp(`<path[^>]*${GOLD_FILL.source}[^>]*d="([^"]*)"[^>]*/?>`),
)
if (!goldPath) throw new Error('gold lettering path not found on page 2')

/** pdftocairo emits absolute M/L/C/Z, so every number is one coordinate of a pair. */
function bounds(subpath) {
  const nums = subpath.match(/-?\d+(?:\.\d+)?/g).map(Number)
  const xs = nums.filter((_, i) => i % 2 === 0)
  const ys = nums.filter((_, i) => i % 2 === 1)
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }
}

const subpaths = goldPath[1].split(/(?=M )/).filter((s) => s.trim())
const lines = { 'name-aldi': [], 'name-nahla': [] }
for (const sub of subpaths) {
  const b = bounds(sub)
  lines[(b.y0 + b.y1) / 2 < LINE_SPLIT_Y ? 'name-aldi' : 'name-nahla'].push({ sub, b })
}

mkdirSync(OUT, { recursive: true })
const report = {}
for (const [name, parts] of Object.entries(lines)) {
  const x0 = Math.min(...parts.map((p) => p.b.x0))
  const y0 = Math.min(...parts.map((p) => p.b.y0))
  const x1 = Math.max(...parts.map((p) => p.b.x1))
  const y1 = Math.max(...parts.map((p) => p.b.y1))
  const w = +(x1 - x0).toFixed(2)
  const h = +(y1 - y0).toFixed(2)
  const d = parts.map((p) => p.sub.trim()).join(' ')
  const out =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0.toFixed(2)} ${y0.toFixed(2)} ${w} ${h}">` +
    `<path fill="#b78b4e" fill-rule="nonzero" d="${d}"/></svg>\n`
  writeFileSync(join(OUT, `${name}.svg`), out)
  report[name] = { x: +x0.toFixed(2), y: +y0.toFixed(2), width: w, height: h, subpaths: parts.length }
}

rmSync(work, { recursive: true, force: true })
console.log(JSON.stringify(report, null, 2))

/**
 * Converts the source fonts in `project-info/fonts` into web fonts in `public/fonts`.
 *
 * `Charter.ttc` is a TrueType Collection holding six faces, which browsers cannot
 * load directly — each face is extracted by index and re-emitted as woff2.
 * Requires fontTools + brotli: `pip install fonttools brotli`.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const PYTHON = process.env.PYTHON ?? 'python3'
const SRC = 'project-info/fonts'
const OUT = 'public/fonts'

/** Face order inside Charter.ttc, as reported by the `name` table. */
const faces = [
  { file: `${SRC}/Charter.ttc`, index: 0, out: 'charter-regular' },
  { file: `${SRC}/Charter.ttc`, index: 1, out: 'charter-italic' },
  { file: `${SRC}/Charter.ttc`, index: 2, out: 'charter-bold-italic' },
  { file: `${SRC}/Charter.ttc`, index: 3, out: 'charter-bold' },
  { file: `${SRC}/Charter.ttc`, index: 4, out: 'charter-black-italic' },
  { file: `${SRC}/Charter.ttc`, index: 5, out: 'charter-black' },
  { file: `${SRC}/Aston Script.ttf`, index: null, out: 'aston-script' },
]

mkdirSync(OUT, { recursive: true })

for (const face of faces) {
  const args = [
    '-m',
    'fontTools.subset',
    face.file,
    '--unicodes=U+0000-00FF,U+2018-201F,U+2022,U+2026,U+2039-203A,U+20AC',
    '--layout-features=*',
    '--flavor=woff2',
    `--output-file=${OUT}/${face.out}.woff2`,
  ]
  if (face.index !== null) args.push(`--font-number=${face.index}`)
  execFileSync(PYTHON, args, { stdio: 'inherit' })
  console.log(`✓ ${OUT}/${face.out}.woff2`)
}

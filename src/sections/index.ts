import type { ComponentType } from 'react'
import { CoverSection } from './CoverSection'
import { HeroSection } from './HeroSection'

/**
 * The invitation in order. Keys match the page numbers of
 * `project-info/Asset Undangan Digital.pdf` and are the slugs used by `/preview/$section`.
 */
export const SECTIONS: ReadonlyArray<{ slug: string; Component: ComponentType }> = [
  { slug: 'cover', Component: CoverSection },
  { slug: 'hero', Component: HeroSection },
]

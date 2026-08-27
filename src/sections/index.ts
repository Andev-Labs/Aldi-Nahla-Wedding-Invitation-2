import type { ComponentType } from 'react'
import { CoverSection } from './CoverSection'
import { HeroSection } from './HeroSection'
import { CoupleSection } from './CoupleSection'
import { QuoteSection } from './QuoteSection'
import { ClosingSection } from './ClosingSection'
import { LocationSection } from './LocationSection'
import { ScheduleSection } from './ScheduleSection'

/**
 * The invitation in order. Keys match the page numbers of
 * `project-info/Asset Undangan Digital.pdf` and are the slugs used by `/preview/$section`.
 */
export const SECTIONS: ReadonlyArray<{ slug: string; Component: ComponentType }> = [
  { slug: 'cover', Component: CoverSection },
  { slug: 'hero', Component: HeroSection },
  { slug: 'quote', Component: QuoteSection },
  { slug: 'couple', Component: CoupleSection },
  { slug: 'schedule', Component: ScheduleSection },
  { slug: 'location', Component: LocationSection },
  { slug: 'closing', Component: ClosingSection },
]

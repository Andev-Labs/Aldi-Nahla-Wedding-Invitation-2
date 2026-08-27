import { createFileRoute, notFound } from '@tanstack/react-router'
import { SECTIONS } from '~/sections'

/**
 * Renders one section on its own, so it can be compared against the matching page of the
 * reference PDF without scrolling. Slugs are listed in `src/sections/index.ts`.
 */
export const Route = createFileRoute('/preview/$section')({
  loader: ({ params }) => {
    if (!SECTIONS.some((s) => s.slug === params.section)) throw notFound()
  },
  component: SectionPreview,
})

function SectionPreview() {
  const { section } = Route.useParams()
  const entry = SECTIONS.find((s) => s.slug === section)
  if (!entry) return null
  return <entry.Component />
}

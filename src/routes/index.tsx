import { createFileRoute } from '@tanstack/react-router'
import { MotionConfig } from 'motion/react'
import { SECTIONS } from '~/sections'

type InvitationSearch = {
  /** Guest name from the invitation link, e.g. `/?to=Budi+Santoso`. Read by `CoverSection`. */
  to?: string
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): InvitationSearch => {
    const to = typeof search.to === 'string' ? search.to.trim() : ''
    return to ? { to } : {}
  },
  component: InvitationPage,
})

function InvitationPage() {
  return (
    // `reducedMotion="user"` defers to the OS-level prefers-reduced-motion setting, so the
    // scroll-reveal / envelope-open animation pass never fights an accessibility preference.
    <MotionConfig reducedMotion="user">
      <main>
        {SECTIONS.map(({ slug, Component }) => (
          <Component key={slug} />
        ))}
      </main>
    </MotionConfig>
  )
}

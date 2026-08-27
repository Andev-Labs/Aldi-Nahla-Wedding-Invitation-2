import { createFileRoute } from '@tanstack/react-router'
import { MotionConfig } from 'motion/react'
import { SECTIONS } from '~/sections'

export const Route = createFileRoute('/')({
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

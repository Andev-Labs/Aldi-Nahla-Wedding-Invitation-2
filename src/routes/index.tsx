import { createFileRoute } from '@tanstack/react-router'
import { SECTIONS } from '~/sections'

export const Route = createFileRoute('/')({
  component: InvitationPage,
})

function InvitationPage() {
  return (
    <main>
      {SECTIONS.map(({ slug, Component }) => (
        <Component key={slug} />
      ))}
    </main>
  )
}

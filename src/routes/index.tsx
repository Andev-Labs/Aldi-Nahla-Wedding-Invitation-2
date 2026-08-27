import { createFileRoute } from '@tanstack/react-router'
import { CoverSection } from '~/sections/CoverSection'

export const Route = createFileRoute('/')({
  component: InvitationPage,
})

function InvitationPage() {
  return (
    <main>
      <CoverSection />
    </main>
  )
}

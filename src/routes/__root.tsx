import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'
import appCss from '~/styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'theme-color', content: '#061a17' },
      { title: 'Aldi & Nahla — 5 September 2026' },
      {
        name: 'description',
        content: 'Undangan pernikahan Aldi Ramadhan & Nahla Karima, Sabtu 5 September 2026.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'preload', href: '/fonts/aston-script.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { rel: 'preload', href: '/fonts/charter-regular.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      {/*
        `reducedMotion="user"` makes every `motion` component here honour the guest's own
        "reduce motion" setting: Motion drops the transform half of each variant — the rise, the
        scale, the rule drawing itself — and keeps the opacity half, so a guest who has asked
        their phone for less movement still gets the content revealed, just by fading. Set once
        at the root rather than per variant, since it is a property of the reader, not the page.
      */}
      <MotionConfig reducedMotion="user">
        <Outlet />
      </MotionConfig>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

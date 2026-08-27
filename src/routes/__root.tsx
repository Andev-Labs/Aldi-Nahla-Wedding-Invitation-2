import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { ReactLenis } from 'lenis/react'
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
      <Outlet />
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
        {/* `respectReducedMotion` defers to the OS-level prefers-reduced-motion setting, same
            as the `MotionConfig reducedMotion="user"` used for the section reveal animations. */}
        <ReactLenis root options={{ respectReducedMotion: true }}>
          {children}
        </ReactLenis>
        <Scripts />
      </body>
    </html>
  )
}

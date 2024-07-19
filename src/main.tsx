import type { RouteObject } from 'react-router-dom'

import type { App } from '@/apps/types'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { PiDotsThreeVertical } from 'react-icons/pi'
import {
  createBrowserRouter,
  NavLink,
  redirect,
  RouterProvider,
} from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'

import { apps, NavigationApp } from '@/apps'

import { Alic3 } from '@/components/Alic3'
import { WithTitle } from '@/components/WithTitle'

import { addAmoLoaderToWindow } from '@/utils/ammoCompatHelper'
import { setAllRequiredPolyfills } from '@/utils/polyfills'

import '@/main.scss'

import styles from '@/layout.module.scss'
import { Footer } from './components/Footer'

setAllRequiredPolyfills()
addAmoLoaderToWindow()

export function Layout({ children }: React.PropsWithChildren): React.ReactNode {
  const [sideOpen, setSideOpen] = React.useState<boolean>(true)

  const toggleDrawer = (): void => {
    setSideOpen((prevSideOpen: boolean): boolean => !prevSideOpen)
  }

  return (
    <div className={styles.layout}>
      <div className={`${styles.side} ${sideOpen ? '' : styles.closed}`}>
        <nav className={styles.nav}>
          <Alic3 header />

          <div className={styles['nav-item']}>
            <NavLink
              to={`/`}
              className={({ isActive, isPending }) =>
                isPending ? 'pending' : isActive ? 'active' : ''
              }
            >
              Home
            </NavLink>
          </div>

          {apps.map(
            (app: App, index: number): React.ReactElement => (
              <div
                key={`${app.displayName}-${index}`}
                className={styles['nav-item']}
              >
                <NavLink
                  to={`/examples/${index + 1}`}
                  className={({ isActive, isPending }) =>
                    isPending ? 'pending' : isActive ? 'active' : ''
                  }
                >
                  {app.displayName ?? app.Component.name}
                </NavLink>
              </div>
            ),
          )}

          <div className={styles['nav-spacer']} />

          <Footer />
        </nav>

        <button className={styles['drawer-tab']} onClick={toggleDrawer}>
          <PiDotsThreeVertical />
        </button>
      </div>

      <div className={styles.content}>{children}</div>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Layout>
        <NavigationApp />
      </Layout>
    ),
  },
  ...apps.map(
    ({ Component, displayName }: App, index: number): RouteObject => ({
      path: `/examples/${index + 1}`,
      element: (
        <Layout>
          <WithTitle title={displayName}>
            <Component />
          </WithTitle>
        </Layout>
      ),
    }),
  ),
  {
    path: '*',
    loader: async (): Promise<Response> => {
      return redirect('/')
    },
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Analytics />
  </React.StrictMode>,
)

import type { NavLinkRenderProps, RouteObject } from 'react-router-dom'

import type { App } from '@/apps/types'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { PiDotsThreeVertical, PiHouseLineDuotone } from 'react-icons/pi'

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
import { Footer } from './components/Footer'

import { addAmoLoaderToWindow } from '@/utils/ammoCompatHelper'
import { setAllRequiredPolyfills } from '@/utils/polyfills'

import '@/main.scss'

import styles from '@/layout.module.scss'

setAllRequiredPolyfills()
addAmoLoaderToWindow()

export function Layout({ children }: React.PropsWithChildren): React.ReactNode {
  const [sideOpen, setSideOpen] = React.useState<boolean>(true)

  const toggleDrawer = (): void => {
    setSideOpen((prevSideOpen: boolean): boolean => !prevSideOpen)
  }

  const navLinkClassName = ({
    isActive,
    isPending,
  }: NavLinkRenderProps): string => {
    return `${styles['nav-item']} ${
      isPending ? styles.pending : isActive ? styles.active : ''
    }`
  }

  return (
    <div className={styles.layout}>
      <div className={`${styles.side} ${sideOpen ? '' : styles.closed}`}>
        <nav className={styles.nav}>
          <Alic3 header />

          <NavLink to={`/`} className={navLinkClassName}>
            <PiHouseLineDuotone />
            Home
          </NavLink>

          {apps.map(
            (app: App, index: number): React.ReactElement => (
              <NavLink
                key={`${app.displayName}-${index}`}
                to={`/examples/${index + 1}`}
                className={navLinkClassName}
              >
                {app.displayName ?? app.Component.name}
              </NavLink>
            ),
          )}

          <div className={styles['nav-spacer']} />

          <div className={styles['nav-item']}>
            <Footer />
          </div>
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
      <WithTitle title="Examples made with Three.js">
        <Layout>
          <NavigationApp />
        </Layout>
      </WithTitle>
    ),
  },
  ...apps.map(
    ({ Component, displayName }: App, index: number): RouteObject => ({
      path: `/examples/${index + 1}`,
      element: (
        <WithTitle title={displayName}>
          <Layout>
            <Component />
          </Layout>
        </WithTitle>
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

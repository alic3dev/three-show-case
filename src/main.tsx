import type {
  Location,
  NavLinkRenderProps,
  RouteObject,
} from 'react-router-dom'

import type { App } from '@/apps/types'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { PiDotsThreeVertical, PiHouseLineDuotone } from 'react-icons/pi'
import {
  createBrowserRouter,
  NavLink,
  redirect,
  RouterProvider,
  useLocation,
} from 'react-router-dom'

import { Analytics } from '@vercel/analytics/react'

import { apps, NavigationApp } from '@/apps'

import { Alic3 } from '@/components/Alic3'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Footer } from '@/components/Footer'
import { WithTitle } from '@/components/WithTitle'

import { addAmoLoaderToWindow } from '@/utils/ammoCompatHelper'
import { LOCAL_STORAGE_KEYS } from '@/utils/constants'
import { setAllRequiredPolyfills } from '@/utils/polyfills'

import '@/main.scss'

import styles from '@/layout.module.scss'

setAllRequiredPolyfills()
addAmoLoaderToWindow()

export function Layout({ children }: React.PropsWithChildren): React.ReactNode {
  const location: Location = useLocation()

  const [sideOpen, setSideOpen] = React.useState<boolean>((): boolean => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const localStorageValue = window.localStorage.getItem(
        LOCAL_STORAGE_KEYS.drawerOpen,
      )

      let parsedValue: unknown

      if (localStorageValue) {
        try {
          parsedValue = JSON.parse(localStorageValue)
        } catch {
          /* Empty */
        }
      }

      if (typeof parsedValue === 'boolean') {
        return parsedValue
      } else {
        window.localStorage.removeItem(LOCAL_STORAGE_KEYS.drawerOpen)
      }
    }

    return true
  })

  const toggleDrawer = React.useCallback((): void => {
    setSideOpen((prevSideOpen: boolean): boolean => {
      const newValue: boolean = !prevSideOpen

      if (window.localStorage) {
        window.localStorage.setItem(
          LOCAL_STORAGE_KEYS.drawerOpen,
          JSON.stringify(newValue),
        )
      }

      return newValue
    })
  }, [])

  const navLinkClassName = React.useCallback(
    ({ isActive, isPending }: NavLinkRenderProps): string => {
      return `${styles['nav-item']} ${
        isPending ? styles.pending : isActive ? styles.active : ''
      }`
    },
    [],
  )

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

      <div className={styles.content}>
        <ErrorBoundary key={location.key}>{children}</ErrorBoundary>
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <WithTitle title="Examples made with Three.js">
          <Layout>
            <NavigationApp />
          </Layout>
        </WithTitle>
      </ErrorBoundary>
    ),
  },
  ...apps.map(
    ({ Component, displayName }: App, index: number): RouteObject => ({
      path: `/examples/${index + 1}`,
      element: (
        <ErrorBoundary>
          <WithTitle title={displayName}>
            <Layout>
              <Component />
            </Layout>
          </WithTitle>
        </ErrorBoundary>
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

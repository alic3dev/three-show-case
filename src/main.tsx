import type { RouteObject } from 'react-router-dom'

import type { App as AppType } from '@/apps/types'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'

import { apps, NavigationApp } from '@/apps/index.ts'

import { WithTitle } from '@/components/WithTitle'

import { addAmoLoaderToWindow } from '@/utils/ammoCompatHelper'
import { setAllRequiredPolyfills } from '@/utils/polyfills'

import '@/main.scss'

setAllRequiredPolyfills()
addAmoLoaderToWindow()

const router = createBrowserRouter([
  {
    path: '/',
    element: <NavigationApp />,
  },
  ...apps.map(
    ({ Component, displayName }: AppType, index: number): RouteObject => ({
      path: `/examples/${index + 1}`,
      element: (
        <WithTitle title={displayName}>
          <Component />
        </WithTitle>
      ),
    }),
  ),
  {
    path: '*',
    Component: (): React.ReactElement => {
      window.location.href = '/'
      return <></>
    },
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Analytics />
  </React.StrictMode>,
)

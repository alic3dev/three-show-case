import type { App } from '@/apps/types'

import React from 'react'
import { Link } from 'react-router-dom'
import { SiThreedotjs } from 'react-icons/si'

import { apps } from '@/apps'

import styles from '@/apps/NavigationApp.module.scss'

export function NavigationApp(): React.ReactElement {
  return (
    <div className={styles.app}>
      <h1 className={styles.title}>Examples</h1>
      <h3 className={styles['sub-title']}>
        made with <a href="https://threejs.org/">Three.JS</a>{' '}
        <SiThreedotjs className={styles.logo} />
      </h3>
      <ol className={styles.examples}>
        {apps.map(
          (app: App, index: number): React.ReactElement => (
            <li key={`${app.displayName}-${index}`} className={styles.example}>
              <Link to={`/examples/${index + 1}`}>
                {app.displayName ?? app.component.name}
              </Link>
            </li>
          ),
        )}
      </ol>
    </div>
  )
}

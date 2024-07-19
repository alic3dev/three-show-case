import React from 'react'
import { SiThreedotjs } from 'react-icons/si'
import { PiGithubLogoDuotone, PiHeartDuotone } from 'react-icons/pi'

import styles from '@/apps/NavigationApp.module.scss'

export function NavigationApp(): React.ReactElement {
  return (
    <div className={styles.app}>
      <h1 className={styles.title}>Examples</h1>
      <h3 className={styles['sub-title']}>
        made with <a href="https://threejs.org/">Three.JS</a>{' '}
        <SiThreedotjs className={styles.logo} />
      </h3>

      <div className={styles['nav-item']}>
        <PiGithubLogoDuotone />
        Check out the&nbsp;
        <a href="https://github.com/alic3dev/three-show-case">repo</a>
      </div>

      <div className={styles['nav-item']}>
        <PiHeartDuotone />
        Made with love, by&nbsp;<a href="https://alic3.dev">Alice</a>
      </div>
    </div>
  )
}

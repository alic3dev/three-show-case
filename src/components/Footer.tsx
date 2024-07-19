import React from 'react'

import styles from '@/components/Footer.module.scss'

const copyrightYear: number = new Date().getFullYear()

export function Footer(): React.ReactNode {
  return (
    <div className={styles.footer}>
      &copy; Alice Grace {copyrightYear > 2024 ? copyrightYear : 2024}
    </div>
  )
}

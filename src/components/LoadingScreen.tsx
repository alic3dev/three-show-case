import React from 'react'

import styles from '@/components/LoadingScreen.module.scss'

export function LoadingScreen({
  loading = false,
  delay = 250,
  children,
}: React.PropsWithChildren<{
  loading?: boolean
  delay?: number
}>): React.ReactElement {
  const [ready, setReady] = React.useState<boolean>(delay === 0)

  React.useEffect((): (() => void) => {
    const timeout: number = window.setTimeout((): void => {
      setReady(true)
    }, delay)

    return (): void => {
      window.clearTimeout(timeout)
    }
  }, [delay])

  if (ready && loading) {
    return (
      <div className={styles['loading-screen']}>
        <div className={styles.text}>
          <div>Loading</div>
          {/* <div className={styles.ellipses}>
            <div
              className={`${styles.ellipse} ${
                ellipsesCount >= 1 ? styles.shown : ''
              }`}
            />
            <div
              className={`${styles.ellipse} ${
                ellipsesCount >= 2 ? styles.shown : ''
              }`}
            />
            <div
              className={`${styles.ellipse} ${
                ellipsesCount >= 3 ? styles.shown : ''
              }`}
            />
          </div> */}
        </div>

        <div className={styles.dots}>
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
        </div>
      </div>
    )
  }

  return <>{children}</>
}

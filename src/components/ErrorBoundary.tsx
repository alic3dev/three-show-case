import React from 'react'

import styles from '@/components/ErrorBoundary.module.scss'

interface ErrorBoundaryState {
  error: unknown
  hasError: boolean
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren) {
    super(props)

    this.state = { error: undefined, hasError: false }
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { error, hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.log(error, errorInfo.componentStack)
  }

  render(): React.ReactNode {
    let name: string = ''
    let message: string = ''
    let stack: string = ''

    if (this.state.error instanceof Error) {
      message = this.state.error.message
      name = this.state.error.name

      if (this.state.error.stack) {
        stack = this.state.error.stack
      }
    } else if (this.state.error) {
      JSON.stringify(this.state.error)
    }

    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className={styles.wrapper}>
          <div className={styles.container}>
            <h2 className={styles.title}>An unexpected error has occured</h2>

            <div className={styles.info}>
              {name ? <span className={styles.name}>{name}: </span> : <></>}
              {message ? <span>{message}</span> : <></>}
            </div>

            {stack ? <pre className={styles.code}>{stack}</pre> : <></>}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

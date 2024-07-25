import React from 'react'

export type LoadableResolver = () => void

type AddBatchedLoadable = (count: number) => LoadableResolver
type AddLoadable = () => LoadableResolver

export interface LoadManager {
  loading: boolean
  addBatchedLoadable: AddBatchedLoadable
  addLoadable: AddLoadable
}

export function useLoadManager({
  initialLoadingState = true,
}: {
  initialLoadingState?: boolean
}): LoadManager {
  const [loading, setLoading] = React.useState<boolean>(initialLoadingState)

  const loadingStates = React.useRef<{ count: number }>({
    count: 0,
  })

  const addBatchedLoadable = React.useCallback<AddBatchedLoadable>(
    (count: number): LoadableResolver => {
      if (loadingStates.current.count === 0) {
        setLoading(true)
      }

      loadingStates.current.count += count

      let hasResolved: boolean = false
      let resolvedCount: number = 0

      return (): void => {
        if (hasResolved) return

        loadingStates.current.count--

        if (loadingStates.current.count === 0) {
          setLoading(false)
        }

        resolvedCount++

        if (resolvedCount >= count) {
          hasResolved = true
        }
      }
    },
    [],
  )

  const addLoadable = React.useCallback<AddLoadable>((): LoadableResolver => {
    return addBatchedLoadable(1)
  }, [addBatchedLoadable])

  return {
    loading,
    addBatchedLoadable,
    addLoadable,
  }
}

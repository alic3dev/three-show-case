import React from 'react'

import { Stats } from '@/utils/stats'

import { LOCAL_STORAGE_KEYS } from '@/utils/constants'

export interface StatsRef {
  stats: Stats
  value: number
  prev: () => void
  next: () => void
}

export type StatsRefObject = React.MutableRefObject<StatsRef>

export function useStats(): StatsRefObject {
  const ref: StatsRefObject = React.useRef<StatsRef>({
    stats: new Stats(),
    value: 0,

    prev: (): void => {
      ref.current.stats.showPanel(--ref.current.value % 4)
      saveValue()
    },

    next: (): void => {
      ref.current.stats.showPanel(++ref.current.value % 4)
      saveValue()
    },
  })

  const saveValue = React.useCallback((): void => {
    window.localStorage.setItem(
      LOCAL_STORAGE_KEYS.statsPanel,
      JSON.stringify(ref.current.value % 4),
    )
  }, [])

  React.useEffect((): void => {
    try {
      const statsPanelValue: unknown = JSON.parse(
        window.localStorage.getItem(LOCAL_STORAGE_KEYS.statsPanel) || '0',
      )

      if (typeof statsPanelValue === 'number') {
        ref.current.value = statsPanelValue
        ref.current.stats.showPanel(statsPanelValue)
      }
    } catch {
      /* Empty */
    }
  }, [])

  return ref
}

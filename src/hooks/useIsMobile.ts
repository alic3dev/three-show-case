import React from 'react'

import { isMobile } from '@/utils/isMobile'

export function useIsMobile(): boolean {
  const [_isMobile, setIsMobile] = React.useState<boolean>(isMobile)

  React.useEffect((): void => {
    setIsMobile(isMobile)
  }, [])

  return _isMobile
}

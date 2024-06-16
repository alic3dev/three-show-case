import type { App } from '@/apps/types'

import { First, displayName as firstDisplayName } from '@/apps/First'
import { Second, displayName as secondDisplayName } from '@/apps/Second'
import { Three, displayName as thirdDisplayName } from '@/apps/Three'
import { Four, displayName as fourthDisplayName } from '@/apps/Four'
import { Five, displayName as fifthDisplayName } from '@/apps/Five'
import { Six, displayName as sixthDisplayName } from '@/apps/Six'
import { Seven, displayName as seventhDisplayName } from '@/apps/Seven'
import { Eight, displayName as eigthDisplayName } from '@/apps/Eight'

export const apps: App[] = [
  { component: First, displayName: firstDisplayName },
  { component: Second, displayName: secondDisplayName },
  { component: Three, displayName: thirdDisplayName },
  { component: Four, displayName: fourthDisplayName },
  { component: Five, displayName: fifthDisplayName },
  { component: Six, displayName: sixthDisplayName },
  { component: Seven, displayName: seventhDisplayName },
  { component: Eight, displayName: eigthDisplayName },
]

export { NavigationApp } from '@/apps/NavigationApp'

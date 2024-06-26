import type { App } from '@/apps/types'

import { BasicCube, displayName as firstDisplayName } from '@/apps/BasicCubeApp'
import {
  RotatingPointLightsApp,
  displayName as secondDisplayName,
} from '@/apps/RotatingPointLightsApp'
import {
  ObjectControlApp,
  displayName as thirdDisplayName,
} from '@/apps/ObjectControlApp'
import {
  DraggableCameraApp,
  displayName as fourthDisplayName,
} from '@/apps/DraggableCameraApp'
import {
  BouncingPhysicsApp,
  displayName as fifthDisplayName,
} from '@/apps/BouncingPhysicsApp'
import {
  LightTricksApp,
  displayName as sixthDisplayName,
} from '@/apps/LightTricksApp'
import {
  ChunkGenerationApp,
  displayName as seventhDisplayName,
} from '@/apps/ChunkGenerationApp'
import {
  FPRoomGenerationApp,
  displayName as eigthDisplayName,
} from '@/apps/FPRoomGenerationApp'
import { OceanApp, displayName as ninthDisplayName } from '@/apps/OceanApp'
import {
  FPBuildingGenerationApp,
  displayName as tenthDisplayName,
} from '@/apps/FPBuildingGenerationApp'
import { PuzzleApp, displayName as eleventhDisplayName } from '@/apps/PuzzleApp'

export const apps: App[] = [
  { Component: BasicCube, displayName: firstDisplayName },
  { Component: RotatingPointLightsApp, displayName: secondDisplayName },
  { Component: ObjectControlApp, displayName: thirdDisplayName },
  { Component: DraggableCameraApp, displayName: fourthDisplayName },
  { Component: BouncingPhysicsApp, displayName: fifthDisplayName },
  { Component: LightTricksApp, displayName: sixthDisplayName },
  { Component: ChunkGenerationApp, displayName: seventhDisplayName },
  { Component: FPRoomGenerationApp, displayName: eigthDisplayName },
  { Component: OceanApp, displayName: ninthDisplayName },
  { Component: FPBuildingGenerationApp, displayName: tenthDisplayName },
  { Component: PuzzleApp, displayName: eleventhDisplayName },
]

export { NavigationApp } from '@/apps/NavigationApp'

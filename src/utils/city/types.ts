import type * as THREE from 'three'

import type { DistrictName, District } from '@/utils/city/District'

export interface City {
  objects: THREE.Group
  toggleDistrictDebugDisplay: () => void
  dispose: () => void
}

export interface CityOptions {
  roadSpacing: THREE.Vector2
  roadTiles: number
  numberOfBuildings: number
  scale: number
  addGLTFModels: boolean
  resolutions: ResolutionsLookup
}

export type DistrictLookup = Record<DistrictName, District>

export type ResolutionType = '1k' | '2k' | '4k'

export interface ResolutionsLookup {
  TEXTURE: ResolutionType
  GLTF: ResolutionType
  HDR: ResolutionType
}

export interface SharedSizesInterface {
  groundExtraSpacing: number
  groundSize: THREE.Vector2
  sidewalkHeight: number
  roadMax: THREE.Vector2
  roadMin: THREE.Vector2
  roadSize: THREE.Vector2
}

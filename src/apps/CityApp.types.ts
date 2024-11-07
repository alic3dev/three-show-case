import type * as THREE from 'three'

import type { City } from '@/utils/city'

export interface RendererPropertiesInterface {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  flashlight: THREE.SpotLight
  ambientLight: THREE.AmbientLight
  city?: City
  debugObjects: {
    grid?: THREE.GridHelper
    axesLines: THREE.AxesHelper
  }
}

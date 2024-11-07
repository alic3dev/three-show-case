// import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'

// import type { GLTFModelName } from '@/apps/CityApp.types'

import * as THREE from 'three'

import { resolveAsset } from '@/utils/resolveAsset'

export interface LoadPolyHavenTextureParams {
  name: string
  res?: string
  format?: string
  ambient?: 'arm' | 'rough'
  repeats?: number | THREE.Vector2
  wrapping?: THREE.Wrapping
  incrementLoadState?: () => void
  skipCache?: boolean
}

export interface PolyHavenTextureResult {
  map: THREE.Texture
  normalMap: THREE.Texture
  aoMap: THREE.Texture
}

// export async function loadPolyHavenGLTFModel(
//   modelName: GLTFModelName,
// ): Promise<GLTF> {
//   if (gltfModelCache[modelName]) {
//     return gltfModelCache[modelName]
//   }

//   gltfModelCache[modelName] = await new GLTFLoader().loadAsync(
//     resolveAsset(
//       `models/${modelName}_${RESOLUTIONS.GLTF}.gltf/${modelName}_${RESOLUTIONS.GLTF}.gltf`,
//     ),
//   )

//   return gltfModelCache[modelName]
// }

export function loadPolyHavenTexture({
  name,
  res = '4k',
  format = 'jpg',
  ambient = 'rough',
  repeats = 1,
  wrapping = THREE.RepeatWrapping,
  incrementLoadState = () => {},
}: LoadPolyHavenTextureParams): PolyHavenTextureResult {
  const _repeats: THREE.Vector2 =
    typeof repeats === 'number' ? new THREE.Vector2(repeats, repeats) : repeats

  const basePath: string = `textures/${name}_${res}.gltf/textures/${name}_`
  const ext: string = `_${res}.${format}`

  let loadCount: number = 0
  function onLoad(texture: THREE.Texture): void {
    texture.wrapS = texture.wrapT = wrapping

    texture.repeat.set(_repeats.x, _repeats.y)

    loadCount++

    if (loadCount === 3) {
      incrementLoadState()
    }
  }

  const map: THREE.Texture = new THREE.TextureLoader().load(
    resolveAsset(`${basePath}diff${ext}`),
    onLoad,
  )

  const normalMap: THREE.Texture = new THREE.TextureLoader().load(
    resolveAsset(`${basePath}nor_gl${ext}`),
    onLoad,
  )

  const aoMap: THREE.Texture = new THREE.TextureLoader().load(
    resolveAsset(`${basePath}${ambient}${ext}`),
    onLoad,
  )

  const result: PolyHavenTextureResult = {
    map,
    normalMap,
    aoMap,
  }

  return result
}

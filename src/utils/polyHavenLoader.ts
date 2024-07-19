import * as THREE from 'three'

import { resolveAsset } from '@/utils/resolveAsset'

export interface PolyHavenTextureResult {
  map: THREE.Texture
  normalMap: THREE.Texture
  aoMap: THREE.Texture
}

export function loadPolyHavenTexture({
  name,
  res = '4k',
  format = 'jpg',
  ambient = 'arm',
  repeats = 10,
  incrementLoadState = () => {},
}: {
  name: string
  res?: string
  format?: string
  ambient?: 'arm' | 'rough'
  repeats?: number | THREE.Vector2
  incrementLoadState?: () => void
}): PolyHavenTextureResult {
  const _repeats: THREE.Vector2 =
    typeof repeats === 'number' ? new THREE.Vector2(repeats, repeats) : repeats

  const basePath: string = `textures/${name}_${res}.gltf/textures/${name}_`
  const ext: string = `_${res}.${format}`

  const onLoad = (texture: THREE.Texture): void => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping

    texture.repeat.set(_repeats.x, _repeats.y)

    incrementLoadState()
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

  return {
    map,
    normalMap,
    aoMap,
  }
}

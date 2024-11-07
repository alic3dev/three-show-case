import type { PolyHavenTextureResult } from '@/utils/polyHavenLoader'

import type * as THREE from 'three'

export type BuildingTextureTypes =
  | 'path'
  | 'brickWall'
  | 'cityCenterPath'
  | 'cityCenterWall'
  | 'misc'

export const buildingTextures: Record<BuildingTextureTypes, string[]> = {
  path: ['large_sandstone_blocks', 'rough_concrete'],
  brickWall: ['dark_brick_wall', 'church_bricks_03'],

  cityCenterPath: ['large_sandstone_blocks', 'rough_concrete'],
  cityCenterWall: [
    'marble_01',
    'large_sandstone_blocks',
    'concrete_wall_004',
    'concrete_panels',
  ],
  misc: [],
}

export function buildingTextureAmbientLookup(
  textureName: string,
): 'arm' | 'rough' {
  switch (textureName) {
    case 'large_sandstone_blocks':
    case 'rough_concrete':
    case 'concrete_panels':
      return 'arm'
    default:
      return 'rough'
  }
}

export const materialCache: Record<
  BuildingTextureTypes,
  Record<string, THREE.MeshPhongMaterial>
> = {
  brickWall: {},
  path: {},
  cityCenterWall: {},
  cityCenterPath: {},
  misc: {},
}

export const geometryCache: Record<string, THREE.BufferGeometry> = {}

type CacheGenerateFunction<T> = () => T
type CacheLookup<T> = Record<string, T | undefined>
type GeometryCache = CacheLookup<THREE.BufferGeometry>
type MaterialCache = CacheLookup<THREE.Material>
type PolyHavenCache = CacheLookup<PolyHavenTextureResult>
type TextureCache = CacheLookup<THREE.Texture>
type DisposableCache = GeometryCache | MaterialCache | TextureCache

export class CacheManager {
  geometryCache: GeometryCache = {}
  materialCache: MaterialCache = {}
  polyHavenTextureCache: PolyHavenCache = {}
  textureCache: TextureCache = {}

  private getFromCache<T>(
    cache: CacheLookup<T>,
    name: string,
    generate: CacheGenerateFunction<T>,
  ): T {
    let result: T | undefined = cache[name]

    if (!result) {
      cache[name] = generate()

      result = cache[name]
    }

    return result
  }

  getGeometry(
    name: string,
    generate: CacheGenerateFunction<THREE.BufferGeometry>,
  ): THREE.BufferGeometry {
    return this.getFromCache<THREE.BufferGeometry>(
      this.geometryCache,
      name,
      generate,
    )
  }

  getMaterial(
    name: string,
    generate: CacheGenerateFunction<THREE.Material>,
  ): THREE.Material {
    return this.getFromCache<THREE.Material>(this.materialCache, name, generate)
  }

  getTexture(
    name: string,
    generate: CacheGenerateFunction<THREE.Texture>,
  ): THREE.Texture {
    return this.getFromCache<THREE.Texture>(this.textureCache, name, generate)
  }

  getPolyHavenTexture(
    name: string,
    generate: CacheGenerateFunction<PolyHavenTextureResult>,
  ): PolyHavenTextureResult {
    return this.getFromCache<PolyHavenTextureResult>(
      this.polyHavenTextureCache,
      name,
      generate,
    )
  }

  private disposeCache(cache: DisposableCache): void {
    for (const key in cache) {
      cache[key]?.dispose()
      delete cache[key]
    }
  }

  disposeGeometryCache(): void {
    this.disposeCache(this.geometryCache)
  }

  disposeMaterialCache(): void {
    this.disposeCache(this.materialCache)
  }

  disposePolyHavenTextureCache(): void {
    for (const key in this.polyHavenTextureCache) {
      for (const texture in this.polyHavenTextureCache[key]) {
        this.polyHavenTextureCache[key][
          texture as keyof PolyHavenTextureResult
        ].dispose()
      }

      delete this.polyHavenTextureCache[key]
    }
  }

  disposeTextureCache(): void {
    this.disposeCache(this.textureCache)
  }

  dispose(): void {
    this.disposeGeometryCache()
    this.disposeMaterialCache()
    this.disposePolyHavenTextureCache()
    this.disposeTextureCache()
  }
}

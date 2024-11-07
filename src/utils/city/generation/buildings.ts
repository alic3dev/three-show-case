import type { BuildingTextureTypes } from '@/utils/CacheManager'
import type { PolyHavenTextureResult } from '@/utils/polyHavenLoader'

import type {
  DistrictLookup,
  ResolutionsLookup,
  SharedSizesInterface,
} from '@/utils/city/types'

import * as THREE from 'three'

import {
  buildingTextures,
  geometryCache,
  materialCache,
} from '@/utils/CacheManager'
import { loadPolyHavenTexture } from '@/utils/polyHavenLoader'

interface BuildingMeta {
  position: THREE.Vector2
  size: THREE.Vector3
}

export async function generateBuildings({
  roadLayout,
  districts,
  resolutions,
  numberOfBuildings = 600,
  scale = 20,
  // sizes,
  incrementLoadState = (): void => {},
}: {
  roadLayout: THREE.Vector2[]
  districts: DistrictLookup
  resolutions: ResolutionsLookup
  numberOfBuildings?: number
  scale?: number
  sizes: SharedSizesInterface
  incrementLoadState?: () => void
}): Promise<THREE.Group> {
  const buildings: THREE.Group = new THREE.Group()

  const buildingsMeta: BuildingMeta[] = []

  const texturesLoaded: Record<string, boolean> = {}

  let failSafeCounter: number = 0
  const failSafeCounterMax: number = 100000
  for (let i: number = 0; i < numberOfBuildings; i++, failSafeCounter++) {
    const buildingDirection: THREE.Vector2 = new THREE.Vector2(0, 0)

    if (Math.random() > 0.5) {
      buildingDirection.setX(Math.random() > 0.5 ? 1 : -1)
    } else {
      buildingDirection.setY(Math.random() > 0.5 ? 1 : -1)
    }

    const randomRoad: THREE.Vector2 =
      roadLayout[Math.floor(Math.random() * roadLayout.length)].clone()

    const buildingPosition: THREE.Vector2 = randomRoad
      .clone()
      .add(buildingDirection)

    if (
      roadLayout.find(
        (road: THREE.Vector2): boolean =>
          road.x === buildingPosition.x && road.y === buildingPosition.y,
      ) ||
      buildingsMeta.find(
        (building: BuildingMeta): boolean =>
          building.position.x === buildingPosition.x &&
          building.position.y === buildingPosition.y,
      )
    ) {
      if (failSafeCounter >= failSafeCounterMax) {
        break
      }

      i--
      continue
    }

    failSafeCounter = 0

    const isInCityCenter: boolean =
      districts.cityCenter.contains(buildingPosition)

    const heightAddRange: number = isInCityCenter ? 6 : 2
    const minHeight: number = isInCityCenter ? 3 : 1

    const buildingSize: THREE.Vector3 = new THREE.Vector3(
      Math.floor(Math.random() * 6 + 5) / 10,
      Math.floor(Math.random() * heightAddRange) + minHeight,
      Math.floor(Math.random() * 6 + 5) / 10,
    )

    const buildingOffset: THREE.Vector2 = new THREE.Vector2(0.5, 0.5)

    const alignedToRoad: boolean = Math.random() > 0.4

    if (buildingDirection.x > 0 && buildingSize.x < 1) {
      const tmpOffset: number = buildingSize.x / 2

      if (alignedToRoad) {
        buildingOffset.setX(tmpOffset)
      } else {
        buildingOffset.setX(tmpOffset + Math.random() * (1 - buildingSize.x))
      }
    } else if (buildingDirection.x < 0 && buildingSize.x < 1) {
      const tmpOffset: number = 1 - buildingSize.x / 2

      if (alignedToRoad) {
        buildingOffset.setX(tmpOffset)
      } else {
        buildingOffset.setX(tmpOffset - Math.random() * (1 - buildingSize.x))
      }
    } else if (buildingDirection.y > 0 && buildingSize.z < 1) {
      const tmpOffset: number = buildingSize.z / 2

      if (alignedToRoad) {
        buildingOffset.setY(tmpOffset)
      } else {
        buildingOffset.setY(tmpOffset + Math.random() * (1 - buildingSize.z))
      }
    } else if (buildingDirection.y < 0 && buildingSize.z < 1) {
      const tmpOffset: number = 1 - buildingSize.z / 2

      if (alignedToRoad) {
        buildingOffset.setY(tmpOffset)
      } else {
        buildingOffset.setY(tmpOffset - Math.random() * (1 - buildingSize.z))
      }
    }

    buildingsMeta.push({
      position: buildingPosition,
      size: buildingSize,
    })

    const repeats: THREE.Vector2 = new THREE.Vector2(
      buildingSize.x * 10,
      buildingSize.y * 10,
    )

    const buildingWallType: BuildingTextureTypes = isInCityCenter
      ? 'cityCenterWall'
      : 'brickWall'

    const randomWallTextureName: string =
      buildingTextures[buildingWallType][
        Math.floor(Math.random() * buildingTextures[buildingWallType].length)
      ]

    const cacheKey: string = JSON.stringify({
      randomWallTextureName,
    })

    let buildingMaterial: THREE.MeshPhongMaterial | undefined =
      materialCache[buildingWallType][cacheKey]

    if (!buildingMaterial) {
      const wallTextures: PolyHavenTextureResult = loadPolyHavenTexture({
        name: randomWallTextureName,
        res: resolutions.TEXTURE,
        repeats,
        incrementLoadState,
      })

      materialCache[buildingWallType][cacheKey] = new THREE.MeshPhongMaterial({
        ...wallTextures,
      })

      buildingMaterial = materialCache[buildingWallType][cacheKey]

      texturesLoaded[randomWallTextureName] = true
    } else if (!texturesLoaded[randomWallTextureName]) {
      texturesLoaded[randomWallTextureName] = true
      incrementLoadState()
    }

    const geometryCacheKey: string = JSON.stringify(buildingSize)

    let buildingGeometry: THREE.BufferGeometry | undefined =
      geometryCache[geometryCacheKey]

    if (!buildingGeometry) {
      geometryCache[geometryCacheKey] = new THREE.BoxGeometry(
        buildingSize.x,
        buildingSize.y,
        buildingSize.z,
      )

      buildingGeometry = geometryCache[geometryCacheKey]
    }

    const buildingMesh: THREE.Mesh = new THREE.Mesh(
      buildingGeometry,
      buildingMaterial,
    )

    buildingMesh.scale.set(scale, scale, scale)

    buildingMesh.position.set(
      (buildingOffset.x + buildingPosition.x) * scale,
      (buildingSize.y / 2) * scale,
      (buildingOffset.y + buildingPosition.y) * scale,
    )

    buildingMesh.castShadow = true
    buildingMesh.receiveShadow = true

    if (buildingSize.x !== 1 || buildingSize.z !== 1) {
      const buildingPathSize: THREE.Vector3 = new THREE.Vector3(1, 0.005, 1)
      const buildingPathGeometryCacheKey: string =
        JSON.stringify(buildingPathSize)

      let buildingPathGeometry: THREE.BufferGeometry | undefined =
        geometryCache[buildingPathGeometryCacheKey]

      if (!buildingPathGeometry) {
        geometryCache[buildingPathGeometryCacheKey] = new THREE.BoxGeometry(
          buildingPathSize.x,
          buildingPathSize.y,
          buildingPathSize.z,
        )

        buildingPathGeometry = geometryCache[buildingPathGeometryCacheKey]
      }

      const buildingPathType: BuildingTextureTypes = isInCityCenter
        ? 'cityCenterPath'
        : 'path'

      const randomPathTextureName: string =
        buildingTextures[buildingPathType][
          Math.floor(Math.random() * buildingTextures[buildingPathType].length)
        ]

      const buildingPathMaterialCacheKey: string = JSON.stringify({
        randomPathTextureName,
      })

      let buildingPathMaterial: THREE.MeshPhongMaterial | undefined =
        materialCache[buildingPathType][buildingPathMaterialCacheKey]

      if (!buildingPathMaterial) {
        const pathTextures: PolyHavenTextureResult = loadPolyHavenTexture({
          name: randomPathTextureName,
          res: resolutions.TEXTURE,
          repeats,
          incrementLoadState,
        })

        materialCache[buildingPathType][buildingPathMaterialCacheKey] =
          new THREE.MeshPhongMaterial({
            ...pathTextures,
          })

        buildingPathMaterial =
          materialCache[buildingPathType][buildingPathMaterialCacheKey]

        texturesLoaded[randomPathTextureName] = true
      } else if (!texturesLoaded[randomPathTextureName]) {
        texturesLoaded[randomPathTextureName] = true
        incrementLoadState()
      }

      const buildingPathMesh: THREE.Mesh = new THREE.Mesh(
        buildingPathGeometry,
        buildingPathMaterial,
      )

      buildingPathMesh.scale.set(scale, scale, scale)

      buildingPathMesh.position.set(
        (buildingPosition.x + buildingPathSize.x / 2) * scale,
        (buildingPathSize.y / 2) * scale,
        (buildingPosition.y + buildingPathSize.z / 2) * scale,
      )

      buildingPathMesh.castShadow = true
      buildingPathMesh.receiveShadow = true

      buildings.add(buildingPathMesh)
    }

    buildings.add(buildingMesh)
  }

  return buildings
}

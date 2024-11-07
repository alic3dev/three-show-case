import {
  City,
  CityOptions,
  DistrictLookup,
  ResolutionsLookup,
  SharedSizesInterface,
} from '@/utils/city/types'

import type {
  DistrictDebugObjectsInterface,
  DistrictName,
} from '@/utils/city/District'

import * as THREE from 'three'

import {
  generateBuildings,
  generateDistricts,
  generateGrid,
  generatePaths,
  generateRoadsAndSidewalk,
  generateRoadLayout,
} from '@/utils/city/generation'

export const defaultResolutions: ResolutionsLookup = {
  TEXTURE: '1k',
  GLTF: '1k',
  HDR: '4k',
}

export const defaultCityOptions: CityOptions = {
  roadSpacing: new THREE.Vector2(8, 1),
  roadTiles: 500,

  numberOfBuildings: 500,

  scale: 20,
  // scale: 0.1,

  addGLTFModels: true,

  resolutions: { ...defaultResolutions },
}

export async function generateCity({
  options = {},
  incrementLoadState,
}: {
  options?: Partial<CityOptions>
  incrementLoadState: () => void
}): Promise<City> {
  const {
    addGLTFModels,
    numberOfBuildings,
    resolutions,
    roadSpacing,
    roadTiles,
    scale,
  }: CityOptions = {
    ...defaultCityOptions,
    ...options,
  }

  const roadLayout: THREE.Vector2[] = await generateRoadLayout({
    roadSpacing,
    roadTiles,
  })

  const roadMin: THREE.Vector2 = new THREE.Vector2(0, 0)
  const roadMax: THREE.Vector2 = new THREE.Vector2(0, 0)

  for (const road of roadLayout) {
    if (roadMax.x < road.x) roadMax.setX(road.x)
    if (roadMin.x > road.x) roadMin.setX(road.x)
    if (roadMax.y < road.y) roadMax.setY(road.y)
    if (roadMin.y > road.y) roadMin.setY(road.y)
  }

  const groundExtraSpacing: number = 18

  const roadSize: THREE.Vector2 = new THREE.Vector2(
    roadMax.x - roadMin.x + 1,
    roadMax.y - roadMin.y + 1,
  )

  const sizes: SharedSizesInterface = {
    roadMin,
    roadMax,
    roadSize,
    groundSize: new THREE.Vector2(
      (groundExtraSpacing + roadSize.x) * scale,
      (groundExtraSpacing + roadSize.y) * scale,
    ),
    groundExtraSpacing,
    sidewalkHeight: 0.005,
  }

  const districts: DistrictLookup = await generateDistricts({
    roadLayout,
    sizes,
    scale,
  })

  const roadsAndSidewalksGroup: THREE.Group = await generateRoadsAndSidewalk({
    roadLayout,
    sizes,
    resolutions,
    scale,
    addGLTFModels,
    incrementLoadState,
  })

  const buildings: THREE.Group = await generateBuildings({
    roadLayout,
    districts,
    resolutions,
    scale,
    sizes,
    numberOfBuildings,
    incrementLoadState,
  })

  const paths: THREE.Group = await generatePaths({
    incrementLoadState,
  })

  const grid: THREE.GridHelper = generateGrid({ scale, sizes })

  const objects: THREE.Group = new THREE.Group()
  objects.add(
    districts.cityCenter.debugObjects.line,
    districts.cityCenter.debugObjects.sphere,
  )
  objects.add(roadsAndSidewalksGroup)
  objects.add(buildings)
  objects.add(paths)
  objects.add(grid)

  objects.position.set(-(1 - 0.075) * scale, 0, -(1 - 0.075) * scale)

  objects.castShadow = true
  objects.receiveShadow = true

  incrementLoadState()

  return {
    objects,

    toggleDistrictDebugDisplay: (): void => {
      for (const name in districts) {
        const district = districts[name as DistrictName]

        for (const objectName in district.debugObjects) {
          district.debugObjects[
            objectName as keyof DistrictDebugObjectsInterface
          ].visible =
            !district.debugObjects[
              objectName as keyof DistrictDebugObjectsInterface
            ].visible
        }
      }
    },

    dispose: (): void => {
      // TODO: This seems a bit.. Hacky
      const recursiveDispose = (object: THREE.Object3D): void => {
        if (Object.prototype.hasOwnProperty.call(object, 'geometry')) {
          if (
            Object.prototype.hasOwnProperty.call(
              (object as THREE.Mesh).geometry,
              'dispose',
            )
          ) {
            // eslint-disable-next-line no-extra-semi
            ;((object as THREE.Mesh).geometry as THREE.BufferGeometry).dispose()
          }
        }

        if (Object.prototype.hasOwnProperty.call(object, 'traverse')) {
          object.traverse(recursiveDispose)
        }

        if (Object.prototype.hasOwnProperty.call(object, 'dispose')) {
          // eslint-disable-next-line no-extra-semi
          ;(object as THREE.Light).dispose()
        }
      }
      objects.traverse(recursiveDispose)
    },
  }
}

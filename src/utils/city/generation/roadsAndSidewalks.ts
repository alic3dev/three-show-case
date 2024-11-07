import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'

import type { PolyHavenTextureResult } from '@/utils/polyHavenLoader'

import type {
  ResolutionsLookup,
  ResolutionType,
  SharedSizesInterface,
} from '@/utils/city/types'

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

import { materialCache } from '@/utils/CacheManager'
import { loadPolyHavenTexture } from '@/utils/polyHavenLoader'
import { resolveAsset } from '@/utils/resolveAsset'

type GLTFModelName = 'street_lamp_01' | 'metal_trash_can'

interface HasRoadsInterface {
  above: boolean
  below: boolean
  toLeft: boolean
  toRight: boolean
}

type TrashCanLidPosition = 'top' | 'side' | 'ground'

interface TrashCanPositions {
  top: boolean
  topLeft: boolean
  topRight: boolean
  bottom: boolean
  bottomLeft: boolean
  bottomRight: boolean
  left: boolean
  right: boolean
}

const gltfModelCache: Record<GLTFModelName, GLTF | undefined> = {
  street_lamp_01: undefined,
  metal_trash_can: undefined,
}

async function getGLTFModel({
  name,
  resolution,
}: {
  name: GLTFModelName
  resolution: ResolutionType
}): Promise<GLTF> {
  if (gltfModelCache[name]) {
    return gltfModelCache[name]
  }

  gltfModelCache[name] = await new GLTFLoader().loadAsync(
    resolveAsset(
      `models/${name}_${resolution}.gltf/${name}_${resolution}.gltf`,
    ),
  )

  return gltfModelCache[name]
}

const polyHavenTextureCache: Record<string, PolyHavenTextureResult> = {}

export async function generateRoadsAndSidewalk({
  roadLayout,
  sizes,
  resolutions,
  scale = 20,
  addGLTFModels = true,
  incrementLoadState = () => {},
}: {
  roadLayout: THREE.Vector2[]
  sizes: SharedSizesInterface
  resolutions: ResolutionsLookup
  scale?: number
  addGLTFModels?: boolean
  incrementLoadState?: () => void
}): Promise<THREE.Group> {
  const roadsAndSidewalksGroup: THREE.Group = new THREE.Group()

  const groundGeo: THREE.PlaneGeometry = new THREE.PlaneGeometry(
    sizes.groundSize.x,
    sizes.groundSize.y,
  )

  const groundTextureRepeats: THREE.Vector2 = new THREE.Vector2(
    (sizes.groundSize.x / scale) * 6,
    (sizes.groundSize.y / scale) * 6,
  )

  const groundMaterialCacheKey: string = `brown_mud_leaves_01_${resolutions.TEXTURE}`
  const groundTextureCacheKey: string = groundMaterialCacheKey

  let groundMat: THREE.MeshPhongMaterial | undefined =
    materialCache.misc[groundMaterialCacheKey]

  if (groundMat) {
    const groundTextures: PolyHavenTextureResult | undefined =
      polyHavenTextureCache[groundTextureCacheKey]

    if (groundTextures) {
      for (const textureType in groundTextures) {
        groundTextures[textureType as keyof PolyHavenTextureResult].repeat.set(
          groundTextureRepeats.x,
          groundTextureRepeats.y,
        )
      }

      groundMat.dispose()

      materialCache.misc[groundMaterialCacheKey] = new THREE.MeshPhongMaterial({
        ...groundTextures,
      })

      groundMat = materialCache.misc[groundMaterialCacheKey]
    }

    incrementLoadState()
  } else {
    const groundTextures: PolyHavenTextureResult = loadPolyHavenTexture({
      name: 'brown_mud_leaves_01',
      res: resolutions.TEXTURE,
      ambient: 'arm',
      repeats: groundTextureRepeats,

      incrementLoadState,
    })

    polyHavenTextureCache[groundTextureCacheKey] = groundTextures
    materialCache.misc[groundMaterialCacheKey] = new THREE.MeshPhongMaterial({
      ...groundTextures,
    })

    groundMat = materialCache.misc[groundMaterialCacheKey]
  }

  const groundMesh: THREE.Mesh = new THREE.Mesh(groundGeo, groundMat)
  groundMesh.rotateX(THREE.MathUtils.degToRad(-90))
  groundMesh.position.set(
    ((1 + sizes.roadMax.x + sizes.roadMin.x) * scale) / 2,
    0,
    ((1 + sizes.roadMax.y + sizes.roadMin.y) * scale) / 2,
  )
  groundMesh.receiveShadow = true
  roadsAndSidewalksGroup.add(groundMesh)

  const roadPoints: THREE.Vector3[] = []
  const sidewalkPoints: THREE.Vector3[] = []

  const roadWidth: number = 0.85
  const roadWidthInScale: number = roadWidth * scale
  const sidewalkSize = new THREE.Vector2(
    1 - roadWidth,
    sizes.sidewalkHeight * scale,
  )
  // TODO: Add sidewalk divets
  // const sidewalkDivetSize: number = sidewalkSize.y

  const streetLampGLTF: GLTF = await getGLTFModel({
    name: 'street_lamp_01',
    resolution: resolutions.GLTF,
  })
  const metalTrashCanGLTF: GLTF = await getGLTFModel({
    name: 'metal_trash_can',
    resolution: resolutions.GLTF,
  })

  const streetLampScale: number = 0.05 * scale

  let shouldDisplayStreetLamp: boolean = false
  function addStreetLamp(position: THREE.Vector2): void {
    if (!shouldDisplayStreetLamp || !addGLTFModels) {
      return
    }

    function _addStreetLamp(position: THREE.Vector2): void {
      const child = streetLampGLTF.scene.children[0].clone()

      child.traverse((subChild) => {
        subChild.scale.set(streetLampScale, streetLampScale, streetLampScale)

        subChild.position.set(position.x, sidewalkSize.y, position.y)
      })

      roadsAndSidewalksGroup.add(...child.children)
    }

    return _addStreetLamp(position)
  }

  function addTrashCan(
    position: THREE.Vector2,
    rust?: boolean,
    hasLid?: boolean,
    lidPosition?: TrashCanLidPosition,
  ): void {
    if (!addGLTFModels) {
      return
    }

    if (typeof rust === 'undefined') {
      rust = Math.random() > 0.7
    }

    if (typeof hasLid === 'undefined') {
      hasLid = Math.random() > 0.3
    }

    if (typeof lidPosition === 'undefined') {
      lidPosition =
        Math.random() > 0.5 ? 'top' : Math.random() > 0.3 ? 'side' : 'ground'
    }

    const children: THREE.Object3D[] = metalTrashCanGLTF.scene.children
      .filter((child: THREE.Object3D): boolean => {
        if (!hasLid && child.name.endsWith('lid')) {
          return false
        }

        const childIsRusted: boolean = child.name.includes('rust')

        return rust ? childIsRusted : !childIsRusted
      })
      .map((child: THREE.Object3D): THREE.Object3D => {
        const clonedChild = child.clone()

        if (clonedChild.name.endsWith('lid')) {
          if (lidPosition === 'top') {
            if (rust) {
              clonedChild.position.setX(-0.5)
              clonedChild.position.setY(0.93)
              clonedChild.rotateZ(THREE.MathUtils.degToRad(-77))
            } else {
              clonedChild.position.setX(0.5)
              clonedChild.position.setY(0.91)
              clonedChild.rotateZ(THREE.MathUtils.degToRad(-75))
            }
          } else if (lidPosition === 'side') {
            /* Default State */
          } else if (lidPosition === 'ground') {
            if (rust) {
              clonedChild.position.setX(Math.random() * 0.15 + 0.1)
            } else {
              clonedChild.position.setX(Math.random() * -0.15 - 0.1)
            }

            if (Math.random() > 0.5) {
              clonedChild.position.setY(0.035)
              clonedChild.rotateZ(THREE.MathUtils.degToRad(-75))
            } else {
              clonedChild.position.setY(0.09)
              clonedChild.rotateZ(THREE.MathUtils.degToRad(85))
            }

            clonedChild.rotateY(THREE.MathUtils.degToRad(Math.random() * 360))
          }
        }

        clonedChild.castShadow = true
        clonedChild.receiveShadow = true

        return clonedChild
      })

    const trashCanGroup: THREE.Group = new THREE.Group()
    trashCanGroup.add(...children)

    trashCanGroup.scale.set(streetLampScale, streetLampScale, streetLampScale)

    trashCanGroup.rotateY(THREE.MathUtils.degToRad(Math.random() * 360))

    if (rust) {
      trashCanGroup.position.set(
        position.x + 0.05 * scale,
        sidewalkSize.y,
        position.y,
      )
    } else {
      trashCanGroup.position.set(position.x, sidewalkSize.y, position.y)
    }

    roadsAndSidewalksGroup.add(trashCanGroup)
  }

  const streetLampSize: number = (sidewalkSize.x / 8) * scale

  for (const road of roadLayout) {
    const hasRoads: HasRoadsInterface = {
      above: false,
      below: false,
      toLeft: false,
      toRight: false,
    }

    for (const roadTwo of roadLayout) {
      if (roadTwo.x === road.x) {
        if (roadTwo.y - 1 === road.y) {
          hasRoads.above = true
        } else if (roadTwo.y + 1 === road.y) {
          hasRoads.below = true
        }
      } else if (roadTwo.y === road.y) {
        if (roadTwo.x - 1 === road.x) {
          hasRoads.toRight = true
        } else if (roadTwo.x + 1 === road.x) {
          hasRoads.toLeft = true
        }
      }
    }

    shouldDisplayStreetLamp = road.x % 2 !== road.y % 2

    const roadPointMid: THREE.Vector2 = new THREE.Vector2(
      (road.x + 0.5) * scale,
      (road.y + 0.5) * scale,
    )

    const shouldGenerateTrashCan: TrashCanPositions = {
      top: false,
      topLeft: false,
      topRight: false,
      bottom: false,
      bottomLeft: false,
      bottomRight: false,
      left: false,
      right: false,
    }

    if (Math.random() > 0.6) {
      const possiblePositions: (keyof TrashCanPositions)[] = Object.keys(
        shouldGenerateTrashCan,
      ) as (keyof TrashCanPositions)[]

      shouldGenerateTrashCan[
        possiblePositions[Math.floor(Math.random() * possiblePositions.length)]
      ] = true
    }

    if (shouldGenerateTrashCan.right && hasRoads.toRight) {
      shouldGenerateTrashCan.right = false

      if (Math.random() > 0.5) {
        shouldGenerateTrashCan.topRight = true
      } else {
        shouldGenerateTrashCan.bottomRight = true
      }
    }

    if (shouldGenerateTrashCan.left && hasRoads.toLeft) {
      shouldGenerateTrashCan.left = false

      if (Math.random() > 0.5) {
        shouldGenerateTrashCan.topLeft = true
      } else {
        shouldGenerateTrashCan.bottomLeft = true
      }
    }

    if (hasRoads.above) {
      const roadPointMax = new THREE.Vector2(
        (road.x + (hasRoads.toRight ? 1 : roadWidth)) * scale,
        (road.y + 1) * scale,
      )

      const roadPointMinX: number =
        (road.x + (hasRoads.toLeft ? 0 : 1 - roadWidth)) * scale

      roadPoints.push(
        // Right Upper
        new THREE.Vector3(roadPointMid.x, 0, roadPointMid.y),
        new THREE.Vector3(roadPointMax.x, 0, roadPointMid.y),
        new THREE.Vector3(roadPointMax.x, 0, roadPointMax.y),

        new THREE.Vector3(roadPointMax.x, 0, roadPointMax.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMax.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMid.y),

        // Left Upper
        new THREE.Vector3(roadPointMid.x, 0, roadPointMid.y),
        new THREE.Vector3(roadPointMinX, 0, roadPointMid.y),
        new THREE.Vector3(roadPointMinX, 0, roadPointMax.y),

        new THREE.Vector3(roadPointMinX, 0, roadPointMax.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMax.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMid.y),
      )

      if (shouldGenerateTrashCan.top) {
        shouldGenerateTrashCan.top = false

        if (Math.random() > 0.5) {
          shouldGenerateTrashCan.topRight = true
        } else {
          shouldGenerateTrashCan.topLeft = true
        }
      }

      if (hasRoads.toRight) {
        // TODO: Curve

        const sidewalkPointMin = new THREE.Vector2(
          (road.x + 1 - sidewalkSize.x) * scale,
          (road.y + 1 - sidewalkSize.x) * scale,
        )

        if (shouldGenerateTrashCan.topRight) {
          addTrashCan(
            new THREE.Vector2(
              (roadPointMax.x + sidewalkPointMin.x) / 2 - 0.01 * scale,
              roadPointMax.y,
            ),
          )
        }

        sidewalkPoints.push(
          // Right Top
          new THREE.Vector3(sidewalkPointMin.x, sidewalkSize.y, roadPointMax.y),
          new THREE.Vector3(roadPointMax.x, sidewalkSize.y, roadPointMax.y),
          new THREE.Vector3(roadPointMax.x, sidewalkSize.y, sidewalkPointMin.y),

          new THREE.Vector3(roadPointMax.x, sidewalkSize.y, sidewalkPointMin.y),
          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),
          new THREE.Vector3(sidewalkPointMin.x, sidewalkSize.y, roadPointMax.y),

          // // Right Top - Back Side
          new THREE.Vector3(roadPointMax.x, 0, sidewalkPointMin.y),
          new THREE.Vector3(sidewalkPointMin.x, 0, sidewalkPointMin.y),
          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),

          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),
          new THREE.Vector3(roadPointMax.x, sidewalkSize.y, sidewalkPointMin.y),
          new THREE.Vector3(roadPointMax.x, 0, sidewalkPointMin.y),

          // // Right Top - Left Side
          new THREE.Vector3(sidewalkPointMin.x, 0, roadPointMax.y),
          new THREE.Vector3(sidewalkPointMin.x, 0, sidewalkPointMin.y),
          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),

          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),
          new THREE.Vector3(sidewalkPointMin.x, sidewalkSize.y, roadPointMax.y),
          new THREE.Vector3(sidewalkPointMin.x, 0, roadPointMax.y),
        )
      }

      if (hasRoads.toLeft) {
        // TODO: Curve

        const sidewalkPointMin: THREE.Vector2 = new THREE.Vector2(
          (road.x + sidewalkSize.x) * scale,
          (road.y + 1 - sidewalkSize.x) * scale,
        )

        if (shouldGenerateTrashCan.topLeft) {
          addTrashCan(
            new THREE.Vector2(
              roadPointMinX +
                (Math.random() * sidewalkSize.x * scale) / 2 +
                0.01 * scale,
              roadPointMax.y,
            ),
          )
        }

        sidewalkPoints.push(
          // Left Top
          new THREE.Vector3(sidewalkPointMin.x, sidewalkSize.y, roadPointMax.y),
          new THREE.Vector3(roadPointMinX, sidewalkSize.y, roadPointMax.y),
          new THREE.Vector3(roadPointMinX, sidewalkSize.y, sidewalkPointMin.y),

          new THREE.Vector3(roadPointMinX, sidewalkSize.y, sidewalkPointMin.y),
          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),
          new THREE.Vector3(sidewalkPointMin.x, sidewalkSize.y, roadPointMax.y),

          // // // Left Top - Back Side
          new THREE.Vector3(roadPointMinX, 0, sidewalkPointMin.y),
          new THREE.Vector3(sidewalkPointMin.x, 0, sidewalkPointMin.y),
          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),

          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),
          new THREE.Vector3(roadPointMinX, sidewalkSize.y, sidewalkPointMin.y),
          new THREE.Vector3(roadPointMinX, 0, sidewalkPointMin.y),

          // // // Left Top - Right Side
          new THREE.Vector3(sidewalkPointMin.x, 0, roadPointMax.y),
          new THREE.Vector3(sidewalkPointMin.x, 0, sidewalkPointMin.y),
          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),

          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),
          new THREE.Vector3(sidewalkPointMin.x, sidewalkSize.y, roadPointMax.y),
          new THREE.Vector3(sidewalkPointMin.x, 0, roadPointMax.y),
        )
      }
    } else {
      const roadPointMax = new THREE.Vector2(
        (road.x + (hasRoads.toRight ? 1 : roadWidth)) * scale,
        (road.y + roadWidth) * scale,
      )

      const roadPointMinX: number =
        (road.x + (hasRoads.toLeft ? 0 : 1 - roadWidth)) * scale

      if (
        shouldGenerateTrashCan.top ||
        shouldGenerateTrashCan.topLeft ||
        shouldGenerateTrashCan.topRight
      ) {
        addTrashCan(
          new THREE.Vector2(
            Math.random() * roadWidthInScale + roadPointMinX,
            roadPointMax.y + (sidewalkSize.x * scale) / 2 + 0.01 * scale,
          ),
        )
      }

      roadPoints.push(
        // Right Upper
        new THREE.Vector3(roadPointMid.x, 0, roadPointMid.y),
        new THREE.Vector3(roadPointMax.x, 0, roadPointMid.y),
        new THREE.Vector3(roadPointMax.x, 0, roadPointMax.y),

        new THREE.Vector3(roadPointMax.x, 0, roadPointMax.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMax.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMid.y),

        // Left Upper
        new THREE.Vector3(roadPointMid.x, 0, roadPointMid.y),
        new THREE.Vector3(roadPointMinX, 0, roadPointMid.y),
        new THREE.Vector3(roadPointMinX, 0, roadPointMax.y),

        new THREE.Vector3(roadPointMinX, 0, roadPointMax.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMax.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMid.y),
      )

      const sidewalkPointMaxY: number = (road.y + 1) * scale

      addStreetLamp(
        new THREE.Vector2(roadPointMid.x, roadPointMax.y + streetLampSize),
      )

      sidewalkPoints.push(
        // Right Lower
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, roadPointMax.y),
        new THREE.Vector3(roadPointMinX, sidewalkSize.y, roadPointMax.y),
        new THREE.Vector3(roadPointMinX, sidewalkSize.y, sidewalkPointMaxY),

        new THREE.Vector3(roadPointMinX, sidewalkSize.y, sidewalkPointMaxY),
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, sidewalkPointMaxY),
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, roadPointMax.y),

        // Left Lower
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, roadPointMax.y),
        new THREE.Vector3(roadPointMax.x, sidewalkSize.y, roadPointMax.y),
        new THREE.Vector3(roadPointMax.x, sidewalkSize.y, sidewalkPointMaxY),

        new THREE.Vector3(roadPointMax.x, sidewalkSize.y, sidewalkPointMaxY),
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, sidewalkPointMaxY),
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, roadPointMax.y),

        // Right Lower - Front Side
        new THREE.Vector3(roadPointMid.x, 0, roadPointMax.y),
        new THREE.Vector3(roadPointMinX, 0, roadPointMax.y),
        new THREE.Vector3(roadPointMinX, sidewalkSize.y, roadPointMax.y),

        new THREE.Vector3(roadPointMinX, sidewalkSize.y, roadPointMax.y),
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, roadPointMax.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMax.y),

        // Left Lower - Front Side
        new THREE.Vector3(roadPointMid.x, 0, roadPointMax.y),
        new THREE.Vector3(roadPointMax.x, 0, roadPointMax.y),
        new THREE.Vector3(roadPointMax.x, sidewalkSize.y, roadPointMax.y),

        new THREE.Vector3(roadPointMax.x, sidewalkSize.y, roadPointMax.y),
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, roadPointMax.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMax.y),

        // Right Lower - Back Side
        new THREE.Vector3(roadPointMid.x, 0, sidewalkPointMaxY),
        new THREE.Vector3(roadPointMinX, 0, sidewalkPointMaxY),
        new THREE.Vector3(roadPointMinX, sidewalkSize.y, sidewalkPointMaxY),

        new THREE.Vector3(roadPointMinX, sidewalkSize.y, sidewalkPointMaxY),
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, sidewalkPointMaxY),
        new THREE.Vector3(roadPointMid.x, 0, sidewalkPointMaxY),

        // Left Lower - Back Side
        new THREE.Vector3(roadPointMid.x, 0, sidewalkPointMaxY),
        new THREE.Vector3(roadPointMax.x, 0, sidewalkPointMaxY),
        new THREE.Vector3(roadPointMax.x, sidewalkSize.y, sidewalkPointMaxY),

        new THREE.Vector3(roadPointMax.x, sidewalkSize.y, sidewalkPointMaxY),
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, sidewalkPointMaxY),
        new THREE.Vector3(roadPointMid.x, 0, sidewalkPointMaxY),

        // Right Side
        new THREE.Vector3(roadPointMax.x, 0, roadPointMax.y),
        new THREE.Vector3(roadPointMax.x, 0, sidewalkPointMaxY),
        new THREE.Vector3(roadPointMax.x, sidewalkSize.y, sidewalkPointMaxY),

        new THREE.Vector3(roadPointMax.x, sidewalkSize.y, sidewalkPointMaxY),
        new THREE.Vector3(roadPointMax.x, sidewalkSize.y, roadPointMax.y),
        new THREE.Vector3(roadPointMax.x, 0, roadPointMax.y),

        // Left Side
        new THREE.Vector3(roadPointMinX, 0, roadPointMax.y),
        new THREE.Vector3(roadPointMinX, 0, sidewalkPointMaxY),
        new THREE.Vector3(roadPointMinX, sidewalkSize.y, sidewalkPointMaxY),

        new THREE.Vector3(roadPointMinX, sidewalkSize.y, sidewalkPointMaxY),
        new THREE.Vector3(roadPointMinX, sidewalkSize.y, roadPointMax.y),
        new THREE.Vector3(roadPointMinX, 0, roadPointMax.y),
      )
    }

    if (hasRoads.below) {
      const roadPointMin: THREE.Vector2 = new THREE.Vector2(
        (road.x + (hasRoads.toLeft ? 0 : 1 - roadWidth)) * scale,
        road.y * scale,
      )

      const roadPointMaxX: number =
        (road.x + (hasRoads.toRight ? 1 : roadWidth)) * scale

      roadPoints.push(
        // Right Lower
        new THREE.Vector3(roadPointMid.x, 0, roadPointMid.y),
        new THREE.Vector3(roadPointMaxX, 0, roadPointMid.y),
        new THREE.Vector3(roadPointMaxX, 0, roadPointMin.y),

        new THREE.Vector3(roadPointMaxX, 0, roadPointMin.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMin.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMid.y),

        // Left Lower
        new THREE.Vector3(roadPointMid.x, 0, roadPointMid.y),
        new THREE.Vector3(roadPointMin.x, 0, roadPointMid.y),
        new THREE.Vector3(roadPointMin.x, 0, roadPointMin.y),

        new THREE.Vector3(roadPointMin.x, 0, roadPointMin.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMin.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMid.y),
      )

      if (shouldGenerateTrashCan.bottom) {
        shouldGenerateTrashCan.bottom = false

        if (Math.random() > 0.5) {
          shouldGenerateTrashCan.bottomRight = true
        } else {
          shouldGenerateTrashCan.bottomLeft = true
        }
      }

      if (hasRoads.toRight) {
        // TODO: Curve

        const sidewalkPointMin: THREE.Vector2 = new THREE.Vector2(
          (road.x + 1 - sidewalkSize.x) * scale,
          (road.y + sidewalkSize.x) * scale,
        )

        if (shouldGenerateTrashCan.bottomRight) {
          addTrashCan(
            new THREE.Vector2(
              (roadPointMaxX + sidewalkPointMin.x) / 2 - 0.01 * scale,
              roadPointMin.y,
            ),
          )
        }

        sidewalkPoints.push(
          // Right Top
          new THREE.Vector3(sidewalkPointMin.x, sidewalkSize.y, roadPointMin.y),
          new THREE.Vector3(roadPointMaxX, sidewalkSize.y, roadPointMin.y),
          new THREE.Vector3(roadPointMaxX, sidewalkSize.y, sidewalkPointMin.y),

          new THREE.Vector3(roadPointMaxX, sidewalkSize.y, sidewalkPointMin.y),
          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),
          new THREE.Vector3(sidewalkPointMin.x, sidewalkSize.y, roadPointMin.y),

          // // Right Top - Back Side
          new THREE.Vector3(roadPointMaxX, 0, sidewalkPointMin.y),
          new THREE.Vector3(sidewalkPointMin.x, 0, sidewalkPointMin.y),
          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),

          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),
          new THREE.Vector3(roadPointMaxX, sidewalkSize.y, sidewalkPointMin.y),
          new THREE.Vector3(roadPointMaxX, 0, sidewalkPointMin.y),

          // // Right Top - Left Side
          new THREE.Vector3(sidewalkPointMin.x, 0, roadPointMin.y),
          new THREE.Vector3(sidewalkPointMin.x, 0, sidewalkPointMin.y),
          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),

          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),
          new THREE.Vector3(sidewalkPointMin.x, sidewalkSize.y, roadPointMin.y),
          new THREE.Vector3(sidewalkPointMin.x, 0, roadPointMin.y),
        )
      }

      if (hasRoads.toLeft) {
        // TODO: Curve

        const sidewalkPointMin: THREE.Vector2 = new THREE.Vector2(
          (road.x + sidewalkSize.x) * scale,
          (road.y + sidewalkSize.x) * scale,
        )

        if (shouldGenerateTrashCan.bottomLeft) {
          addTrashCan(
            new THREE.Vector2(
              roadPointMin.x +
                (Math.random() * sidewalkSize.x * scale) / 2 +
                0.01 * scale,
              roadPointMin.y,
            ),
          )
        }

        sidewalkPoints.push(
          // Left Top
          new THREE.Vector3(sidewalkPointMin.x, sidewalkSize.y, roadPointMin.y),
          new THREE.Vector3(roadPointMin.x, sidewalkSize.y, roadPointMin.y),
          new THREE.Vector3(roadPointMin.x, sidewalkSize.y, sidewalkPointMin.y),

          new THREE.Vector3(roadPointMin.x, sidewalkSize.y, sidewalkPointMin.y),
          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),
          new THREE.Vector3(sidewalkPointMin.x, sidewalkSize.y, roadPointMin.y),

          // // // Left Top - Back Side
          new THREE.Vector3(roadPointMin.x, 0, sidewalkPointMin.y),
          new THREE.Vector3(sidewalkPointMin.x, 0, sidewalkPointMin.y),
          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),

          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),
          new THREE.Vector3(roadPointMin.x, sidewalkSize.y, sidewalkPointMin.y),
          new THREE.Vector3(roadPointMin.x, 0, sidewalkPointMin.y),

          // // // Left Top - Right Side
          new THREE.Vector3(sidewalkPointMin.x, 0, roadPointMin.y),
          new THREE.Vector3(sidewalkPointMin.x, 0, sidewalkPointMin.y),
          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),

          new THREE.Vector3(
            sidewalkPointMin.x,
            sidewalkSize.y,
            sidewalkPointMin.y,
          ),
          new THREE.Vector3(sidewalkPointMin.x, sidewalkSize.y, roadPointMin.y),
          new THREE.Vector3(sidewalkPointMin.x, 0, roadPointMin.y),
        )
      }
    } else {
      const roadPointMin: THREE.Vector2 = new THREE.Vector2(
        (road.x + (hasRoads.toLeft ? 0 : 1 - roadWidth)) * scale,
        (road.y + (1 - roadWidth)) * scale,
      )

      const roadPointMaxX: number =
        (road.x + (hasRoads.toRight ? 1 : roadWidth)) * scale

      if (
        shouldGenerateTrashCan.bottom ||
        shouldGenerateTrashCan.bottomLeft ||
        shouldGenerateTrashCan.bottomRight
      ) {
        addTrashCan(
          new THREE.Vector2(
            Math.random() * roadWidthInScale + roadPointMin.x,
            roadPointMin.y - (sidewalkSize.x * scale) / 2 - 0.01 * scale,
          ),
        )
      }

      roadPoints.push(
        // Right Lower
        new THREE.Vector3(roadPointMid.x, 0, roadPointMid.y),
        new THREE.Vector3(roadPointMaxX, 0, roadPointMid.y),
        new THREE.Vector3(roadPointMaxX, 0, roadPointMin.y),

        new THREE.Vector3(roadPointMaxX, 0, roadPointMin.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMin.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMid.y),

        // Left Lower
        new THREE.Vector3(roadPointMid.x, 0, roadPointMid.y),
        new THREE.Vector3(roadPointMin.x, 0, roadPointMid.y),
        new THREE.Vector3(roadPointMin.x, 0, roadPointMin.y),

        new THREE.Vector3(roadPointMin.x, 0, roadPointMin.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMin.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMid.y),
      )

      const sidewalkPointMinY: number = road.y * scale

      addStreetLamp(
        new THREE.Vector2(roadPointMid.x, roadPointMin.y - streetLampSize),
      )

      sidewalkPoints.push(
        // Right Lower
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, roadPointMin.y),
        new THREE.Vector3(roadPointMaxX, sidewalkSize.y, roadPointMin.y),
        new THREE.Vector3(roadPointMaxX, sidewalkSize.y, sidewalkPointMinY),

        new THREE.Vector3(roadPointMaxX, sidewalkSize.y, sidewalkPointMinY),
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, sidewalkPointMinY),
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, roadPointMin.y),

        // Left Lower
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, roadPointMin.y),
        new THREE.Vector3(roadPointMin.x, sidewalkSize.y, roadPointMin.y),
        new THREE.Vector3(roadPointMin.x, sidewalkSize.y, sidewalkPointMinY),

        new THREE.Vector3(roadPointMin.x, sidewalkSize.y, sidewalkPointMinY),
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, sidewalkPointMinY),
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, roadPointMin.y),

        // Right Lower - Front Side
        new THREE.Vector3(roadPointMid.x, 0, roadPointMin.y),
        new THREE.Vector3(roadPointMaxX, 0, roadPointMin.y),
        new THREE.Vector3(roadPointMaxX, sidewalkSize.y, roadPointMin.y),

        new THREE.Vector3(roadPointMaxX, sidewalkSize.y, roadPointMin.y),
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, roadPointMin.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMin.y),

        // Left Lower - Front Side
        new THREE.Vector3(roadPointMid.x, 0, roadPointMin.y),
        new THREE.Vector3(roadPointMin.x, 0, roadPointMin.y),
        new THREE.Vector3(roadPointMin.x, sidewalkSize.y, roadPointMin.y),

        new THREE.Vector3(roadPointMin.x, sidewalkSize.y, roadPointMin.y),
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, roadPointMin.y),
        new THREE.Vector3(roadPointMid.x, 0, roadPointMin.y),

        // Right Lower - Back Side
        new THREE.Vector3(roadPointMid.x, 0, sidewalkPointMinY),
        new THREE.Vector3(roadPointMaxX, 0, sidewalkPointMinY),
        new THREE.Vector3(roadPointMaxX, sidewalkSize.y, sidewalkPointMinY),

        new THREE.Vector3(roadPointMaxX, sidewalkSize.y, sidewalkPointMinY),
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, sidewalkPointMinY),
        new THREE.Vector3(roadPointMid.x, 0, sidewalkPointMinY),

        // Left Lower - Back Side
        new THREE.Vector3(roadPointMid.x, 0, sidewalkPointMinY),
        new THREE.Vector3(roadPointMin.x, 0, sidewalkPointMinY),
        new THREE.Vector3(roadPointMin.x, sidewalkSize.y, sidewalkPointMinY),

        new THREE.Vector3(roadPointMin.x, sidewalkSize.y, sidewalkPointMinY),
        new THREE.Vector3(roadPointMid.x, sidewalkSize.y, sidewalkPointMinY),
        new THREE.Vector3(roadPointMid.x, 0, sidewalkPointMinY),

        // Right Side
        new THREE.Vector3(roadPointMaxX, 0, roadPointMin.y),
        new THREE.Vector3(roadPointMaxX, 0, sidewalkPointMinY),
        new THREE.Vector3(roadPointMaxX, sidewalkSize.y, sidewalkPointMinY),

        new THREE.Vector3(roadPointMaxX, sidewalkSize.y, sidewalkPointMinY),
        new THREE.Vector3(roadPointMaxX, sidewalkSize.y, roadPointMin.y),
        new THREE.Vector3(roadPointMaxX, 0, roadPointMin.y),

        // Left Side
        new THREE.Vector3(roadPointMin.x, 0, roadPointMin.y),
        new THREE.Vector3(roadPointMin.x, 0, sidewalkPointMinY),
        new THREE.Vector3(roadPointMin.x, sidewalkSize.y, sidewalkPointMinY),

        new THREE.Vector3(roadPointMin.x, sidewalkSize.y, sidewalkPointMinY),
        new THREE.Vector3(roadPointMin.x, sidewalkSize.y, roadPointMin.y),
        new THREE.Vector3(roadPointMin.x, 0, roadPointMin.y),
      )
    }

    if (!hasRoads.toLeft) {
      const sidewalkPointMin: THREE.Vector2 = new THREE.Vector2(
        road.x * scale,
        road.y * scale,
      )
      const sidewalkPointMax: THREE.Vector2 = new THREE.Vector2(
        (road.x + (1 - roadWidth)) * scale,
        (road.y + 1) * scale,
      )

      addStreetLamp(
        new THREE.Vector2(sidewalkPointMax.x - streetLampSize, roadPointMid.y),
      )

      if (shouldGenerateTrashCan.left) {
        addTrashCan(
          new THREE.Vector2(
            sidewalkPointMax.x - (sidewalkSize.x * scale) / 2 - 0.01 * scale,
            Math.random() * roadWidthInScale + sidewalkPointMin.y,
          ),
        )
      }

      sidewalkPoints.push(
        // Right Lower
        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),
        new THREE.Vector3(
          sidewalkPointMax.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),
        new THREE.Vector3(
          sidewalkPointMax.x,
          sidewalkSize.y,
          sidewalkPointMax.y,
        ),

        new THREE.Vector3(
          sidewalkPointMax.x,
          sidewalkSize.y,
          sidewalkPointMax.y,
        ),
        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMax.y,
        ),
        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),

        // Front Side
        new THREE.Vector3(sidewalkPointMax.x, 0, sidewalkPointMax.y),
        new THREE.Vector3(sidewalkPointMin.x, 0, sidewalkPointMax.y),
        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMax.y,
        ),

        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMax.y,
        ),
        new THREE.Vector3(
          sidewalkPointMax.x,
          sidewalkSize.y,
          sidewalkPointMax.y,
        ),
        new THREE.Vector3(sidewalkPointMax.x, 0, sidewalkPointMax.y),

        //  Back Side
        new THREE.Vector3(sidewalkPointMax.x, 0, sidewalkPointMin.y),
        new THREE.Vector3(sidewalkPointMin.x, 0, sidewalkPointMin.y),
        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),

        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),
        new THREE.Vector3(
          sidewalkPointMax.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),
        new THREE.Vector3(sidewalkPointMax.x, 0, sidewalkPointMin.y),

        // Right Side
        new THREE.Vector3(sidewalkPointMax.x, 0, sidewalkPointMax.y),
        new THREE.Vector3(sidewalkPointMax.x, 0, sidewalkPointMin.y),
        new THREE.Vector3(
          sidewalkPointMax.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),

        new THREE.Vector3(
          sidewalkPointMax.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),
        new THREE.Vector3(
          sidewalkPointMax.x,
          sidewalkSize.y,
          sidewalkPointMax.y,
        ),
        new THREE.Vector3(sidewalkPointMax.x, 0, sidewalkPointMax.y),

        // Left Side
        new THREE.Vector3(sidewalkPointMin.x, 0, sidewalkPointMax.y),
        new THREE.Vector3(sidewalkPointMin.x, 0, sidewalkPointMin.y),
        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),

        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),
        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMax.y,
        ),
        new THREE.Vector3(sidewalkPointMin.x, 0, sidewalkPointMax.y),
      )
    }

    if (!hasRoads.toRight) {
      const sidewalkPointMin: THREE.Vector2 = new THREE.Vector2(
        (road.x + roadWidth) * scale,
        road.y * scale,
      )
      const sidewalkPointMax: THREE.Vector2 = new THREE.Vector2(
        (road.x + 1) * scale,
        (road.y + 1) * scale,
      )

      addStreetLamp(
        new THREE.Vector2(sidewalkPointMin.x + streetLampSize, roadPointMid.y),
      )

      if (shouldGenerateTrashCan.right) {
        addTrashCan(
          new THREE.Vector2(
            sidewalkPointMax.x - (sidewalkSize.x * scale) / 2 - 0.01 * scale,
            Math.random() * roadWidthInScale + sidewalkPointMin.y,
          ),
        )
      }

      sidewalkPoints.push(
        // Right Lower
        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),
        new THREE.Vector3(
          sidewalkPointMax.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),
        new THREE.Vector3(
          sidewalkPointMax.x,
          sidewalkSize.y,
          sidewalkPointMax.y,
        ),

        new THREE.Vector3(
          sidewalkPointMax.x,
          sidewalkSize.y,
          sidewalkPointMax.y,
        ),
        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMax.y,
        ),
        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),

        // Front Side
        new THREE.Vector3(sidewalkPointMax.x, 0, sidewalkPointMax.y),
        new THREE.Vector3(sidewalkPointMin.x, 0, sidewalkPointMax.y),
        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMax.y,
        ),

        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMax.y,
        ),
        new THREE.Vector3(
          sidewalkPointMax.x,
          sidewalkSize.y,
          sidewalkPointMax.y,
        ),
        new THREE.Vector3(sidewalkPointMax.x, 0, sidewalkPointMax.y),

        //  Back Side
        new THREE.Vector3(sidewalkPointMax.x, 0, sidewalkPointMin.y),
        new THREE.Vector3(sidewalkPointMin.x, 0, sidewalkPointMin.y),
        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),

        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),
        new THREE.Vector3(
          sidewalkPointMax.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),
        new THREE.Vector3(sidewalkPointMax.x, 0, sidewalkPointMin.y),

        // Right Side
        new THREE.Vector3(sidewalkPointMax.x, 0, sidewalkPointMax.y),
        new THREE.Vector3(sidewalkPointMax.x, 0, sidewalkPointMin.y),
        new THREE.Vector3(
          sidewalkPointMax.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),

        new THREE.Vector3(
          sidewalkPointMax.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),
        new THREE.Vector3(
          sidewalkPointMax.x,
          sidewalkSize.y,
          sidewalkPointMax.y,
        ),
        new THREE.Vector3(sidewalkPointMax.x, 0, sidewalkPointMax.y),

        // Left Side
        new THREE.Vector3(sidewalkPointMin.x, 0, sidewalkPointMax.y),
        new THREE.Vector3(sidewalkPointMin.x, 0, sidewalkPointMin.y),
        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),

        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMin.y,
        ),
        new THREE.Vector3(
          sidewalkPointMin.x,
          sidewalkSize.y,
          sidewalkPointMax.y,
        ),
        new THREE.Vector3(sidewalkPointMin.x, 0, sidewalkPointMax.y),
      )
    }
  }

  const roadUV: Float32Array = new Float32Array(roadPoints.length * 2)

  const roadSizeOffset: THREE.Vector2 = new THREE.Vector2(
    Math.abs(sizes.roadMin.x),
    Math.abs(sizes.roadMin.y),
  )

  for (let i: number = 0; i < roadPoints.length; i++) {
    roadUV[i * 2] = (roadSizeOffset.x + roadPoints[i].x) / sizes.roadSize.x
    roadUV[i * 2 + 1] = (roadSizeOffset.y + roadPoints[i].z) / sizes.roadSize.y
  }

  const roadsGeo: THREE.BufferGeometry = new THREE.BufferGeometry()
  roadsGeo.setFromPoints(roadPoints)
  roadsGeo.setAttribute('uv', new THREE.BufferAttribute(roadUV, 2))

  const roadTextures: PolyHavenTextureResult = loadPolyHavenTexture({
    name: 'aerial_asphalt_01',
    res: resolutions.TEXTURE,
    incrementLoadState,
    repeats: new THREE.Vector2(
      (sizes.roadSize.x * 2) / scale,
      (sizes.roadSize.y * 2) / scale,
    ),
  })

  const roadsMat: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial({
    ...roadTextures,
    flatShading: true,
    side: THREE.DoubleSide,
  })

  const roadMesh: THREE.Mesh = new THREE.Mesh(roadsGeo, roadsMat)
  roadMesh.position.setY(0.001 * scale)

  roadMesh.receiveShadow = true

  roadsAndSidewalksGroup.add(roadMesh)

  const sidewalkUV: Float32Array = new Float32Array(sidewalkPoints.length * 2)

  for (let i: number = 0; i < sidewalkPoints.length; i++) {
    if (sidewalkPoints[i].y > 0) {
      sidewalkUV[i * 2] =
        (roadSizeOffset.x + sidewalkPoints[i].x) / sizes.roadSize.x
      sidewalkUV[i * 2 + 1] =
        (roadSizeOffset.y + sidewalkPoints[i].z) / sizes.roadSize.y
    } else {
      sidewalkUV[i * 2] =
        (roadSizeOffset.x + sidewalkPoints[i].x + sidewalkSize.y) /
        sizes.roadSize.x
      sidewalkUV[i * 2 + 1] =
        (roadSizeOffset.y + sidewalkPoints[i].z + sidewalkSize.y) /
        sizes.roadSize.y
    }
  }

  const sidewalkGeo: THREE.BufferGeometry = new THREE.BufferGeometry()
  sidewalkGeo.setFromPoints(sidewalkPoints)
  sidewalkGeo.setAttribute('uv', new THREE.BufferAttribute(sidewalkUV, 2))

  const sidewalkTextures: PolyHavenTextureResult = loadPolyHavenTexture({
    name: 'rough_concrete',
    res: resolutions.TEXTURE,
    ambient: 'arm',
    incrementLoadState,
    repeats: new THREE.Vector2(
      (sizes.roadSize.x * 16) / scale,
      (sizes.roadSize.y * 16) / scale,
    ),
  })

  const sidewalkMat: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial({
    ...sidewalkTextures,
    flatShading: true,
    side: THREE.DoubleSide,
  })

  const sidewalkMesh: THREE.Mesh = new THREE.Mesh(sidewalkGeo, sidewalkMat)

  sidewalkMesh.position.setY(0)
  sidewalkMesh.castShadow = true
  sidewalkMesh.receiveShadow = true

  roadsAndSidewalksGroup.add(sidewalkMesh)

  return roadsAndSidewalksGroup
}

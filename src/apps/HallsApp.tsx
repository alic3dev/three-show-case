import type { AppComponent } from '@/apps/types'

import type { StatsRefObject } from '@/hooks/useStats'

import type {
  GenerateChunkMethod,
  GenerateChunkMethodParams,
} from '@/utils/Chunks'

import React from 'react'

import * as THREE from 'three'
import WebGL from 'three/addons/capabilities/WebGL'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader'
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader'

import { LoadingScreen } from '@/components/LoadingScreen'

import { useStats } from '@/hooks/useStats'

import { Chunk, ChunkManager } from '@/utils/Chunks'
import { EventsManager } from '@/utils/EventsManager'
import * as objectUtils from '@/utils/objects'
import { resolveAsset } from '@/utils/resolveAsset'

import styles from '@/apps/StandardApp.module.scss'
import {
  loadPolyHavenTexture,
  PolyHavenTextureResult,
} from '@/utils/polyHavenLoader'

export const displayName: string = 'Halls'

function generateHalls(
  location: THREE.Vector3,
  chunkSize: number,
): THREE.Vector2[] {
  const halls: THREE.Vector2[] = []

  if (location.y !== 0) return halls

  for (let i: number = 0; i < chunkSize; i++) {
    halls.push(new THREE.Vector2(Math.random(), Math.random()))
  }

  return halls
}

const generateChunkMethod: GenerateChunkMethod = function generateChunkMethod({
  location,
  options,
  cacheManager,
}: GenerateChunkMethodParams): Chunk {
  const positionOffset: THREE.Vector3 = new THREE.Vector3(
    location.x * options.CHUNK_SIZE,
    location.y * options.CHUNK_SIZE,
    location.z * options.CHUNK_SIZE,
  )

  const objects: THREE.Group = new THREE.Group()

  if (location.y === 0) {
    const a = new THREE.Mesh(
      new THREE.BoxGeometry(1, 100, 1),
      new THREE.MeshBasicMaterial({ color: 0x04a245 }),
    )

    objects.add(a)

    const floorCacheKey: string = `floor:${options.CHUNK_SIZE}`
    const floorMaterial: THREE.Material = cacheManager.getMaterial(
      floorCacheKey,
      (): THREE.Material => {
        const floorTextures: PolyHavenTextureResult =
          cacheManager.getPolyHavenTexture(
            floorCacheKey,
            (): PolyHavenTextureResult => {
              return loadPolyHavenTexture({
                name: 'marble_01',
                repeats: options.CHUNK_SIZE / 4,
              })
            },
          )

        return new THREE.MeshPhongMaterial({
          color: 0xffffff,
          ...floorTextures,
        })
      },
    )

    const floorGeometry: THREE.BufferGeometry = cacheManager.getGeometry(
      floorCacheKey,
      (): THREE.BufferGeometry => {
        return new THREE.BoxGeometry(options.CHUNK_SIZE, 1, options.CHUNK_SIZE)
      },
    )

    const mshFloor: THREE.Mesh = new THREE.Mesh(floorGeometry, floorMaterial)
    mshFloor.position.set(0, -0.5, 0)
    mshFloor.receiveShadow = true

    objects.add(mshFloor)
  }

  const halls: THREE.Vector2[] = generateHalls(location, options.CHUNK_SIZE)

  for (const hall of halls) {
    const hallFloorCacheKey: string = `hall:floor:${options.CHUNK_SIZE}`
    const hallFloorMaterial: THREE.Material = cacheManager.getMaterial(
      hallFloorCacheKey,
      (): THREE.Material => {
        const hallFloorTextures: PolyHavenTextureResult =
          cacheManager.getPolyHavenTexture(
            hallFloorCacheKey,
            (): PolyHavenTextureResult => {
              return loadPolyHavenTexture({
                name: 'cobblestone_floor_04',
                repeats: 1,
              })
            },
          )

        return new THREE.MeshPhongMaterial({
          color: 0xffffff,
          ...hallFloorTextures,
        })
      },
    )

    const hallFloorGeometry: THREE.BufferGeometry = cacheManager.getGeometry(
      hallFloorCacheKey,
      (): THREE.BufferGeometry => {
        return new THREE.BoxGeometry(1, 1, 1)
      },
    )

    const hallFloorMesh: THREE.Mesh = new THREE.Mesh(
      hallFloorGeometry,
      hallFloorMaterial,
    )
    hallFloorMesh.position.set(
      hall.x * options.CHUNK_SIZE,
      0,
      hall.y * options.CHUNK_SIZE,
    )
    hallFloorMesh.receiveShadow = true

    objects.add(hallFloorMesh)
  }

  objects.position.add(positionOffset)

  return new Chunk({ location, objects })
}

export const HallsApp: AppComponent = (): React.ReactElement => {
  const statsRef: StatsRefObject = useStats()

  const webGLSupported = React.useRef<{ value: boolean }>({ value: true })

  const renderer = React.useRef<THREE.WebGLRenderer>()
  const rendererContainer = React.useRef<HTMLDivElement>(null)
  const rendererProperties = React.useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    objects: THREE.Object3D[]
    chunkManager: ChunkManager
    debugObjects: Record<string, THREE.Object3D>
  }>()

  const player = React.useRef<{ pointerLocked: boolean; body: THREE.Group }>({
    pointerLocked: false,
    body: new THREE.Group(),
  })

  const [loadState /*, setLoadState*/] = React.useState<number>(1)

  React.useEffect((): (() => void) | void => {
    if (!webGLSupported.current.value || !rendererContainer.current) return

    if (!WebGL.isWebGLAvailable()) {
      rendererContainer.current.appendChild(WebGL.getWebGLErrorMessage())

      webGLSupported.current.value = false
      return
    }

    if (!renderer.current) {
      renderer.current = new THREE.WebGLRenderer({ antialias: true })
      renderer.current.setSize(
        rendererContainer.current.clientWidth,
        rendererContainer.current.clientHeight,
      )

      renderer.current.setPixelRatio(window.devicePixelRatio)

      renderer.current.shadowMap.enabled = true
      renderer.current.shadowMap.type = THREE.PCFSoftShadowMap

      renderer.current.toneMapping = THREE.ACESFilmicToneMapping
      renderer.current.toneMappingExposure = 1

      renderer.current.setClearColor(0x000000)

      rendererContainer.current.appendChild(renderer.current.domElement)
    }

    if (!rendererProperties.current) {
      const scene: THREE.Scene = new THREE.Scene()

      const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
        90,
        rendererContainer.current.clientWidth /
          rendererContainer.current.clientHeight,
        0.1,
        2000,
      )
      camera.position.set(0, 1, 0)
      camera.lookAt(0, 1, -300)

      player.current.body.add(camera)
      player.current.body.rotateY(THREE.MathUtils.degToRad(180))

      scene.add(player.current.body)

      const CHUNK_SIZE: number = 250

      const chunkManager: ChunkManager = new ChunkManager({
        scene,
        camera,
        options: {
          CHUNK_SIZE,
        },
        generateChunkMethod,
        getCameraPositionMethod: (): THREE.Vector3 => {
          return player.current.body.position
        },
      })

      scene.fog = new THREE.Fog(0x181d23, 1, chunkManager.options.CHUNK_SIZE)

      const axesLines: THREE.AxesHelper =
        objectUtils.axesLines.createAxesLines()
      const grid: THREE.GridHelper = objectUtils.grid.createGrid()
      grid.material.blending = THREE.SubtractiveBlending

      const ambientLight: THREE.AmbientLight = new THREE.AmbientLight(
        0xcbd4d9,
        1,
      )
      scene.add(ambientLight)

      new RGBELoader().load(
        resolveAsset(`hdr/kloppenheim_02_puresky_4k.hdr`),
        (texture: THREE.DataTexture): void => {
          texture.mapping = THREE.EquirectangularReflectionMapping

          scene.background = texture
          scene.backgroundIntensity = 0.1

          scene.environment = texture
          scene.environmentIntensity = 0.1
        },
      )

      rendererProperties.current = {
        scene,
        camera,
        objects: [],
        chunkManager,
        debugObjects: { grid, axesLines },
      }

      rendererContainer.current.appendChild(statsRef.current.stats.dom)

      for (const object of rendererProperties.current.objects) {
        rendererProperties.current.scene.add(object)

        object.castShadow = true
        object.receiveShadow = true

        const subObjects: THREE.Object3D[] = object.children

        for (const subObject of subObjects) {
          subObject.castShadow = true
          subObject.receiveShadow = true
        }
      }

      for (const objectName in rendererProperties.current.debugObjects) {
        rendererProperties.current.scene.add(
          rendererProperties.current.debugObjects[objectName],
        )

        rendererProperties.current.debugObjects[objectName].visible = false
        rendererProperties.current.debugObjects[objectName].castShadow = false
        rendererProperties.current.debugObjects[objectName].receiveShadow =
          false

        const subObjects: THREE.Object3D[] =
          rendererProperties.current.debugObjects[objectName].children

        for (const subObject of subObjects) {
          subObject.castShadow = false
          subObject.receiveShadow = false
        }
      }
    }

    let resizeTimeoutHandle: number
    const onResize: () => void = (): void => {
      window.clearTimeout(resizeTimeoutHandle)
      resizeTimeoutHandle = window.setTimeout((): void => {
        if (!rendererProperties.current || !rendererContainer.current) return

        rendererProperties.current.camera.aspect =
          rendererContainer.current.clientWidth /
          rendererContainer.current.clientHeight
        rendererProperties.current.camera.updateProjectionMatrix()

        if (!renderer.current) return

        renderer.current.setSize(
          rendererContainer.current.clientWidth,
          rendererContainer.current.clientHeight,
        )
      }, 0)
    }

    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(rendererContainer.current!)

    const eventsManager: EventsManager = new EventsManager(
      rendererContainer.current,
    )

    const onPointerMove = (ev: PointerEvent): void => {
      if (!player.current?.pointerLocked) return

      if (ev.movementX !== 0) {
        player.current.body.rotateY(
          -0.002 * Math.max(Math.min(ev.movementX, 60), -60),
        )
      }

      if (ev.movementY !== 0) {
        rendererProperties.current?.camera.rotateX(
          -0.001 * Math.max(Math.min(ev.movementY, 60), -60),
        )
      }
    }
    eventsManager.addContainerEvent('pointermove', onPointerMove)

    const lockChangeAlert = (): void => {
      if (document.pointerLockElement === renderer.current?.domElement) {
        player.current!.pointerLocked = true
      } else {
        player.current!.pointerLocked = false
      }
    }
    eventsManager.addDocumentEvent('pointerlockchange', lockChangeAlert)

    const heldKeys: Record<string, boolean> = {}

    const onKeyup: (ev: KeyboardEvent) => void = (ev: KeyboardEvent): void => {
      heldKeys[ev.key.toLowerCase()] = false
      heldKeys[ev.code.toLowerCase()] = false
    }
    eventsManager.addWindowEvent('keyup', onKeyup)

    const onKeydown: (ev: KeyboardEvent) => void = (
      ev: KeyboardEvent,
    ): void => {
      if (heldKeys[ev.key.toLowerCase()] || heldKeys[ev.code.toLowerCase()])
        return

      switch (ev.key.toLowerCase()) {
        case 's':
          statsRef.current.next()
          break
        case 'g':
          rendererProperties.current!.debugObjects.grid.visible =
            !rendererProperties.current!.debugObjects.grid.visible
          break
        case 'l':
          rendererProperties.current!.debugObjects.axesLines.visible =
            !rendererProperties.current!.debugObjects.axesLines.visible
          break
        default:
          break
      }

      heldKeys[ev.key.toLowerCase()] = true
      heldKeys[ev.code.toLowerCase()] = true
    }
    eventsManager.addWindowEvent('keydown', onKeydown)

    const onMouseDown = (): void => {
      const pointerLockPromise: Promise<void> | undefined =
        renderer.current?.domElement.requestPointerLock({
          unadjustedMovement: true,
        }) as Promise<void> | undefined

      if (!pointerLockPromise) {
        renderer.current?.domElement.requestPointerLock()
      }
    }
    eventsManager.addContainerEvent('mousedown', onMouseDown)

    const animate: XRFrameRequestCallback = (): void => {
      if (!renderer.current) return

      statsRef.current.stats.update()

      const speed: number = heldKeys['shift'] ? 0.4 : 0.2

      if (heldKeys['arrowup'] || heldKeys['w']) {
        player.current.body.translateZ(-speed)
      }

      if (heldKeys['arrowdown'] || heldKeys['s']) {
        player.current.body.translateZ(speed)
      }

      if (heldKeys['arrowleft'] || heldKeys['a']) {
        player.current.body.translateX(-speed)
      }

      if (heldKeys['arrowright'] || heldKeys['d']) {
        player.current.body.translateX(speed)
      }

      rendererProperties.current?.chunkManager.poll()

      renderer.current.render(
        rendererProperties.current!.scene,
        rendererProperties.current!.camera,
      )
    }
    renderer.current.setAnimationLoop(animate)

    const panel = new GUI({ autoPlace: true })

    return (): void => {
      panel.destroy()

      resizeObserver.disconnect()
      eventsManager.removeAllEvents()

      renderer.current!.setAnimationLoop(null)

      rendererProperties.current?.chunkManager.cacheManager.dispose()
    }
  }, [statsRef])

  return (
    <div className={styles.app}>
      <div ref={rendererContainer} className={styles.container}></div>

      <LoadingScreen loading={loadState < 0} />
    </div>
  )
}

import type { AppComponent } from '@/apps/types'

import type { RendererPropertiesInterface } from '@/apps/CityApp.types'

import type { StatsRefObject } from '@/hooks/useStats'

import type { City, CityOptions } from '@/utils/city'

import React from 'react'

import * as THREE from 'three'
import WebGL from 'three/addons/capabilities/WebGL'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

import { LoadingScreen } from '@/components/LoadingScreen'

import { useStats } from '@/hooks/useStats'

import {
  defaultCityOptions,
  defaultResolutions,
  generateCity,
} from '@/utils/city'
import { EventsManager } from '@/utils/EventsManager'
import * as objectUtils from '@/utils/objects'
import { resolveAsset } from '@/utils/resolveAsset'

import styles from '@/apps/StandardApp.module.scss'

export const displayName: string = 'City'

const _initialCityGenerationOptions: CityOptions = {
  ...defaultCityOptions,
  roadSpacing: defaultCityOptions.roadSpacing.clone(),
  resolutions: { ...defaultResolutions },
}

// FIXME: This doesn't work as it should
const fullyLoadedState: number = 8

export const CityApp: AppComponent = (): React.ReactElement => {
  const statsRef: StatsRefObject = useStats()

  const webGLSupported = React.useRef<{ value: boolean }>({ value: true })

  const renderer = React.useRef<THREE.WebGLRenderer>()
  const rendererContainer = React.useRef<HTMLDivElement>(null)
  const rendererProperties = React.useRef<RendererPropertiesInterface>()

  const cityGenerationOptions = React.useRef<CityOptions>(
    _initialCityGenerationOptions,
  )

  const player = React.useRef<{ pointerLocked: boolean; body: THREE.Group }>({
    pointerLocked: false,
    body: new THREE.Group(),
  })

  const [loadState, setLoadState] = React.useState<number>(0)

  const incrementLoadState = (): void => {
    setLoadState((prevLoadState: number): number => prevLoadState + 1)
  }

  const localGenerateCity = React.useCallback((): void => {
    generateCity({
      options: cityGenerationOptions.current,
      incrementLoadState,
    }).then((city: City): void => {
      player.current.body.position.set(0, 0, 0)

      if (rendererProperties.current) {
        if (rendererProperties.current.city) {
          rendererProperties.current.scene.remove(
            rendererProperties.current.city.objects,
          )
          rendererProperties.current.city.dispose()
        }

        rendererProperties.current.city = city

        const cityGrid: THREE.GridHelper | undefined =
          rendererProperties.current.city.objects.children.find(
            (object) => object instanceof THREE.GridHelper,
          )

        if (cityGrid) {
          rendererProperties.current.debugObjects.grid = cityGrid
        }

        rendererProperties.current.scene.add(city.objects)
      }
    })
  }, [])

  React.useEffect((): (() => void) | void => {
    if (!webGLSupported.current.value || !rendererContainer.current) return

    if (!WebGL.isWebGLAvailable()) {
      rendererContainer.current.appendChild(WebGL.getWebGLErrorMessage())

      setLoadState(Infinity)

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
      renderer.current.toneMappingExposure = 0.8

      renderer.current.setClearColor(855309)

      rendererContainer.current.appendChild(renderer.current.domElement)
    }

    if (!rendererProperties.current) {
      const frustum: { near: number; far: number } = {
        near: 0.1,
        far: 500,
      }

      const scene: THREE.Scene = new THREE.Scene()
      scene.fog = new THREE.Fog(0x000000, frustum.near * 250, frustum.far / 2)

      const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
        90,
        rendererContainer.current.clientWidth /
          rendererContainer.current.clientHeight,
        frustum.near,
        frustum.far,
      )
      camera.position.set(0, 1, 0)
      camera.lookAt(0, 1, -1)

      player.current.body.add(camera)

      const flashlight: THREE.SpotLight = new THREE.SpotLight(
        0xffffff,
        5,
        0,
        Math.PI / 2,
        1,
        1,
      )
      flashlight.position.set(0, 1, 0)

      const targetObject: THREE.Object3D = new THREE.Object3D()
      camera.add(targetObject)
      flashlight.target = targetObject
      flashlight.target.position.set(0, 1, -1)

      flashlight.castShadow = true

      flashlight.shadow.mapSize.width = 1024
      flashlight.shadow.mapSize.height = 1024

      player.current.body.add(flashlight)

      player.current.body.rotateY(
        THREE.MathUtils.degToRad(Math.random() * 90 - 45),
      )

      scene.add(player.current.body)

      new RGBELoader().load(
        resolveAsset(`hdr/kloppenheim_02_4k.hdr`),
        (texture: THREE.DataTexture): void => {
          texture.mapping = THREE.EquirectangularReflectionMapping

          scene.background = texture
          scene.backgroundIntensity = 0.1

          scene.environment = texture
          scene.environmentIntensity = 0.1

          incrementLoadState()
        },
      )

      const ambientLight: THREE.AmbientLight = new THREE.AmbientLight(
        0xffffff,
        0.1,
      )
      scene.add(ambientLight)

      localGenerateCity()

      const axesLines: THREE.AxesHelper =
        objectUtils.axesLines.createAxesLines()

      axesLines.renderOrder = 999999

      if (Array.isArray(axesLines.material)) {
        for (const material of axesLines.material) {
          material.depthTest = false
          material.depthWrite = false
        }
      } else {
        axesLines.material.depthTest = false
        axesLines.material.depthWrite = false
      }

      rendererProperties.current = {
        scene,
        camera,
        flashlight,
        ambientLight,
        debugObjects: {
          axesLines,
        },
      }

      rendererContainer.current.appendChild(statsRef.current.stats.dom)

      for (const _objectName in rendererProperties.current.debugObjects) {
        const objectName: keyof RendererPropertiesInterface['debugObjects'] =
          _objectName as keyof RendererPropertiesInterface['debugObjects']

        if (!rendererProperties.current.debugObjects[objectName]) {
          continue
        }

        rendererProperties.current.scene.add(
          rendererProperties.current.debugObjects[objectName],
        )

        rendererProperties.current.debugObjects[objectName].visible = false
        rendererProperties.current.debugObjects[objectName].castShadow = false
        rendererProperties.current.debugObjects[objectName].receiveShadow =
          false

        rendererProperties.current.debugObjects[objectName].traverse(
          (subObject: THREE.Object3D): void => {
            subObject.castShadow = false
            subObject.receiveShadow = false
          },
        )
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

    const resizeObserver: ResizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(rendererContainer.current!)

    const eventsManager: EventsManager = new EventsManager(
      rendererContainer.current,
    )

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
          if (rendererProperties.current?.debugObjects.grid) {
            rendererProperties.current.debugObjects.grid.visible =
              !rendererProperties.current.debugObjects.grid.visible
          }
          break
        case 'p':
          rendererProperties.current?.city?.toggleDistrictDebugDisplay()
          break
        case 'l':
          rendererProperties.current!.debugObjects.axesLines.visible =
            !rendererProperties.current!.debugObjects.axesLines.visible
          break
        case 'f':
          rendererProperties.current!.flashlight.visible =
            !rendererProperties.current!.flashlight.visible
          break
        default:
          break
      }

      heldKeys[ev.key.toLowerCase()] = true
      heldKeys[ev.code.toLowerCase()] = true
    }
    eventsManager.addWindowEvent('keydown', onKeydown)

    const onPointerMove = (ev: PointerEvent): void => {
      if (!player.current.pointerLocked) return

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
        player.current.pointerLocked = true
      } else {
        player.current.pointerLocked = false
      }
    }
    eventsManager.addDocumentEvent('pointerlockchange', lockChangeAlert)

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

    const playerBaseSpeed: number = 0.025

    const animate: XRFrameRequestCallback = (): void => {
      statsRef.current.stats.update()

      const speed: number =
        (heldKeys['control'] ? 4 : 1) *
        (heldKeys['shift'] ? playerBaseSpeed * 2 : playerBaseSpeed)

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

      if (heldKeys['q']) {
        player.current.body.translateY(-speed * 4)
      }

      if (heldKeys['e']) {
        player.current.body.translateY(speed * 4)
      }

      renderer.current!.render(
        rendererProperties.current!.scene,
        rendererProperties.current!.camera,
      )
    }
    renderer.current.setAnimationLoop(animate)

    const panel: GUI = new GUI({ autoPlace: true })
    const generationFolder: GUI = panel.addFolder('Generation')
    const resolutionsFolder: GUI = generationFolder.addFolder('Resolutions')
    resolutionsFolder.add(cityGenerationOptions.current.resolutions, 'GLTF', [
      '1k',
      '2k',
      '4k',
    ])
    resolutionsFolder.add(
      cityGenerationOptions.current.resolutions,
      'TEXTURE',
      ['1k', '2k', '4k'],
    )
    resolutionsFolder.add(cityGenerationOptions.current.resolutions, 'HDR', [
      '1k',
      '2k',
      '4k',
    ])
    generationFolder.add(cityGenerationOptions.current, 'roadTiles', 0, 5000, 1)
    generationFolder.add(
      cityGenerationOptions.current,
      'numberOfBuildings',
      0,
      5000 * 4,
      1,
    )
    generationFolder.add(cityGenerationOptions.current, 'addGLTFModels')
    generationFolder.add(cityGenerationOptions.current, 'scale', 0.1, 40, 0.1)
    generationFolder.add(
      {
        Generate: (): void => {
          setLoadState((prevLoadState: number): number => {
            if (prevLoadState < fullyLoadedState) {
              return prevLoadState
            }

            localGenerateCity()

            return 1
          })
        },
      },
      'Generate',
    )

    return (): void => {
      panel.destroy()

      renderer.current!.setAnimationLoop(null)

      resizeObserver.disconnect()
      eventsManager.removeAllEvents()
    }
  }, [localGenerateCity, statsRef])

  return (
    <div className={styles.app}>
      <div ref={rendererContainer} className={styles.container}></div>

      <LoadingScreen loading={loadState < fullyLoadedState} delay={0} />
    </div>
  )
}

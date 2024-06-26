import type { AppComponent } from '@/apps/types'

import React from 'react'

import * as THREE from 'three'
import WebGL from 'three/addons/capabilities/WebGL'
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { Sky } from 'three/addons/objects/Sky.js'

import * as objectUtils from '@/utils/objects'
import { LOCAL_STORAGE_KEYS } from '@/utils/constants'
import { ChunkManager } from '@/utils/Chunks'

import styles from '@/apps/StandardApp.module.scss'

export const displayName: string = 'Chunk Generation'

export const ChunkGenerationApp: AppComponent = (): React.ReactElement => {
  // const settings = React.useRef<{
  //   rotation: {
  //     speed: number
  //   }
  //   lights: {
  //     intensity: number
  //   }
  // }>({
  //   rotation: {
  //     speed: 0.01,
  //   },
  //   lights: {
  //     intensity: 25,
  //   },
  // })
  const statsPanel = React.useRef<{ value: number }>({ value: 0 })

  const webGLSupported = React.useRef<{ value: boolean }>({ value: true })

  const renderer = React.useRef<THREE.WebGLRenderer>()
  const rendererContainer = React.useRef<HTMLDivElement>(null)
  const rendererProperties = React.useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    sky: Sky
    ambientLight: THREE.AmbientLight
    objects: THREE.Object3D[]
    chunkManager: ChunkManager
    debugObjects: Record<string, THREE.Object3D>
    stats: Stats
  }>()

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

      // renderer.current.toneMapping = THREE.ACESFilmicToneMapping
      // renderer.current.toneMappingExposure = 0.5

      renderer.current.setClearColor(855309)

      rendererContainer.current.appendChild(renderer.current.domElement)
    }

    if (!rendererProperties.current) {
      const scene: THREE.Scene = new THREE.Scene()

      const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
        90,
        rendererContainer.current.clientWidth /
          rendererContainer.current.clientHeight,
        0.1,
        1000,
      )
      camera.position.set(0, 7, 0)
      // camera.lookAt(0, 0, 0)

      const chunkManager: ChunkManager = new ChunkManager({ scene, camera })

      scene.fog = new THREE.Fog(
        0x3d363f,
        1,
        chunkManager.options.MAX_CHUNKS_SQ_ROOT_HALF_FLOORED *
          chunkManager.options.CHUNK_SIZE,
      )

      const axesLines: THREE.AxesHelper =
        objectUtils.axesLines.createAxesLines()
      const grid: THREE.GridHelper = objectUtils.grid.createGrid()
      grid.material.blending = THREE.SubtractiveBlending

      const ambientLight: THREE.AmbientLight = new THREE.AmbientLight(
        0x444444,
        1,
      )
      scene.add(ambientLight)

      // 0x585857
      // 0x3d363f

      const hemiLight = new THREE.HemisphereLight(0x3d363f, 0x404040, 1)
      scene.add(hemiLight)

      // const dirLight = new THREE.DirectionalLight(0xfdc371, 1)
      // dirLight.position.set(0, 7, -200)
      // dirLight.target.position.set(0, 0, -100)

      // dirLight.castShadow = true
      // dirLight.shadow.mapSize.width = 8192 / 8
      // dirLight.shadow.mapSize.height = dirLight.shadow.mapSize.width
      // dirLight.shadow.radius = 2
      // dirLight.shadow.camera.left = -50
      // dirLight.shadow.camera.right = 50
      // dirLight.shadow.camera.top = 50
      // dirLight.shadow.camera.bottom = -50

      // scene.add(dirLight)

      // const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 5)
      // scene.add(dirLightHelper)

      const sky: Sky = new Sky()
      sky.scale.setScalar(Number.MAX_SAFE_INTEGER)

      const sunPosition = new THREE.Vector3().setFromSphericalCoords(
        1,
        THREE.MathUtils.degToRad(180),
        THREE.MathUtils.degToRad(180),
      )
      sky.material.uniforms.sunPosition.value = sunPosition

      scene.add(sky)

      rendererProperties.current = {
        scene,
        camera,
        sky,
        ambientLight,
        objects: [],
        chunkManager,
        debugObjects: { grid, axesLines },
        stats: new Stats(),
      }

      try {
        const statsPanelValue: unknown = JSON.parse(
          window.localStorage.getItem(LOCAL_STORAGE_KEYS.statsPanel) || '0',
        )

        if (typeof statsPanelValue === 'number') {
          statsPanel.current.value = statsPanelValue
          rendererProperties.current.stats.showPanel(statsPanelValue)
        }
      } catch {
        /* Empty */
      }

      rendererContainer.current.appendChild(
        rendererProperties.current.stats.dom,
      )

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

    const onResize: (ev: UIEvent) => void = (): void => {
      rendererProperties.current!.camera.aspect =
        rendererContainer.current!.clientWidth /
        rendererContainer.current!.clientHeight
      rendererProperties.current!.camera.updateProjectionMatrix()

      renderer.current?.setSize(
        rendererContainer.current!.clientWidth,
        rendererContainer.current!.clientHeight,
      )
    }
    window.addEventListener('resize', onResize)

    const heldKeys: Record<string, boolean> = {}

    const onKeyup: (ev: KeyboardEvent) => void = (ev: KeyboardEvent): void => {
      heldKeys[ev.key] = false
      heldKeys[ev.code] = false
    }
    window.addEventListener('keyup', onKeyup)

    const onKeydown: (ev: KeyboardEvent) => void = (
      ev: KeyboardEvent,
    ): void => {
      if (heldKeys[ev.key] || heldKeys[ev.code]) return

      switch (ev.key) {
        case 's':
          rendererProperties.current?.stats.showPanel(
            ++statsPanel.current.value % 4,
          )
          window.localStorage.setItem(
            LOCAL_STORAGE_KEYS.statsPanel,
            JSON.stringify(statsPanel.current.value % 4),
          )
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

      heldKeys[ev.key] = true
      heldKeys[ev.code] = true
    }
    window.addEventListener('keydown', onKeydown)

    const onMouseDown = (): void => {
      rendererContainer.current?.classList.add(styles.grabbing)
    }
    window.addEventListener('mousedown', onMouseDown)

    const onMouseUp = (): void => {
      rendererContainer.current?.classList.remove(styles.grabbing)
    }
    window.addEventListener('mouseup', onMouseUp)

    const animate: XRFrameRequestCallback = (): void => {
      rendererProperties.current?.stats.update()

      // rendererProperties.current?.camera.position.setX(
      //   rendererProperties.current?.camera.position.x - 4,
      // )

      rendererProperties.current?.camera.position.setZ(
        rendererProperties.current?.camera.position.z - 1,
      )

      rendererProperties.current?.chunkManager.poll()

      renderer.current!.render(
        rendererProperties.current!.scene,
        rendererProperties.current!.camera,
      )
    }
    renderer.current.setAnimationLoop(animate)

    const panel = new GUI({ autoPlace: true })

    // const speedFolder: GUI = panel.addFolder('Lights')
    // speedFolder
    //   .add(settings.current.lights, 'intensity', 0, 100, 0.1)
    //   .onChange((value: number): void => {
    //     for (const light of rendererProperties.current!.lights) {
    //       light.intensity = value
    //     }
    //   })

    return (): void => {
      panel.destroy()

      renderer.current!.setAnimationLoop(null)

      window.removeEventListener('resize', onResize)

      window.removeEventListener('keydown', onKeydown)
      window.removeEventListener('keyup', onKeyup)

      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div className={styles.app}>
      <div ref={rendererContainer} className={styles.container}></div>
    </div>
  )
}

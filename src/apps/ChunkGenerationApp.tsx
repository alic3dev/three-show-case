import type { AppComponent } from '@/apps/types'

import type { StatsRefObject } from '@/hooks/useStats'

import React from 'react'

import * as THREE from 'three'
import WebGL from 'three/addons/capabilities/WebGL'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { Sky } from 'three/addons/objects/Sky.js'

import { useStats } from '@/hooks/useStats'

import { ChunkManager } from '@/utils/Chunks'
import { EventsManager } from '@/utils/EventsManager'
import * as objectUtils from '@/utils/objects'

import styles from '@/apps/StandardApp.module.scss'

export const displayName: string = 'Chunk Generation'

export const ChunkGenerationApp: AppComponent = (): React.ReactElement => {
  const statsRef: StatsRefObject = useStats()

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

      const hemiLight = new THREE.HemisphereLight(0x3d363f, 0x404040, 1)
      scene.add(hemiLight)

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

    const eventsManager: EventsManager = new EventsManager()

    const heldKeys: Record<string, boolean> = {}

    const onKeyup: (ev: KeyboardEvent) => void = (ev: KeyboardEvent): void => {
      heldKeys[ev.key] = false
      heldKeys[ev.code] = false
    }
    eventsManager.addWindowEvent('keyup', onKeyup)

    const onKeydown: (ev: KeyboardEvent) => void = (
      ev: KeyboardEvent,
    ): void => {
      if (heldKeys[ev.key] || heldKeys[ev.code]) return

      switch (ev.key) {
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

      heldKeys[ev.key] = true
      heldKeys[ev.code] = true
    }
    eventsManager.addWindowEvent('keydown', onKeydown)

    const onMouseDown = (): void => {
      rendererContainer.current?.classList.add(styles.grabbing)
    }
    eventsManager.addWindowEvent('mousedown', onMouseDown)

    const onMouseUp = (): void => {
      rendererContainer.current?.classList.remove(styles.grabbing)
    }
    eventsManager.addWindowEvent('mouseup', onMouseUp)

    const animate: XRFrameRequestCallback = (): void => {
      statsRef.current.stats.update()

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

    const panel: GUI = new GUI({ autoPlace: true })

    return (): void => {
      panel.destroy()

      renderer.current!.setAnimationLoop(null)

      resizeObserver.disconnect()
      eventsManager.removeAllEvents()
    }
  }, [statsRef])

  return (
    <div className={styles.app}>
      <div ref={rendererContainer} className={styles.container}></div>
    </div>
  )
}

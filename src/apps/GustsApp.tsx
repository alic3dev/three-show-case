import type { AppComponent } from '@/apps/types'

import type { StatsRefObject } from '@/hooks/useStats'

import React from 'react'

import * as THREE from 'three'
import WebGL from 'three/addons/capabilities/WebGL.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { useStats } from '@/hooks/useStats'

import { EventsManager } from '@/utils/EventsManager'
import * as objectUtils from '@/utils/objects'

import styles from '@/apps/StandardApp.module.scss'

export const displayName: string = 'Gusts'

export const GustsApp: AppComponent = (): React.ReactElement => {
  const statsRef: StatsRefObject = useStats()

  const webGLSupported = React.useRef<{ value: boolean }>({ value: true })

  const renderer = React.useRef<THREE.WebGLRenderer>()
  const rendererContainer = React.useRef<HTMLDivElement>(null)
  const rendererProperties = React.useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    objects: Record<string, THREE.Object3D>
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

      rendererContainer.current.appendChild(renderer.current.domElement)
    }

    if (!rendererProperties.current) {
      const scene = new THREE.Scene()

      const pointLight = new THREE.PointLight(0xafcde2, 1, 0, 0.3)
      pointLight.position.set(0, 0, 1)
      pointLight.castShadow = true
      pointLight.receiveShadow = true
      scene.add(pointLight)

      const pointLightTwo = new THREE.PointLight(0xf4c2a6, 1, 0, 0.3)
      pointLightTwo.position.set(-3, 3, 1)
      pointLightTwo.castShadow = true
      pointLightTwo.receiveShadow = true
      scene.add(pointLightTwo)

      const pointLightThree = new THREE.PointLight(0xf89334, 1, 0, 0.3)
      pointLightThree.position.set(-3, -3, 1)
      pointLightThree.castShadow = true
      pointLightThree.receiveShadow = true
      scene.add(pointLightThree)

      const pointLightFour = new THREE.PointLight(0x42f8d2, 1, 0, 0.3)
      pointLightFour.position.set(3, -3, 1)
      pointLightFour.castShadow = true
      pointLightFour.receiveShadow = true
      scene.add(pointLightFour)

      const pointLightFive = new THREE.PointLight(0x31f9ac, 1, 0, 0.3)
      pointLightFive.position.set(3, 3, 1)
      pointLightFive.castShadow = true
      pointLightFive.receiveShadow = true
      scene.add(pointLightFive)

      const camera = new THREE.PerspectiveCamera(
        90,
        rendererContainer.current.clientWidth /
          rendererContainer.current.clientHeight,
        0.1,
        1000,
      )

      const controls = new OrbitControls(camera, renderer.current.domElement)
      controls.target.set(0, 0, 0)
      controls.update()

      const grid = objectUtils.grid.createGrid()
      const axesLines = objectUtils.axesLines.createAxesLines()

      const gustGeo = new THREE.TorusGeometry(1, 0.4, 12, 48, Math.PI * 2)
      const gustMat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
      })

      console.log(gustGeo.attributes)

      scene.add(new THREE.Mesh(gustGeo, gustMat))

      rendererProperties.current = {
        scene,
        camera,
        objects: {},
        debugObjects: { axesLines, grid },
      }

      rendererContainer.current.appendChild(statsRef.current.stats.dom)

      rendererProperties.current.camera.position.set(0, 2, 5)
      rendererProperties.current.camera.lookAt(0, 0, 0)

      for (const objectName in rendererProperties.current.debugObjects) {
        rendererProperties.current.scene.add(
          rendererProperties.current.debugObjects[objectName],
        )

        rendererProperties.current.debugObjects[objectName].visible = false
      }
    }

    const eventsManager = new EventsManager(rendererContainer.current)

    let resizeTimeoutHandle: number
    const onResize: () => void = (): void => {
      window.clearTimeout(resizeTimeoutHandle)
      resizeTimeoutHandle = window.setTimeout((): void => {
        rendererProperties.current!.camera.aspect =
          rendererContainer.current!.clientWidth /
          rendererContainer.current!.clientHeight
        rendererProperties.current!.camera.updateProjectionMatrix()

        renderer.current?.setSize(
          rendererContainer.current!.clientWidth,
          rendererContainer.current!.clientHeight,
        )
      }, 0)
    }

    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(rendererContainer.current)

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

    const animate: XRFrameRequestCallback = (): void => {
      statsRef.current.stats.update()

      renderer.current?.render(
        rendererProperties.current!.scene,
        rendererProperties.current!.camera,
      )
    }
    renderer.current.setAnimationLoop(animate)

    return (): void => {
      renderer.current?.setAnimationLoop(null)

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

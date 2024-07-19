import type { AppComponent } from '@/apps/types'

import React from 'react'

import * as THREE from 'three'
import WebGL from 'three/addons/capabilities/WebGL.js'
import { Stats } from '@/utils/stats'

import { LOCAL_STORAGE_KEYS } from '@/utils/constants'

import styles from '@/apps/StandardApp.module.scss'
import { EventsManager } from '@/utils/EventsManager'

export const displayName: string = 'Basic Cube'

export const BasicCube: AppComponent = (): React.ReactElement => {
  const statsPanel = React.useRef<{ value: number }>({ value: 0 })

  const webGLSupported = React.useRef<{ value: boolean }>({ value: true })

  const renderer = React.useRef<THREE.WebGLRenderer>()
  const rendererContainer = React.useRef<HTMLDivElement>(null)
  const rendererProperties = React.useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    objects: Record<string, THREE.Object3D>
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

      rendererContainer.current.appendChild(renderer.current.domElement)
    }

    if (!rendererProperties.current) {
      const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1)
      const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
      })
      const cube: THREE.Mesh = new THREE.Mesh(geometry, material)

      const xMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
        color: 0xff0000,
      })
      const yMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff00,
      })
      const zMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
        color: 0x0000ff,
      })

      const xPoints: THREE.Vector3[] = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 0, 0),
      ]
      const yPoints: THREE.Vector3[] = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 1, 0),
      ]
      const zPoints: THREE.Vector3[] = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 1),
      ]

      const xGeometry: THREE.BufferGeometry =
        new THREE.BufferGeometry().setFromPoints(xPoints)
      const yGeometry: THREE.BufferGeometry =
        new THREE.BufferGeometry().setFromPoints(yPoints)
      const zGeometry: THREE.BufferGeometry =
        new THREE.BufferGeometry().setFromPoints(zPoints)

      const xLine: THREE.Line = new THREE.Line(xGeometry, xMaterial)
      const yLine: THREE.Line = new THREE.Line(yGeometry, yMaterial)
      const zLine: THREE.Line = new THREE.Line(zGeometry, zMaterial)

      const grid = new THREE.GridHelper(100, 100, 0x666666, 0x333333)

      rendererProperties.current = {
        scene: new THREE.Scene(),
        camera: new THREE.PerspectiveCamera(
          90,
          rendererContainer.current.clientWidth /
            rendererContainer.current.clientHeight,
          0.1,
          1000,
        ),
        stats: new Stats(),
        objects: { cube, xLine, yLine, zLine, grid },
      }

      try {
        const statsPanelValue = JSON.parse(
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

      rendererProperties.current.camera.position.set(0, 2, 5)
      rendererProperties.current.camera.lookAt(0, 0, 0)

      for (const objectName in rendererProperties.current.objects) {
        rendererProperties.current.scene.add(
          rendererProperties.current.objects[objectName],
        )
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
          rendererProperties.current?.stats.showPanel(
            ++statsPanel.current.value % 4,
          )
          window.localStorage.setItem(
            LOCAL_STORAGE_KEYS.statsPanel,
            JSON.stringify(statsPanel.current.value % 4),
          )
          break
        case 'g':
          rendererProperties.current!.objects.grid.visible =
            !rendererProperties.current!.objects.grid.visible
          break
        case 'l':
          rendererProperties.current!.objects.xLine.visible =
            !rendererProperties.current!.objects.xLine.visible
          rendererProperties.current!.objects.yLine.visible =
            !rendererProperties.current!.objects.yLine.visible
          rendererProperties.current!.objects.zLine.visible =
            !rendererProperties.current!.objects.zLine.visible
          break
        default:
          break
      }

      heldKeys[ev.key] = true
      heldKeys[ev.code] = true
    }
    eventsManager.addWindowEvent('keydown', onKeydown)

    const animate: XRFrameRequestCallback = (
      time: DOMHighResTimeStamp,
    ): void => {
      rendererProperties.current?.stats.update()

      const posVal: number = Math.sin(((time / 3000) * Math.PI) / 2) * 3
      rendererProperties.current!.camera.position.x = posVal

      rendererProperties.current!.camera.lookAt(0, 0, 0)

      rendererProperties.current!.objects.cube.rotation.x += 0.01
      rendererProperties.current!.objects.cube.rotation.y += 0.01

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
  }, [])

  return (
    <div className={styles.app}>
      <div ref={rendererContainer} className={styles.container}></div>
    </div>
  )
}

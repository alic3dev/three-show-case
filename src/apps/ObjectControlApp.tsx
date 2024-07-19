import type { AppComponent } from '@/apps/types'

import React from 'react'

import * as THREE from 'three'
import WebGL from 'three/addons/capabilities/WebGL'
import { Stats } from '@/utils/stats'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'

import { LOCAL_STORAGE_KEYS } from '@/utils/constants'

import styles from '@/apps/StandardApp.module.scss'
import { EventsManager } from '@/utils/EventsManager'

export const displayName: string = 'Controlling an Object'

export const ObjectControlApp: AppComponent = (): React.ReactElement => {
  const settings = React.useRef<{
    speed: { cube: number; camera: number }
  }>({
    speed: { cube: 0.2, camera: 0.01 },
  })
  const statsPanel = React.useRef<{ value: number }>({ value: 0 })

  const [heldKeys, _setHeldKeys] = React.useState<Record<string, number>>({})
  const heldKeysRef = React.useRef<{ value: Record<string, number> }>({
    value: {},
  })
  const setHeldKeys = (
    action:
      | Record<string, number>
      | ((prevHeldKeys: Record<string, number>) => Record<string, number>),
  ) => {
    if (typeof action === 'function') {
      _setHeldKeys(
        (prevHeldKeys: Record<string, number>): Record<string, number> => {
          const newHeldKeys: Record<string, number> = action(prevHeldKeys)

          heldKeysRef.current.value = newHeldKeys

          return newHeldKeys
        },
      )
    } else {
      _setHeldKeys(action)
    }
  }

  const webGLSupported = React.useRef<{ value: boolean }>({ value: true })

  const renderer = React.useRef<THREE.WebGLRenderer>()
  const rendererContainer = React.useRef<HTMLDivElement>(null)
  const rendererProperties = React.useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    stats: Stats
    objects: Record<string, THREE.Object3D>
    ambientLight: THREE.AmbientLight
    pointLights: THREE.PointLight[]
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

      renderer.current.setClearColor(0x0d0d0d)

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
      camera.position.set(0, 3, 10)
      camera.lookAt(0, 3, 0)

      const matFloor: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial({
        color: 0x808080,
      })
      const geoFloor: THREE.PlaneGeometry = new THREE.PlaneGeometry(100, 100)
      const mshFloor: THREE.Mesh = new THREE.Mesh(geoFloor, matFloor)
      mshFloor.rotation.x = -Math.PI * 0.5
      mshFloor.position.set(0, 0, 0)

      const cubeGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1)
      const cubeMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial(
        {
          color: 0x808080,
        },
      )

      const cube: THREE.Mesh = new THREE.Mesh(cubeGeometry, cubeMaterial)
      cube.position.set(-3, 0.5, -3)

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

      const grid: THREE.GridHelper = new THREE.GridHelper(
        100,
        100,
        0x666666,
        0x333333,
      )
      grid.position.y = 0.01

      const ambientLight: THREE.AmbientLight = new THREE.AmbientLight(0x444444)

      const pointLights: THREE.PointLight[] = []
      for (let x = 0; x < 3; x++) {
        for (let z = 0; z < 3; z++) {
          const lightColor = Math.floor(Math.random() * 0x000066 + 0xaaaa99)
          const pointLight = new THREE.PointLight(lightColor, 100)
          pointLight.position.set(
            x === 0 ? 0 : x === 1 ? -30 : 30,
            5,
            z === 0 ? 0 : z === 1 ? -30 : 30,
          )

          pointLight.castShadow = true
          pointLight.receiveShadow = true

          pointLights.push(pointLight)
        }
      }

      rendererProperties.current = {
        scene,
        camera,
        stats: new Stats(),
        objects: { mshFloor, cube, grid, xLine, yLine, zLine },
        ambientLight,
        pointLights,
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

      scene.add(ambientLight)
      scene.add(...rendererProperties.current.pointLights)

      for (const objectName in rendererProperties.current.objects) {
        scene.add(rendererProperties.current.objects[objectName])

        rendererProperties.current.objects[objectName].castShadow = true
        rendererProperties.current.objects[objectName].receiveShadow = true
      }

      rendererProperties.current!.objects.xLine.castShadow = false
      rendererProperties.current!.objects.xLine.receiveShadow = false
      rendererProperties.current!.objects.yLine.castShadow = false
      rendererProperties.current!.objects.yLine.receiveShadow = false
      rendererProperties.current!.objects.zLine.castShadow = false
      rendererProperties.current!.objects.zLine.receiveShadow = false

      rendererProperties.current!.objects.grid.visible = false
      rendererProperties.current!.objects.xLine.visible = false
      rendererProperties.current!.objects.yLine.visible = false
      rendererProperties.current!.objects.zLine.visible = false
    }

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

    const animate: XRFrameRequestCallback = (
      time: DOMHighResTimeStamp,
    ): void => {
      rendererProperties.current?.stats.update()

      const posXVal: number =
        Math.sin(
          ((time / (5000 * (0.01 / settings.current.speed.camera))) * Math.PI) /
            2,
        ) * 3
      rendererProperties.current!.camera.position.x = posXVal
      const posYVal: number =
        Math.sin(
          ((time / (7000 * (0.01 / settings.current.speed.camera))) * Math.PI) /
            2,
        ) * 2
      rendererProperties.current!.camera.position.y = posYVal + 4
      rendererProperties.current!.camera.lookAt(0, 3, 0)

      if (
        heldKeysRef.current.value.ArrowUp ||
        heldKeysRef.current.value.w ||
        heldKeysRef.current.value[`customKey:up`]
      ) {
        rendererProperties.current!.objects.cube.translateZ(
          -settings.current.speed.cube,
        )
      }
      if (
        heldKeysRef.current.value.ArrowDown ||
        heldKeysRef.current.value.s ||
        heldKeysRef.current.value[`customKey:down`]
      ) {
        rendererProperties.current!.objects.cube.translateZ(
          settings.current.speed.cube,
        )
      }
      if (
        heldKeysRef.current.value.ArrowLeft ||
        heldKeysRef.current.value.a ||
        heldKeysRef.current.value[`customKey:left`]
      ) {
        rendererProperties.current!.objects.cube.translateX(
          -settings.current.speed.cube,
        )
      }
      if (
        heldKeysRef.current.value.ArrowRight ||
        heldKeysRef.current.value.d ||
        heldKeysRef.current.value[`customKey:right`]
      ) {
        rendererProperties.current!.objects.cube.translateX(
          settings.current.speed.cube,
        )
      }

      renderer.current!.render(
        rendererProperties.current!.scene,
        rendererProperties.current!.camera,
      )
    }
    renderer.current.setAnimationLoop(animate)

    const panel = new GUI({ autoPlace: true })
    const speedFolder = panel.addFolder('Speed')
    speedFolder.add(settings.current.speed, 'cube', 0.0, 1, 0.001)
    speedFolder.add(settings.current.speed, 'camera', 0.0, 0.1, 0.0001)

    return (): void => {
      panel.destroy()

      renderer.current!.setAnimationLoop(null)

      resizeObserver.disconnect()
    }
  }, [])

  React.useEffect((): (() => void) | void => {
    const eventsManager: EventsManager = new EventsManager()

    const onKeyup: (ev: KeyboardEvent) => void = (ev: KeyboardEvent): void => {
      setHeldKeys(
        (prevHeldKeys: Record<string, number>): Record<string, number> => ({
          ...prevHeldKeys,
          [ev.key]: 0,
          [ev.code]: 0,
        }),
      )
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

      setHeldKeys(
        (prevHeldKeys: Record<string, number>): Record<string, number> => {
          const time: number = performance.now()

          return {
            ...prevHeldKeys,
            [ev.key]: time,
            [ev.code]: time,
          }
        },
      )
    }
    eventsManager.addWindowEvent('keydown', onKeydown)

    return (): void => {
      eventsManager.removeAllEvents()
    }
  }, [heldKeys])

  const onMouseDownMovement =
    (direction: 'up' | 'down' | 'left' | 'right'): (() => void) =>
    (): void => {
      setHeldKeys(
        (prevHeldKeys: Record<string, number>): Record<string, number> => ({
          ...prevHeldKeys,
          [`customKey:${direction}`]: performance.now(),
        }),
      )
    }

  const onMouseUpMovement =
    (direction: 'up' | 'down' | 'left' | 'right'): (() => void) =>
    (): void => {
      setHeldKeys(
        (prevHeldKeys: Record<string, number>): Record<string, number> => ({
          ...prevHeldKeys,
          [`customKey:${direction}`]: 0,
        }),
      )
    }

  return (
    <div className={styles.app}>
      <div ref={rendererContainer} className={styles.container}></div>

      <div className={styles.controls}>
        <div className={styles.spacer} />
        <button
          className={`${styles.control} ${
            heldKeys.ArrowUp || heldKeys.w || heldKeys['customKey:up']
              ? styles.held
              : ''
          }`}
          onTouchStart={onMouseDownMovement('up')}
          onTouchEnd={onMouseUpMovement('up')}
          onMouseDown={onMouseDownMovement('up')}
          onMouseUp={onMouseUpMovement('up')}
          onMouseLeave={onMouseUpMovement('up')}
        >
          △
        </button>
        <div className={styles.spacer} />
        <button
          className={`${styles.control} ${
            heldKeys.ArrowLeft || heldKeys.a || heldKeys['customKey:left']
              ? styles.held
              : ''
          }`}
          onTouchStart={onMouseDownMovement('left')}
          onTouchEnd={onMouseUpMovement('left')}
          onMouseDown={onMouseDownMovement('left')}
          onMouseUp={onMouseUpMovement('left')}
          onMouseLeave={onMouseUpMovement('left')}
        >
          ◁
        </button>
        <button
          className={`${styles.control} ${
            heldKeys.ArrowDown || heldKeys.s || heldKeys['customKey:down']
              ? styles.held
              : ''
          }`}
          onTouchStart={onMouseDownMovement('down')}
          onTouchEnd={onMouseUpMovement('down')}
          onMouseDown={onMouseDownMovement('down')}
          onMouseUp={onMouseUpMovement('down')}
          onMouseLeave={onMouseUpMovement('down')}
        >
          ▽
        </button>
        <button
          className={`${styles.control} ${
            heldKeys.ArrowRight || heldKeys.d || heldKeys['customKey:right']
              ? styles.held
              : ''
          }`}
          onTouchStart={onMouseDownMovement('right')}
          onTouchEnd={onMouseUpMovement('right')}
          onMouseDown={onMouseDownMovement('right')}
          onMouseUp={onMouseUpMovement('right')}
          onMouseLeave={onMouseUpMovement('right')}
        >
          ▷
        </button>
      </div>
    </div>
  )
}

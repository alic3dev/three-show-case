import type { AppComponent } from '@/apps/types'

import type { StatsRefObject } from '@/hooks/useStats'

import React from 'react'

import * as THREE from 'three'
import WebGL from 'three/addons/capabilities/WebGL'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { useStats } from '@/hooks/useStats'

import { EventsManager } from '@/utils/EventsManager'
import { GUI } from '@/utils/helpers/gui'
import { rotateAboutPoint } from '@/utils/rotateAboutPoint'

import styles from '@/apps/StandardAppWithGrab.module.scss'

export const displayName: string = 'Draggable Camera'

export const DraggableCameraApp: AppComponent = (): React.ReactElement => {
  const settings = React.useRef<{
    speed: { cube: number; pointLights: number }
  }>({
    speed: { cube: 0.01, pointLights: 0.01 },
  })
  const statsRef: StatsRefObject = useStats()

  const webGLSupported = React.useRef<{ value: boolean }>({ value: true })

  const renderer = React.useRef<THREE.WebGLRenderer>()
  const rendererContainer = React.useRef<HTMLDivElement>(null)
  const rendererProperties = React.useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    objects: Record<string, THREE.Object3D>
    ambientLight: THREE.AmbientLight
    pointLights: THREE.PointLight[]
  }>()

  React.useEffect((): (() => void) | void => {
    if (!webGLSupported.current.value || !rendererContainer.current) return

    if (!WebGL.isWebGL2Available()) {
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
      const matFloor = new THREE.MeshPhongMaterial({ color: 0x808080 })
      const geoFloor = new THREE.PlaneGeometry(100, 100)
      const mshFloor = new THREE.Mesh(geoFloor, matFloor)
      mshFloor.rotation.x = -Math.PI * 0.5
      mshFloor.position.set(0, -0.05, 0)

      const cubeGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1)
      const cubeMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial(
        {
          color: 0x808080,
        },
      )
      const cube: THREE.Mesh = new THREE.Mesh(cubeGeometry, cubeMaterial)
      cube.position.set(0, 3, 0)

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

      const ambientLight = new THREE.AmbientLight(0x444444)

      const pointLightOne = new THREE.PointLight(0x00ff00, 10)
      pointLightOne.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
        ),
      )
      pointLightOne.position.set(0, 5, 0)

      const pointLightTwo = new THREE.PointLight(0x0000ff, 10)
      pointLightTwo.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0x0000ff }),
        ),
      )
      pointLightTwo.position.set(0, 3, -2)

      const pointLightThree = new THREE.PointLight(0x0000ff, 10)
      pointLightThree.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0x0000ff }),
        ),
      )
      pointLightThree.position.set(0, 3, 2)

      const pointLightFour = new THREE.PointLight(0xff0000, 10)
      pointLightFour.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0xff0000 }),
        ),
      )
      pointLightFour.position.set(2, 3, 0)

      const pointLightFive = new THREE.PointLight(0xff0000, 10)
      pointLightFive.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0xff0000 }),
        ),
      )
      pointLightFive.position.set(-2, 3, 0)

      const pointLightSix = new THREE.PointLight(0x00ff00, 10)
      pointLightSix.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
        ),
      )
      pointLightSix.position.set(0, 1, 0)

      rendererProperties.current = {
        scene: new THREE.Scene(),
        camera: new THREE.PerspectiveCamera(
          90,
          rendererContainer.current.clientWidth /
            rendererContainer.current.clientHeight,
          0.1,
          1000,
        ),
        objects: { mshFloor, cube, grid, xLine, yLine, zLine },
        ambientLight,
        pointLights: [
          pointLightOne,
          pointLightTwo,
          pointLightThree,
          pointLightFour,
          pointLightFive,
          pointLightSix,
        ],
      }

      rendererProperties.current.camera.position.set(2, 5, 5)
      rendererProperties.current.camera.lookAt(0, 3, 0)

      const controls = new OrbitControls(
        rendererProperties.current.camera,
        renderer.current.domElement,
      )
      controls.target.set(0, 3, 0)
      controls.update()

      rendererContainer.current.appendChild(statsRef.current.stats.dom)

      for (const pointLight of rendererProperties.current.pointLights) {
        pointLight.castShadow = true
        pointLight.receiveShadow = true

        rendererProperties.current.scene.add(pointLight)
      }

      rendererProperties.current.scene.add(ambientLight)

      for (const objectName in rendererProperties.current.objects) {
        rendererProperties.current.scene.add(
          rendererProperties.current.objects[objectName],
        )

        rendererProperties.current.objects[objectName].castShadow = true
        rendererProperties.current.objects[objectName].receiveShadow = true
      }

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

    const eventsManager = new EventsManager(rendererContainer.current)

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

    const onMouseDown = () => {
      rendererContainer.current?.classList.add(styles.grabbing)
    }
    eventsManager.addWindowEvent('mousedown', onMouseDown)

    const onMouseUp = () => {
      rendererContainer.current?.classList.remove(styles.grabbing)
    }
    eventsManager.addWindowEvent('mouseup', onMouseUp)

    const animate: XRFrameRequestCallback = (): void => {
      statsRef.current.stats.update()

      rendererProperties.current!.objects.cube.rotation.x +=
        settings.current.speed.cube
      rendererProperties.current!.objects.cube.rotation.y +=
        settings.current.speed.cube

      for (const pointLight of rendererProperties.current!.pointLights) {
        const point: THREE.Vector3 = new THREE.Vector3(0, 3, 0)

        rotateAboutPoint({
          object3D: pointLight,
          point,
          axis: new THREE.Vector3(0, 1, 0),
          theta: settings.current.speed.pointLights,
        })

        rotateAboutPoint({
          object3D: pointLight,
          point,
          axis: new THREE.Vector3(1, 0, 0),
          theta: settings.current.speed.pointLights,
        })

        rotateAboutPoint({
          object3D: pointLight,
          point,
          axis: new THREE.Vector3(0, 0, 1),
          theta: settings.current.speed.pointLights,
        })
      }

      renderer.current!.render(
        rendererProperties.current!.scene,
        rendererProperties.current!.camera,
      )
    }
    renderer.current.setAnimationLoop(animate)

    const panel = new GUI({ autoPlace: true })
    const speedFolder = panel.addFolder('Speed')
    speedFolder.add(settings.current.speed, 'cube', 0.0, 0.1, 0.0001)
    speedFolder.add(settings.current.speed, 'pointLights', 0.0, 0.1, 0.0001)

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

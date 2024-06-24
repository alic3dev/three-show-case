import type { AppComponent } from '@/apps/types'

import React from 'react'

import * as THREE from 'three'
import WebGL from 'three/addons/capabilities/WebGL'
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { LOCAL_STORAGE_KEYS } from '@/utils/constants'
import { rotateAboutPoint } from '@/utils/rotateAboutPoint'

import styles from '@/apps/StandardAppWithGrab.module.scss'

export const displayName: string = 'Light Tricks'

export const LightTricksApp: AppComponent = (): React.ReactElement => {
  const settings = React.useRef<{
    rotation: {
      speed: number
    }
    lights: {
      intensity: number
    }
  }>({
    rotation: {
      speed: 0.01,
    },
    lights: {
      intensity: 25,
    },
  })
  const statsPanel = React.useRef<{ value: number }>({ value: 0 })

  const webGLSupported = React.useRef<{ value: boolean }>({ value: true })

  const renderer = React.useRef<THREE.WebGLRenderer>()
  const rendererContainer = React.useRef<HTMLDivElement>(null)
  const rendererProperties = React.useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    controls: OrbitControls
    stats: Stats
    objects: Record<string, THREE.Object3D>
    ambientLight: THREE.AmbientLight
    lights: THREE.Light[]
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
      camera.position.set(4, 7, 2)

      const controls: OrbitControls = new OrbitControls(
        camera,
        renderer.current.domElement,
      )
      controls.target.set(0, 5, 0)
      controls.autoRotate = true
      controls.autoRotateSpeed = 4
      controls.saveState()
      controls.update()

      const matWalls: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial({
        color: 8421504,
      })

      const ceiling: THREE.Mesh = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.01, 10, 1, 1, 1),
        matWalls,
      )
      ceiling.position.set(0, 10, 0)

      const northWall: THREE.Mesh = new THREE.Mesh(
        new THREE.BoxGeometry(10, 10, 0.01, 1, 1, 1),
        matWalls,
      )
      northWall.position.set(0, 5, 5)

      const eastWall: THREE.Mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 10, 10, 1, 1, 1),
        matWalls,
      )
      eastWall.position.set(-5, 5, 0)

      const westWall: THREE.Mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 10, 10, 1, 1, 1),
        matWalls,
      )
      westWall.position.set(5, 5, 0)

      const southWall: THREE.Mesh = new THREE.Mesh(
        new THREE.BoxGeometry(10, 10, 0.01, 1, 1, 1),
        matWalls,
      )
      southWall.position.set(0, 5, -5)

      const floor: THREE.Mesh = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.01, 10, 1, 1, 1),
        matWalls,
      )
      floor.position.set(0, 0, 0)

      const walls: THREE.Group = new THREE.Group()
      walls.add(ceiling)
      walls.add(northWall)
      walls.add(eastWall)
      walls.add(westWall)
      walls.add(southWall)
      walls.add(floor)

      const xMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
        color: 16711680,
      })
      const yMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
        color: 65280,
      })
      const zMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
        color: 255,
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
        6710886,
        3355443,
      )

      const ambientLight: THREE.AmbientLight = new THREE.AmbientLight(
        4473924,
        1,
      )

      const lights: THREE.Light[] = []

      const lightObjectMesh: THREE.Mesh = new THREE.Mesh(
        new THREE.TorusKnotGeometry(1, 0.2),
        new THREE.MeshPhongMaterial({
          color: 2105376,
          emissive: 65793,
          // transparent: true,
          // opacity: 0.25,
        }),
      )
      lightObjectMesh.castShadow = true
      lightObjectMesh.receiveShadow = true

      const lightSphereOpacity: number = 10

      const pointLight: THREE.PointLight = new THREE.PointLight(
        7284220,
        settings.current.lights.intensity,
        0,
        2,
      )
      pointLight.add(lightObjectMesh)
      pointLight.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 16, 16),
          new THREE.MeshPhongMaterial({
            color: 7284220,
            emissive: 7284220,
            transparent: true,
            opacity: lightSphereOpacity,
          }),
        ),
      )
      pointLight.position.set(0, 5, 0)

      const pointLightTwo: THREE.PointLight = new THREE.PointLight(
        1402846,
        settings.current.lights.intensity,
        0,
        2,
      )
      pointLightTwo.add(lightObjectMesh.clone())
      pointLightTwo.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 16, 16),
          new THREE.MeshPhongMaterial({
            color: 1402846,
            emissive: 1402846,
            transparent: true,
            opacity: lightSphereOpacity,
          }),
        ),
      )
      pointLightTwo.position.set(1, 6, 2)
      pointLightTwo.rotation.x = 0.32
      pointLightTwo.rotation.y = 0.62

      const pointLightThree: THREE.PointLight = new THREE.PointLight(
        3523494,
        settings.current.lights.intensity,
        0,
        2,
      )
      pointLightThree.add(lightObjectMesh.clone())
      pointLightThree.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 16, 16),
          new THREE.MeshPhongMaterial({
            color: 3523494,
            emissive: 3523494,
            transparent: true,
            opacity: lightSphereOpacity,
          }),
        ),
      )
      pointLightThree.position.set(3, 3, -1)
      pointLightThree.rotation.x = 0.73
      pointLightThree.rotation.y = 0.25

      lights.push(pointLight, pointLightTwo, pointLightThree)

      rendererProperties.current = {
        scene,
        camera,
        controls,
        stats: new Stats(),
        objects: { walls, grid, xLine, yLine, zLine },
        ambientLight,
        lights,
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

      for (const objectName in rendererProperties.current.objects) {
        rendererProperties.current.scene.add(
          rendererProperties.current.objects[objectName],
        )

        rendererProperties.current.objects[objectName].castShadow = true
        rendererProperties.current.objects[objectName].receiveShadow = true

        const subObjects: THREE.Object3D[] =
          rendererProperties.current.objects[objectName].children

        for (const subObject of subObjects) {
          subObject.castShadow = true
          subObject.receiveShadow = true
        }
      }

      scene.add(ambientLight)

      for (const light of lights) {
        light.castShadow = true
        light.receiveShadow = true

        if (light.shadow) {
          light.shadow.mapSize.width = 8192 / 8
          light.shadow.mapSize.height = light.shadow.mapSize.width
          light.shadow.radius = 2
        }

        scene.add(light)
      }

      rendererProperties.current!.objects.grid.visible = false
      rendererProperties.current!.objects.xLine.visible = false
      rendererProperties.current!.objects.yLine.visible = false
      rendererProperties.current!.objects.zLine.visible = false
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
    window.addEventListener('keydown', onKeydown)

    const onMouseDown = (): void => {
      rendererContainer.current?.classList.add(styles.grabbing)
    }
    window.addEventListener('mousedown', onMouseDown)

    const onMouseUp = (): void => {
      rendererContainer.current?.classList.remove(styles.grabbing)
    }
    window.addEventListener('mouseup', onMouseUp)

    const point: THREE.Vector3 = new THREE.Vector3(0, 5, 0)
    const xAxis: THREE.Vector3 = new THREE.Vector3(1, 0, 0)
    const yAxis: THREE.Vector3 = new THREE.Vector3(0, 1, 0)
    const zAxis: THREE.Vector3 = new THREE.Vector3(0, 0, 1)

    const clock: THREE.Clock = new THREE.Clock()
    const animate: XRFrameRequestCallback = (): void => {
      rendererProperties.current?.stats.update()

      const delta: number = clock.getDelta()

      rendererProperties.current!.controls.update(delta)

      const rotationAmount: number =
        (delta / (1 / 60)) * settings.current.rotation.speed

      for (
        let i: number = 0;
        i < rendererProperties.current!.lights.length;
        i++
      ) {
        const light: THREE.Light = rendererProperties.current!.lights[i]

        light.rotation.x += rotationAmount
        light.rotation.y += rotationAmount

        rotateAboutPoint({
          object3D: light,
          point,
          axis: xAxis,
          theta: rotationAmount / 4,
        })

        rotateAboutPoint({
          object3D: light,
          point,
          axis: yAxis,
          theta: rotationAmount,
        })

        rotateAboutPoint({
          object3D: light,
          point,
          axis: zAxis,
          theta: rotationAmount / 2.3,
        })
      }

      renderer.current!.render(
        rendererProperties.current!.scene,
        rendererProperties.current!.camera,
      )
    }
    renderer.current.setAnimationLoop(animate)

    const panel = new GUI({ autoPlace: true })

    const rotationFolder: GUI = panel.addFolder('Rotation')
    rotationFolder.add(settings.current.rotation, 'speed', -0.1, 0.1, 0.0025)

    const speedFolder: GUI = panel.addFolder('Lights')
    speedFolder
      .add(settings.current.lights, 'intensity', 0, 100, 0.1)
      .onChange((value: number): void => {
        for (const light of rendererProperties.current!.lights) {
          light.intensity = value
        }
      })

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

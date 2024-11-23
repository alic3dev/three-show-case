import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'

import type { AppComponent } from '@/apps/types'

import type { StatsRefObject } from '@/hooks/useStats'

import type { PolyHavenTextureResult } from '@/utils/polyHavenLoader'

import React from 'react'

import * as THREE from 'three'
import WebGL from 'three/addons/capabilities/WebGL'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

import { LoadingScreen } from '@/components/LoadingScreen'

import { useStats } from '@/hooks/useStats'

import { EventsManager } from '@/utils/EventsManager'
import { GUI } from '@/utils/helpers/gui'
import * as objectUtils from '@/utils/objects'
import { loadPolyHavenTexture } from '@/utils/polyHavenLoader'
import { resolveAsset } from '@/utils/resolveAsset'

import styles from '@/apps/StandardApp.module.scss'

export const displayName: string = 'House'

export const HouseApp: AppComponent = (): React.ReactElement => {
  const statsRef: StatsRefObject = useStats()

  const webGLSupported = React.useRef<{ value: boolean }>({ value: true })

  const renderer = React.useRef<THREE.WebGLRenderer>()
  const rendererContainer = React.useRef<HTMLDivElement>(null)
  const rendererProperties = React.useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    ambientLight: THREE.AmbientLight
    debugObjects: Record<string, THREE.Object3D>
  }>()

  const [loadState, setLoadState] = React.useState<number>(0)
  const incrementLoadState = (): void => {
    setLoadState((prevLoadState: number): number => prevLoadState + 1)
  }

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

      renderer.current.toneMapping = THREE.ACESFilmicToneMapping
      // renderer.current.toneMappingExposure = 0.2

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
        2000,
      )
      camera.position.set(0, 20, 4)
      camera.lookAt(0, 20, 0)

      const controls = new OrbitControls(camera, renderer.current.domElement)
      controls.minDistance = 2
      controls.maxDistance = 10
      controls.target.set(0, 20, 0)
      controls.update()

      const axesLines: THREE.AxesHelper =
        objectUtils.axesLines.createAxesLines()
      const grid: THREE.GridHelper = objectUtils.grid.createGrid()
      grid.material.blending = THREE.SubtractiveBlending

      const ambientLight: THREE.AmbientLight = new THREE.AmbientLight(
        0xffffff,
        1,
      )
      // scene.add(ambientLight)

      const pointLight = new THREE.PointLight(0xffffff, 1000)
      pointLight.position.set(10, 20, -30)

      scene.add(pointLight)

      const pointLightTwo = new THREE.PointLight(0xffffff, 10)
      pointLightTwo.position.set(0, 2, 0)

      scene.add(pointLightTwo)

      new RGBELoader().load(
        resolveAsset('hdr/lilienstein_4k.hdr'),
        (texture: THREE.DataTexture): void => {
          texture.mapping = THREE.EquirectangularReflectionMapping

          scene.background = texture

          incrementLoadState()
        },
      )

      const floorGeometry = new THREE.BoxGeometry(100, 1, 100)
      const floorMaterial = new THREE.MeshPhongMaterial({
        ...loadPolyHavenTexture({
          name: 'dark_wooden_planks',
          ambient: 'arm',
          repeats: 10,
          incrementLoadState,
        }),
      })

      const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial)
      floorMesh.receiveShadow = true

      scene.add(floorMesh)

      const wallMaterialTextures: PolyHavenTextureResult = loadPolyHavenTexture(
        {
          name: 'beige_wall_001',
          incrementLoadState,
        },
      )

      const wallGeometry = new THREE.BoxGeometry(1, 50, 100)
      const wallMaterial = new THREE.MeshPhongMaterial({
        ...wallMaterialTextures,
      })

      const wallEastMesh = new THREE.Mesh(wallGeometry, wallMaterial)
      wallEastMesh.receiveShadow = true

      wallEastMesh.position.set(50, 25, 0)

      scene.add(wallEastMesh)

      const wallWestMesh = new THREE.Mesh(wallGeometry, wallMaterial)
      wallWestMesh.receiveShadow = true

      wallWestMesh.position.set(-50, 25, 0)

      scene.add(wallWestMesh)

      const ceilingGeometry = new THREE.BoxGeometry(100, 1, 100)
      const ceilingMesh = new THREE.Mesh(ceilingGeometry, wallMaterial)
      ceilingMesh.receiveShadow = true

      ceilingMesh.position.set(0, 50, 0)

      scene.add(ceilingMesh)

      const wallWithWindowsGeometry = new THREE.BufferGeometry()
      wallWithWindowsGeometry.setFromPoints([
        new THREE.Vector3(-50, 0, 0),
        new THREE.Vector3(-50, 0, 1),
        new THREE.Vector3(-50, 50, 1),

        new THREE.Vector3(-50, 50, 1),
        new THREE.Vector3(-50, 50, 0),
        new THREE.Vector3(-50, 0, 0),

        new THREE.Vector3(-50, 0, 0),
        new THREE.Vector3(50, 0, 0),
        new THREE.Vector3(50, 0, 1),

        new THREE.Vector3(50, 0, 1),
        new THREE.Vector3(-50, 0, 1),
        new THREE.Vector3(-50, 0, 0),

        new THREE.Vector3(-50, 50, 0),
        new THREE.Vector3(-50, 50, 1),
        new THREE.Vector3(50, 50, 1),

        new THREE.Vector3(50, 50, 1),
        new THREE.Vector3(50, 50, 0),
        new THREE.Vector3(-50, 50, 0),

        new THREE.Vector3(50, 0, 0),
        new THREE.Vector3(50, 0, 1),
        new THREE.Vector3(50, 50, 1),

        new THREE.Vector3(50, 50, 1),
        new THREE.Vector3(50, 50, 0),
        new THREE.Vector3(50, 0, 0),

        new THREE.Vector3(-50, 0, 1),
        new THREE.Vector3(-50, 50, 1),
        new THREE.Vector3(50, 50, 1),

        new THREE.Vector3(50, 50, 1),
        new THREE.Vector3(50, 0, 1),
        new THREE.Vector3(-50, 0, 1),

        new THREE.Vector3(-50, 0, 0),
        new THREE.Vector3(-50, 50, 0),
        new THREE.Vector3(50, 50, 0),

        new THREE.Vector3(50, 50, 0),
        new THREE.Vector3(50, 0, 0),
        new THREE.Vector3(-50, 0, 0),
      ])

      const uvs: Float32Array = new Float32Array([
        0.0, 0.0, 0.0, 1, 1, 1, 1, 1, 1, 0, 0, 0,

        0.0, 0.0, 0.0, 1, 1, 1, 1, 1, 1, 0, 0, 0,

        0.0, 0.0, 0.0, 1, 1, 1, 1, 1, 1, 0, 0, 0,

        0.0, 0.0, 0.0, 1, 1, 1, 1, 1, 1, 0, 0, 0,

        0.0, 0.0, 0.0, 1, 1, 1, 1, 1, 1, 0, 0, 0,

        0.0, 0.0, 0.0, 1, 1, 1, 1, 1, 1, 0, 0, 0,

        0.0, 0.0, 0.0, 1, 1, 1, 1, 1, 1, 0, 0, 0,

        0.0, 0.0, 0.0, 1, 1, 1, 1, 1, 1, 0, 0, 0,
      ])

      wallWithWindowsGeometry.setAttribute(
        'uv',
        new THREE.BufferAttribute(
          uvs.map((v: number, i: number): number =>
            i % 2 === 0 ? Math.abs(1 - v) : v,
          ),
          2,
        ),
      )

      wallWithWindowsGeometry.computeVertexNormals()

      const wallNorthMaterial = new THREE.MeshPhongMaterial({
        ...wallMaterialTextures,
        side: THREE.DoubleSide,
        flatShading: true,
      })

      const wallNorthMesh = new THREE.Mesh(
        wallWithWindowsGeometry,
        wallNorthMaterial,
      )
      wallNorthMesh.receiveShadow = true
      wallNorthMesh.castShadow = true

      wallNorthMesh.position.set(0, 0, -50)

      scene.add(wallNorthMesh)

      const trimHeight: number = 2.5
      const trimHeightHalf: number = trimHeight / 2.0
      const trimHeightFourth: number = trimHeight / 4.0
      const trimHeightEighth: number = trimHeight / 8.0
      const trimHeightSixteenth: number = trimHeight / 16.0

      const wallTrimGeometry = new THREE.BufferGeometry()
      wallTrimGeometry.setFromPoints([
        // Base - 1
        new THREE.Vector3(50, trimHeightHalf, 0),
        new THREE.Vector3(50, 0, 0),
        new THREE.Vector3(-50, 0, 0),

        // Base - 2
        new THREE.Vector3(-50, 0, 0),
        new THREE.Vector3(-50, trimHeightHalf, 0),
        new THREE.Vector3(50, trimHeightHalf, 0),

        // Divot Bottom - 1
        new THREE.Vector3(50, trimHeightHalf, 0),
        new THREE.Vector3(
          50,
          trimHeightHalf + trimHeightEighth,
          -trimHeightSixteenth,
        ),
        new THREE.Vector3(
          -50,
          trimHeightHalf + trimHeightEighth,
          -trimHeightSixteenth,
        ),

        // Divot Bottom - 2
        new THREE.Vector3(
          -50,
          trimHeightHalf + trimHeightEighth,
          -trimHeightSixteenth,
        ),
        new THREE.Vector3(-50, trimHeightHalf, 0),
        new THREE.Vector3(50, trimHeightHalf, 0),

        // Divot Top - 1
        new THREE.Vector3(
          -50,
          trimHeightHalf + trimHeightEighth,
          -trimHeightSixteenth,
        ),
        new THREE.Vector3(-50, trimHeightHalf + trimHeightFourth, 0),
        new THREE.Vector3(50, trimHeightHalf + trimHeightFourth, 0),

        // Divet Top - 2
        new THREE.Vector3(50, trimHeightHalf + trimHeightFourth, 0),
        new THREE.Vector3(
          50,
          trimHeightHalf + trimHeightEighth,
          -trimHeightSixteenth,
        ),
        new THREE.Vector3(
          -50,
          trimHeightHalf + trimHeightEighth,
          -trimHeightSixteenth,
        ),

        // Top Base - 1
        new THREE.Vector3(-50, trimHeightHalf + trimHeightFourth, 0),
        new THREE.Vector3(
          -50,
          trimHeightHalf + trimHeightFourth + trimHeightEighth,
          0,
        ),
        new THREE.Vector3(
          50,
          trimHeightHalf + trimHeightFourth + trimHeightEighth,
          0,
        ),

        // Top Base - 2
        new THREE.Vector3(
          50,
          trimHeightHalf + trimHeightFourth + trimHeightEighth,
          0,
        ),
        new THREE.Vector3(50, trimHeightHalf + trimHeightFourth, 0),
        new THREE.Vector3(-50, trimHeightHalf + trimHeightFourth, 0),

        // Top Flush - 1
        new THREE.Vector3(
          -50,
          trimHeightHalf + trimHeightFourth + trimHeightEighth,
          0,
        ),
        new THREE.Vector3(-50, trimHeight, -trimHeightSixteenth),
        new THREE.Vector3(50, trimHeight, -trimHeightSixteenth),

        // Top Flush - 2
        new THREE.Vector3(50, trimHeight, -trimHeightSixteenth),
        new THREE.Vector3(
          50,
          trimHeightHalf + trimHeightFourth + trimHeightEighth,
          0,
        ),
        new THREE.Vector3(
          -50,
          trimHeightHalf + trimHeightFourth + trimHeightEighth,
          0,
        ),
      ])

      const wallTrimGeometryUvs: Float32Array = new Float32Array([
        1, 0.5, 1, 0, 0, 0,

        0, 0, 0, 0.5, 1, 0.5,

        1, 0.5, 1, 0.625, 0, 0.625,

        0, 0.625, 0, 0.5, 1, 0.5,

        0, 0.625, 0, 0.75, 1, 0.75,

        1, 0.75, 1, 0.625, 0, 0.625,

        0, 0.75, 0, 0.875, 1, 0.875,

        1, 0.875, 1, 0.75, 0, 0.75,

        0, 0.875, 0, 1, 1, 1,

        1, 1, 1, 0.875, 0, 0.875,
      ])

      wallTrimGeometry.setAttribute(
        'uv',
        new THREE.BufferAttribute(
          wallTrimGeometryUvs.map((v: number, i: number): number =>
            i % 2 === 0 ? Math.abs(1 - v) : v,
          ),
          2,
        ),
      )

      const wallTrimTextures: PolyHavenTextureResult = {
        aoMap: wallMaterialTextures.aoMap.clone(),
        map: wallMaterialTextures.map.clone(),
        normalMap: wallMaterialTextures.normalMap.clone(),
      }

      for (const textureType in wallTrimTextures) {
        wallTrimTextures[
          textureType as keyof PolyHavenTextureResult
        ].repeat.set(1, 0.2)
      }

      const wallTrimMaterial = new THREE.MeshPhongMaterial({
        emissive: 0xffffff,
        emissiveIntensity: 0.025,
        ...wallTrimTextures,
        side: THREE.DoubleSide,
        flatShading: true,
      })

      const wallTrimNorthMesh = new THREE.Mesh(
        wallTrimGeometry,
        wallTrimMaterial,
      )
      wallTrimNorthMesh.receiveShadow = true
      wallTrimNorthMesh.castShadow = true

      wallTrimNorthMesh.position.set(0, 0, -49 + trimHeightSixteenth)

      scene.add(wallTrimNorthMesh)

      const wallTrimWestMesh = new THREE.Mesh(
        wallTrimGeometry,
        wallTrimMaterial,
      )
      wallTrimWestMesh.receiveShadow = true
      wallTrimWestMesh.castShadow = true

      wallTrimWestMesh.rotateY(THREE.MathUtils.degToRad(90))

      wallTrimWestMesh.position.set(
        -50 + trimHeightFourth + trimHeightSixteenth / 4,
        0,
        0,
      )

      scene.add(wallTrimWestMesh)

      const wallTrimEastMesh = new THREE.Mesh(
        wallTrimGeometry,
        wallTrimMaterial,
      )
      wallTrimEastMesh.receiveShadow = true
      wallTrimEastMesh.castShadow = true

      wallTrimEastMesh.rotateY(THREE.MathUtils.degToRad(-90))

      wallTrimEastMesh.position.set(
        50 - trimHeightFourth - trimHeightSixteenth / 4,
        0,
        0,
      )

      scene.add(wallTrimEastMesh)

      new GLTFLoader().load(
        resolveAsset(
          'models/fancy_picture_frame_01_4k.gltf/fancy_picture_frame_01_4k.gltf',
        ),
        function (gltf: GLTF) {
          const scale: number = 30
          gltf.scene.scale.set(scale, scale, scale)

          gltf.scene.position.set(0, 25, -48)

          scene.add(gltf.scene)

          incrementLoadState()
        },
        undefined,
        function (error) {
          console.error(error)
        },
      )

      new GLTFLoader().load(
        resolveAsset(
          'models/steel_frame_shelves_03_4k.gltf/steel_frame_shelves_03_4k.gltf',
        ),
        function (gltf: GLTF) {
          const scale: number = 10
          gltf.scene.scale.set(scale, scale, scale)

          gltf.scene.position.set(34, 0.5, -44)
          gltf.scene.rotateY(-0.0125)

          scene.add(gltf.scene)

          incrementLoadState()
        },
        undefined,
        function (error) {
          console.error(error)
        },
      )

      rendererProperties.current = {
        scene,
        camera,
        ambientLight,
        debugObjects: { grid, axesLines },
      }

      rendererContainer.current.appendChild(statsRef.current.stats.dom)

      for (const objectName in rendererProperties.current.debugObjects) {
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

    const cameraSpeed: number = 0.3

    const animate: XRFrameRequestCallback = (): void => {
      statsRef.current.stats.update()

      if (heldKeys['w']) {
        rendererProperties.current?.camera.translateZ(-cameraSpeed)
      }

      if (heldKeys['s']) {
        rendererProperties.current?.camera.translateZ(cameraSpeed)
      }

      if (heldKeys['a']) {
        rendererProperties.current?.camera.translateX(-cameraSpeed)
      }

      if (heldKeys['d']) {
        rendererProperties.current?.camera.translateX(cameraSpeed)
      }

      if (heldKeys['q']) {
        rendererProperties.current?.camera.translateY(-cameraSpeed)
      }

      if (heldKeys['e']) {
        rendererProperties.current?.camera.translateY(cameraSpeed)
      }

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

      <LoadingScreen loading={loadState < 5} delay={0} />
    </div>
  )
}

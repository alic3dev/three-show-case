import type { AppComponent } from '@/apps/types'

import type { StatsRefObject } from '@/hooks/useStats'

import type { ChunkManagerOptions } from '@/utils/Chunks'

import React from 'react'

import * as THREE from 'three'
import WebGL from 'three/addons/capabilities/WebGL'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { Water } from 'three/addons/objects/Water.js'
import { Sky } from 'three/addons/objects/Sky.js'

import { LoadingScreen } from '@/components/LoadingScreen'

import { useStats } from '@/hooks/useStats'

import { Chunk, ChunkManager } from '@/utils/Chunks'
import { EventsManager } from '@/utils/EventsManager'
import * as objectUtils from '@/utils/objects'
import { resolveAsset } from '@/utils/resolveAsset'

import styles from '@/apps/StandardApp.module.scss'

export const displayName: string = 'Ocean'

function generateChunkMethod(
  location: THREE.Vector3,
  options: ChunkManagerOptions,
): Chunk {
  const positionOffset: THREE.Vector3 = new THREE.Vector3(
    location.x * options.CHUNK_SIZE,
    location.y * options.CHUNK_SIZE,
    location.z * options.CHUNK_SIZE,
  )

  const objects: THREE.Group = new THREE.Group()

  if (location.y === 0) {
    const geoFloor: THREE.BoxGeometry = new THREE.BoxGeometry(
      options.CHUNK_SIZE,
      1,
      options.CHUNK_SIZE,
    )
    const mshFloor: THREE.Mesh = new THREE.Mesh(geoFloor, options.matFloor)

    mshFloor.position.set(0, -0.5, 0)

    mshFloor.receiveShadow = true

    objects.add(mshFloor)

    const structures = []
    const numberOfStructures: number = Math.floor(Math.random() * 25 + 25)

    for (let i: number = 0; i < numberOfStructures; i++) {
      const isTall = Math.random() > 0.95

      const widthDepth = Math.random() * 4 + (isTall ? 6 : 2)
      const height = isTall ? Math.random() * 12 + 24 : Math.random() * 12 + 2

      const structureGeometry = new THREE.BoxGeometry(
        widthDepth,
        height,
        widthDepth,
      )

      const structure = new THREE.Mesh(
        structureGeometry,
        options.structureMaterial,
      )

      do {
        structure.position.set(
          Math.random() * options.CHUNK_SIZE - 50,
          height / 2,
          Math.random() * options.CHUNK_SIZE - 50,
        )
      } while (
        structure.position.x + widthDepth / 2 < 10 &&
        structure.position.x - widthDepth / 2 > -10
      )
      structure.rotateY(Math.random() * Math.PI * 2)

      structure.castShadow = true
      structure.receiveShadow = true

      structures.push(structure)
    }

    objects.add(...structures)
  }

  objects.position.add(positionOffset)

  return new Chunk({ location, objects })
}

export const OceanApp: AppComponent = (): React.ReactElement => {
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
  const statsRef: StatsRefObject = useStats()

  const webGLSupported = React.useRef<{ value: boolean }>({ value: true })

  const renderer = React.useRef<THREE.WebGLRenderer>()
  const rendererContainer = React.useRef<HTMLDivElement>(null)
  const rendererProperties = React.useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    sky: Sky
    water: Water
    ambientLight: THREE.AmbientLight
    sunLight: THREE.Light
    objects: THREE.Object3D[]
    chunkManager: ChunkManager
    debugObjects: Record<string, THREE.Object3D>
  }>()

  const [loadState, setLoadState] = React.useState<number>(0)

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
      renderer.current.toneMappingExposure = 0.2

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
      camera.position.set(0, 4, 0)
      camera.lookAt(0, 4, -300)

      const chunkManager: ChunkManager = new ChunkManager({
        scene,
        camera,
        options: {
          CHUNK_SIZE: 250,
        },
        generateChunkMethod,
      })

      scene.fog = new THREE.Fog(
        0x1f1d16,
        1,
        chunkManager.options.CHUNK_SIZE * 2,
      )

      const axesLines: THREE.AxesHelper =
        objectUtils.axesLines.createAxesLines()
      const grid: THREE.GridHelper = objectUtils.grid.createGrid()
      grid.material.blending = THREE.SubtractiveBlending

      const ambientLight: THREE.AmbientLight = new THREE.AmbientLight(
        0xfdc371,
        1,
      )
      scene.add(ambientLight)

      // 0x585857
      // 0x3d363f

      const hemiLight = new THREE.HemisphereLight(0x3f3d36, 0x404040, 1)
      scene.add(hemiLight)

      const spotLight = new THREE.SpotLight(
        0xfdc371,
        100,
        0,
        undefined,
        1,
        0.05,
      )
      spotLight.position.set(0, 50, -200)
      spotLight.target.position.set(0, 0, 0)

      spotLight.castShadow = true
      spotLight.shadow.mapSize.width = 8192 / 8
      spotLight.shadow.mapSize.height = spotLight.shadow.mapSize.width
      spotLight.shadow.radius = 2

      scene.add(spotLight)
      scene.add(spotLight.target)

      // camera.add(spotLight) //, spotLight.target)

      // const dirLight = new THREE.DirectionalLight(0xfdc371, 100)
      // dirLight.position.set(0, 7, -100)
      // dirLight.target.position.set(0, 0, 100)

      // dirLight.castShadow = true
      // dirLight.shadow.mapSize.width = 8192 / 8
      // dirLight.shadow.mapSize.height = dirLight.shadow.mapSize.width
      // dirLight.shadow.radius = 2
      // dirLight.shadow.camera.left = -1000
      // dirLight.shadow.camera.right = 1000
      // dirLight.shadow.camera.top = 1000
      // dirLight.shadow.camera.bottom = -1000

      // camera.add(dirLight)

      // scene.add(dirLight)
      // scene.add(dirLight.target)

      // const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 5)
      // scene.add(dirLightHelper)

      // camera.add(dirLightHelper)

      const sunLight = spotLight

      const sky: Sky = new Sky()
      sky.scale.setScalar(Number.MAX_SAFE_INTEGER)

      const sunPosition = new THREE.Vector3().setFromSphericalCoords(
        1,
        THREE.MathUtils.degToRad(90),
        THREE.MathUtils.degToRad(180),
      )
      sky.material.uniforms.sunPosition.value = sunPosition

      scene.add(sky)

      const waterGeometry = new THREE.PlaneGeometry(10000, 10000)

      const water = new Water(waterGeometry, {
        textureWidth: 1024,
        textureHeight: 1024,
        waterNormals: new THREE.TextureLoader().load(
          resolveAsset('textures/waternormals.jpg'),
          function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping

            setLoadState((prevLoadState: number): number => prevLoadState + 1)
          },
        ),
        sunDirection: new THREE.Vector3(0, 1, -20),
        sunColor: 0xfdc371,
        waterColor: 0x001e0f,
        distortionScale: 2,
        fog: scene.fog !== undefined,
      })

      water.material.uniforms.size.value = 2

      water.rotation.x = -Math.PI / 2
      water.position.setY(0.6)

      // water.receiveShadow = true
      // water.castShadow = true

      scene.add(water)

      rendererProperties.current = {
        scene,
        camera,
        sky,
        water,
        ambientLight,
        sunLight,
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

      // rendererProperties.current?.camera.position.setX(
      //   rendererProperties.current?.camera.position.x - 4,
      // )

      rendererProperties.current!.water.material.uniforms['time'].value +=
        1.0 / 60.0 / 2

      // rendererProperties.current?.camera.position.setX(
      //   rendererProperties.current?.camera.position.x + 0.05,
      // )

      rendererProperties.current?.camera.translateZ(-0.2)
      rendererProperties.current?.sunLight.translateZ(-0.2)

      if (
        Object.hasOwnProperty.call(
          rendererProperties.current?.sunLight,
          'target',
        )
      ) {
        // eslint-disable-next-line no-extra-semi
        ;(
          rendererProperties.current?.sunLight as THREE.SpotLight
        ).target.translateZ(-0.2)
      }

      rendererProperties.current?.chunkManager.poll()

      renderer.current!.render(
        rendererProperties.current!.scene,
        rendererProperties.current!.camera,
      )
    }
    renderer.current.setAnimationLoop(animate)

    const panel = new GUI({ autoPlace: true })

    const waterUniforms = rendererProperties.current.water.material.uniforms

    const folderWater = panel.addFolder('Water')
    folderWater
      .add(waterUniforms.distortionScale, 'value', 0, 8, 0.1)
      .name('distortionScale')
    folderWater.add(waterUniforms.size, 'value', 0.1, 10, 0.1).name('size')
    folderWater.open()

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

      resizeObserver.disconnect()
      eventsManager.removeAllEvents()
    }
  }, [statsRef])

  return (
    <div className={styles.app}>
      <div ref={rendererContainer} className={styles.container}></div>

      <LoadingScreen loading={loadState < 1} />
    </div>
  )
}

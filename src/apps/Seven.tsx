import type { UUID } from 'crypto'

import type { AppComponent } from '@/apps/types'

import React from 'react'

import * as THREE from 'three'
import WebGL from 'three/addons/capabilities/WebGL'
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { Sky } from 'three/addons/objects/Sky.js'

import * as objectUtils from '@/utils/objects'
import { LOCAL_STORAGE_KEYS } from '@/utils/constants'

import styles from '@/apps/Seven.module.scss'

export const displayName: string = 'Chunk Generation'

const CHUNK_SIZE: number = 100
const CHUNK_SIZE_HALF: number = CHUNK_SIZE / 2

const MAX_CHUNKS: number = 49
const MAX_CHUNKS_SQ_ROOT: number = Math.sqrt(MAX_CHUNKS)
const MAX_CHUNKS_SQ_ROOT_HALF_FLOORED: number = Math.floor(
  MAX_CHUNKS_SQ_ROOT / 2,
)

const MAX_CHUNKS_IN_MEMORY: number = 100
const MAX_CHUNKS_IN_MEMORY_BUFFER: number = MAX_CHUNKS
const MAX_CHUNKS_IN_MEMORY_BUFFER_ZONE: number =
  MAX_CHUNKS_IN_MEMORY - MAX_CHUNKS_IN_MEMORY_BUFFER

class Chunk {
  public id: UUID = crypto.randomUUID()
  public location: THREE.Vector3
  public objects: THREE.Group

  public constructor({
    location,
    objects,
  }: {
    location: THREE.Vector3
    objects: THREE.Group
  }) {
    this.location = location
    this.objects = objects
  }
}

const matFloor = new THREE.MeshPhongMaterial({
  color: 0x808080,
})

const structureMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial({
  color: 0x808080,
})

function generateChunk(location: THREE.Vector3): Chunk {
  const positionOffset: THREE.Vector3 = new THREE.Vector3(
    location.x * CHUNK_SIZE,
    location.y * CHUNK_SIZE,
    location.z * CHUNK_SIZE,
  )

  const objects: THREE.Group = new THREE.Group()

  if (location.y === 0) {
    const geoFloor: THREE.BoxGeometry = new THREE.BoxGeometry(100, 1, 100)
    const mshFloor: THREE.Mesh = new THREE.Mesh(geoFloor, matFloor)

    mshFloor.position.set(0, -0.4, 0)

    mshFloor.receiveShadow = true

    objects.add(mshFloor)

    const structures = []
    const numberOfStructures: number = Math.floor(Math.random() * 25 + 5)

    if (location.x === 0 && location.z % 2 !== 0) {
      const pointLight = new THREE.PointLight(0x473c3f, 2000)
      pointLight.position.set(0, 10, 0)
      pointLight.castShadow = true
      pointLight.receiveShadow = true

      pointLight.shadow.mapSize.width = 8192 / 16
      pointLight.shadow.mapSize.height = pointLight.shadow.mapSize.width
      pointLight.shadow.radius = 2
      objects.add(pointLight)
    }

    for (let i: number = 0; i < numberOfStructures; i++) {
      const widthDepth = Math.random() * 2 + 1
      const height = Math.random() * 3 + 1

      const structureGeometry = new THREE.BoxGeometry(
        widthDepth,
        height,
        widthDepth,
      )

      const structure = new THREE.Mesh(structureGeometry, structureMaterial)

      structure.position.set(
        Math.random() * 100 - 50,
        height / 2,
        Math.random() * 100 - 50,
      )

      structure.castShadow = true
      structure.receiveShadow = true

      structures.push(structure)
    }

    objects.add(...structures)
  }

  objects.position.add(positionOffset)

  return new Chunk({ location, objects })
}

function forChunkOffsets(
  callback: ({ x, z }: { x: number; z: number }) => void,
): void {
  for (
    let x: number = -MAX_CHUNKS_SQ_ROOT_HALF_FLOORED;
    x < MAX_CHUNKS_SQ_ROOT - MAX_CHUNKS_SQ_ROOT_HALF_FLOORED;
    x++
  ) {
    for (
      let z: number = -MAX_CHUNKS_SQ_ROOT_HALF_FLOORED;
      z < MAX_CHUNKS_SQ_ROOT - MAX_CHUNKS_SQ_ROOT_HALF_FLOORED;
      z++
    ) {
      callback({ x, z })
    }
  }
}

type ChunkLookupTable = Record<number, Record<number, Record<number, Chunk>>>

class ChunkManager {
  private location: THREE.Vector3
  private scene: THREE.Scene
  private camera: THREE.Camera
  private lookupTable: ChunkLookupTable = {}
  private count: number = 0

  constructor({
    scene,
    camera,
    startingLocation = new THREE.Vector3(0, 0, 0),
  }: {
    scene: THREE.Scene
    camera: THREE.Camera
    startingLocation?: THREE.Vector3
  }) {
    this.scene = scene
    this.camera = camera
    this.location = startingLocation

    this.generate()
  }

  getCameraChunkLocation(): THREE.Vector3 {
    const cameraChunkLocation: THREE.Vector3 = new THREE.Vector3(
      Math.floor((this.camera.position.x + CHUNK_SIZE_HALF) / CHUNK_SIZE),
      Math.floor((this.camera.position.y + CHUNK_SIZE_HALF) / CHUNK_SIZE),
      Math.floor((this.camera.position.z + CHUNK_SIZE_HALF) / CHUNK_SIZE),
    )

    return cameraChunkLocation
  }

  poll(): void {
    const cameraChunkLocation: THREE.Vector3 = this.getCameraChunkLocation()

    if (!this.location.equals(cameraChunkLocation)) {
      forChunkOffsets(({ x, z }: { x: number; z: number }): void => {
        const newLocation: THREE.Vector3 = new THREE.Vector3(
          this.location.x + x,
          this.location.y,
          this.location.z + z,
        )

        const chunk: Chunk | undefined = this.get(newLocation)

        if (chunk) {
          this.scene.remove(chunk.objects)
        }
      })

      this.location = cameraChunkLocation
      this.generate()
    }
  }

  add(chunk: Chunk, overwrite: boolean = true): boolean {
    if (!overwrite && this.get(chunk.location)) {
      return false
    }

    if (
      !Object.prototype.hasOwnProperty.call(this.lookupTable, chunk.location.x)
    ) {
      this.lookupTable[chunk.location.x] = {
        [chunk.location.y]: {},
      }
    } else if (
      !Object.prototype.hasOwnProperty.call(
        this.lookupTable[chunk.location.x],
        chunk.location.y,
      )
    ) {
      this.lookupTable[chunk.location.x][chunk.location.y] = {}
    }

    this.lookupTable[chunk.location.x][chunk.location.y][chunk.location.z] =
      chunk

    this.count++

    return true
  }

  get(location: THREE.Vector3): Chunk | undefined {
    try {
      return this.lookupTable[location.x][location.y][location.z]
    } catch {
      /* Empty */
    }
  }

  generate(location: THREE.Vector3 = this.location): void {
    forChunkOffsets(({ x, z }: { x: number; z: number }): void => {
      const newLocation: THREE.Vector3 = new THREE.Vector3(
        location.x + x,
        location.y,
        location.z + z,
      )

      const existingChunk: Chunk | undefined = this.get(newLocation)

      if (existingChunk) {
        this.scene.add(existingChunk.objects)

        return
      }

      const chunk: Chunk = generateChunk(newLocation)

      this.add(chunk)
      this.scene.add(chunk.objects)
    })

    if (this.count > MAX_CHUNKS_IN_MEMORY_BUFFER_ZONE) {
      const chunks: Chunk[] = Object.values(this.lookupTable)
        .flatMap((ys): Record<number, Chunk>[] => Object.values(ys))
        .flatMap((zs): Chunk[] => Object.values(zs))
        .sort(
          (chunkA: Chunk, chunkB: Chunk): number =>
            location.distanceTo(chunkB.location) -
            location.distanceTo(chunkA.location),
        )

      let i: number = 0

      do {
        // https://threejs.org/docs/#manual/en/introduction/How-to-dispose-of-objects

        const chunk: Chunk =
          this.lookupTable[chunks[i].location.x][chunks[i].location.y][
            chunks[i].location.z
          ]
        for (const object of chunk.objects.children) {
          if (Object.prototype.hasOwnProperty.call(object, 'geometry')) {
            // eslint-disable-next-line no-extra-semi
            ;(object as THREE.Mesh).geometry.dispose()
          }

          if (Object.prototype.hasOwnProperty.call(object, 'dispose')) {
            // eslint-disable-next-line no-extra-semi
            ;(object as THREE.Light).dispose()
          }
        }
        delete this.lookupTable[chunks[i].location.x][chunks[i].location.y][
          chunks[i].location.z
        ]
        this.count--
        i++
      } while (this.count > MAX_CHUNKS_IN_MEMORY_BUFFER_ZONE)
    }
  }
}

export const Seven: AppComponent = (): React.ReactElement => {
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
    chunks: ChunkManager
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
      scene.fog = new THREE.Fog(
        0x3d363f,
        1,
        MAX_CHUNKS_SQ_ROOT_HALF_FLOORED * CHUNK_SIZE,
      )

      const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
        90,
        rendererContainer.current.clientWidth /
          rendererContainer.current.clientHeight,
        0.1,
        1000,
      )
      camera.position.set(0, 7, 0)
      // camera.lookAt(0, 0, 0)

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
        chunks: new ChunkManager({ scene, camera }),
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

      rendererProperties.current?.chunks.poll()

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

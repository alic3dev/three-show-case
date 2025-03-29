import type { UUID } from 'crypto'

import * as THREE from 'three'

import { CacheManager } from '@/utils/CacheManager'

interface ChunkManagerOptionsBase {
  CHUNK_SIZE: number

  MAX_CHUNKS: number
  MAX_CHUNKS_IN_MEMORY: number

  materials: Record<string, THREE.Material>

  matFloor: THREE.Material
  structureMaterial: THREE.Material
}

export interface ChunkManagerOptions extends ChunkManagerOptionsBase {
  CHUNK_SIZE_HALF: number

  MAX_CHUNKS_SQ_ROOT: number
  MAX_CHUNKS_SQ_ROOT_HALF_FLOORED: number

  MAX_CHUNKS_IN_MEMORY_BUFFER: number
  MAX_CHUNKS_IN_MEMORY_BUFFER_ZONE: number
}

const defaultOptions: ChunkManagerOptionsBase = Object.freeze({
  CHUNK_SIZE: 100,
  MAX_CHUNKS: 49,
  MAX_CHUNKS_IN_MEMORY: 100,

  materials: {},

  matFloor: new THREE.MeshPhongMaterial({
    color: 0x808080,
  }),
  structureMaterial: new THREE.MeshPhongMaterial({
    color: 0x808080,
  }),
})

export class Chunk {
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

type ChunkLookupTable = Record<number, Record<number, Record<number, Chunk>>>

export interface GenerateChunkMethodParams {
  location: THREE.Vector3
  options: ChunkManagerOptions
  cacheManager: CacheManager
}

export type GenerateChunkMethod = ({
  location,
  options,
  cacheManager,
}: GenerateChunkMethodParams) => Chunk

type GetCameraPositionMethod = () => THREE.Vector3

export class ChunkManager {
  private scene: THREE.Scene
  private camera: THREE.Camera
  private location: THREE.Vector3
  private lookupTable: ChunkLookupTable = {}
  private count: number = 0

  readonly cacheManager: CacheManager = new CacheManager()

  private generateChunkMethod: GenerateChunkMethod
  private getCameraPositionMethod: GetCameraPositionMethod

  readonly options: Readonly<ChunkManagerOptions>

  constructor({
    scene,
    camera,
    generateChunkMethod = ChunkManager.generateChunk,
    getCameraPositionMethod = (): THREE.Vector3 => this.camera.position,
    startingLocation = new THREE.Vector3(0, 0, 0),
    options = {},
  }: {
    scene: THREE.Scene
    camera: THREE.Camera
    startingLocation?: THREE.Vector3
    generateChunkMethod?: GenerateChunkMethod
    getCameraPositionMethod?: GetCameraPositionMethod
    options?: Partial<ChunkManagerOptionsBase>
  }) {
    this.scene = scene
    this.camera = camera
    this.location = startingLocation

    const baseOptions: ChunkManagerOptionsBase = {
      ...defaultOptions,
      ...options,
    }

    if (baseOptions.MAX_CHUNKS_IN_MEMORY <= baseOptions.MAX_CHUNKS) {
      throw new Error('MAX_CHUNKS_IN_MEMORY must be greater than MAX_CHUNKS')
    }

    this.options = {
      ...baseOptions,

      CHUNK_SIZE_HALF: baseOptions.CHUNK_SIZE / 2,

      MAX_CHUNKS_SQ_ROOT: Math.sqrt(baseOptions.MAX_CHUNKS),
      MAX_CHUNKS_SQ_ROOT_HALF_FLOORED: Math.floor(
        Math.sqrt(baseOptions.MAX_CHUNKS) / 2,
      ),

      MAX_CHUNKS_IN_MEMORY_BUFFER: baseOptions.MAX_CHUNKS,
      MAX_CHUNKS_IN_MEMORY_BUFFER_ZONE:
        baseOptions.MAX_CHUNKS_IN_MEMORY - baseOptions.MAX_CHUNKS,
    }

    this.getCameraPositionMethod = getCameraPositionMethod
    this.generateChunkMethod = generateChunkMethod
    this.generate()
  }

  generateChunk(location: THREE.Vector3): Chunk {
    return this.generateChunkMethod({
      location,
      options: this.options,
      cacheManager: this.cacheManager,
    })
  }

  static generateChunk({
    location,
    options,
  }: GenerateChunkMethodParams): Chunk {
    const positionOffset: THREE.Vector3 = new THREE.Vector3(
      location.x * options.CHUNK_SIZE,
      location.y * options.CHUNK_SIZE,
      location.z * options.CHUNK_SIZE,
    )

    const objects: THREE.Group = new THREE.Group()

    if (location.y === 0) {
      const geoFloor: THREE.BoxGeometry = new THREE.BoxGeometry(100, 1, 100)
      const mshFloor: THREE.Mesh = new THREE.Mesh(geoFloor, options.matFloor)

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

        const structure = new THREE.Mesh(
          structureGeometry,
          options.structureMaterial,
        )

        structure.position.set(
          Math.random() * options.CHUNK_SIZE - 50,
          height / 2,
          Math.random() * options.CHUNK_SIZE - 50,
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

  forChunkOffsets(
    callback: ({ x, z }: { x: number; z: number }) => void,
  ): void {
    for (
      let x: number = -this.options.MAX_CHUNKS_SQ_ROOT_HALF_FLOORED;
      x <
      this.options.MAX_CHUNKS_SQ_ROOT -
        this.options.MAX_CHUNKS_SQ_ROOT_HALF_FLOORED;
      x++
    ) {
      for (
        let z: number = -this.options.MAX_CHUNKS_SQ_ROOT_HALF_FLOORED;
        z <
        this.options.MAX_CHUNKS_SQ_ROOT -
          this.options.MAX_CHUNKS_SQ_ROOT_HALF_FLOORED;
        z++
      ) {
        callback({ x, z })
      }
    }
  }

  forActiveChunks(callback: (chunk: Chunk) => void) {
    this.forChunkOffsets(({ x, z }: { x: number; z: number }): void => {
      const newLocation: THREE.Vector3 = new THREE.Vector3(
        this.location.x + x,
        this.location.y,
        this.location.z + z,
      )

      const chunk: Chunk | undefined = this.get(newLocation)

      if (chunk) {
        callback(chunk)
      }
    })
  }

  getCameraPosition(): THREE.Vector3 {
    return this.getCameraPositionMethod()
  }

  getCameraChunkLocation(): THREE.Vector3 {
    const cameraPosition: THREE.Vector3 = this.getCameraPosition()

    const cameraChunkLocation: THREE.Vector3 = new THREE.Vector3(
      Math.floor(
        (cameraPosition.x + this.options.CHUNK_SIZE_HALF) /
          this.options.CHUNK_SIZE,
      ),
      Math.floor(
        (cameraPosition.y + this.options.CHUNK_SIZE_HALF) /
          this.options.CHUNK_SIZE,
      ),
      Math.floor(
        (cameraPosition.z + this.options.CHUNK_SIZE_HALF) /
          this.options.CHUNK_SIZE,
      ),
    )

    return cameraChunkLocation
  }

  poll(): void {
    const cameraChunkLocation: THREE.Vector3 = this.getCameraChunkLocation()

    if (!this.location.equals(cameraChunkLocation)) {
      this.forChunkOffsets(({ x, z }: { x: number; z: number }): void => {
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
    this.forChunkOffsets(({ x, z }: { x: number; z: number }): void => {
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

      const chunk: Chunk = this.generateChunk(newLocation)

      this.add(chunk)
      this.scene.add(chunk.objects)
    })

    if (this.count > this.options.MAX_CHUNKS_IN_MEMORY_BUFFER_ZONE) {
      const chunks: Chunk[] = Object.values(this.lookupTable)
        .flatMap((ys): Record<number, Chunk>[] => Object.values(ys))
        .flatMap((zs): Chunk[] => Object.values(zs))
        .sort(
          (chunkA: Chunk, chunkB: Chunk): number =>
            location.distanceTo(chunkB.location) -
            location.distanceTo(chunkA.location),
        )

      let i: number = 0

      // https://threejs.org/docs/#manual/en/introduction/How-to-dispose-of-objects
      do {
        const chunk: Chunk | undefined = this.get(chunks[i].location)

        if (!chunk) break

        for (const object of chunk.objects.children) {
          if (Object.prototype.hasOwnProperty.call(object, 'geometry')) {
            ;(object as THREE.Mesh).geometry.dispose()
          }

          if (Object.prototype.hasOwnProperty.call(object, 'dispose')) {
            ;(object as THREE.Light).dispose()
          }
        }

        const { x, y, z } = chunks[i].location
        delete this.lookupTable[x][y][z]

        this.count--
        i++
      } while (this.count > this.options.MAX_CHUNKS_IN_MEMORY_BUFFER_ZONE)
    }
  }
}

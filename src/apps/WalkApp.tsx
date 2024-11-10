import type { AppComponent } from '@/apps/types'

import type { StatsRefObject } from '@/hooks/useStats'

import type {
  GenerateChunkMethod,
  GenerateChunkMethodParams,
} from '@/utils/Chunks'

import React from 'react'

import * as THREE from 'three'
import WebGL from 'three/addons/capabilities/WebGL'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Sky } from 'three/addons/objects/Sky.js'

import { LoadingScreen } from '@/components/LoadingScreen'

import { useStats } from '@/hooks/useStats'

import { Chunk, ChunkManager } from '@/utils/Chunks'
import { EventsManager } from '@/utils/EventsManager'
import * as objectUtils from '@/utils/objects'
import { resolveAsset } from '@/utils/resolveAsset'

import styles from '@/apps/StandardApp.module.scss'

export const displayName: string = 'Walk'

interface AnimatedIntensity {
  from: number
  target: number
  atTime: DOMHighResTimeStamp
  fromTime: DOMHighResTimeStamp
}

const generateChunkMethod: GenerateChunkMethod = function generateChunkMethod({
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
    const geoFloor: THREE.BoxGeometry = new THREE.BoxGeometry(
      options.CHUNK_SIZE,
      1,
      options.CHUNK_SIZE,
    )
    const mshFloor: THREE.Mesh = new THREE.Mesh(geoFloor, options.matFloor)
    mshFloor.position.set(0, -0.5, 0)
    mshFloor.receiveShadow = true

    objects.add(mshFloor)

    if (location.x === 0) {
      const width: number = 12
      const widthHalf: number = width / 2

      const shape = new THREE.Shape()

      shape.moveTo(-widthHalf, -options.CHUNK_SIZE_HALF)

      const curTime = performance.now()

      for (let i: number = 1; i < 50; i++) {
        const xOffset: number = -Math.sin((i / 49) * Math.PI * 2) * 4

        const zOffset: number =
          options.CHUNK_SIZE * (i / 49) - options.CHUNK_SIZE_HALF

        shape.lineTo(xOffset - widthHalf, zOffset)

        if (i === 25) {
          const pointLight = new THREE.PointLight(
            new THREE.Color(255 / 255, 241 / 255, 224 / 255),
            Math.random() * 1 + 9,
            options.CHUNK_SIZE,
            0.7,
          )
          pointLight.castShadow = true
          pointLight.shadow.mapSize.width = 8192 / 8
          pointLight.shadow.mapSize.height = pointLight.shadow.mapSize.width
          pointLight.shadow.radius = 2

          const pointLightSphere = new THREE.Mesh(
            new THREE.SphereGeometry(1),
            new THREE.MeshBasicMaterial({ color: 0xffff00 }),
          )
          pointLight.add(pointLightSphere)

          pointLight.position.set(xOffset - widthHalf, 30, zOffset)

          const animatedIntensity: AnimatedIntensity = {
            from: pointLight.intensity,
            target: Math.random() * 1 + 9,
            fromTime: curTime,
            atTime: curTime + Math.random() * 100 + 25,
          }

          pointLight.userData.animatedIntensity = animatedIntensity

          objects.add(pointLight)
        }
      }

      for (let i: number = 49; i >= 0; i--) {
        const xOffset: number = -Math.sin((i / 49) * Math.PI * 2) * 4

        const zOffset: number =
          options.CHUNK_SIZE * (i / 49) - options.CHUNK_SIZE_HALF

        shape.lineTo(xOffset + widthHalf, zOffset)
      }

      shape.lineTo(-widthHalf, -options.CHUNK_SIZE_HALF)

      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        steps: 2,
        depth: 2,
        bevelEnabled: true,
        bevelThickness: 0.5,
        bevelSize: 0.25,
        bevelOffset: 0,
        bevelSegments: 10,
      }

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
      const mesh = new THREE.Mesh(geometry, options.materials.path)

      mesh.position.setY(-0.2)

      mesh.castShadow = true
      mesh.receiveShadow = true

      mesh.rotateX(THREE.MathUtils.degToRad(90))

      objects.add(mesh)
    }
  }

  objects.position.add(positionOffset)

  return new Chunk({ location, objects })
}

export const WalkApp: AppComponent = (): React.ReactElement => {
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

  const player = React.useRef<{ pointerLocked: boolean; body: THREE.Group }>({
    pointerLocked: false,
    body: new THREE.Group(),
  })

  const [loadState, setLoadState] = React.useState<number>(1)

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
      renderer.current.toneMappingExposure = 0.2

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
        2000,
      )
      camera.position.set(0, 4, 0)
      camera.lookAt(0, 4, -300)

      player.current.body.add(camera)
      scene.add(player.current.body)

      const CHUNK_SIZE: number = 250

      const texture = new THREE.TextureLoader().load(
        resolveAsset('textures/seamlessTextures2/grass1.jpg'),
        (texture: THREE.Texture) => {
          setLoadState((prevLoadState: number): number => prevLoadState + 1)

          texture.wrapS = texture.wrapT = THREE.RepeatWrapping

          texture.repeat.set(
            (texture.image.width / CHUNK_SIZE) * 8,
            (texture.image.height / CHUNK_SIZE) * 8,
          )
        },
      )

      const textureNormal = new THREE.TextureLoader().load(
        resolveAsset('textures/seamlessTextures2/grass1-normal.png'),
        (texture: THREE.Texture) => {
          setLoadState((prevLoadState: number): number => prevLoadState + 1)

          texture.wrapS = texture.wrapT = THREE.RepeatWrapping

          texture.repeat.set(
            (texture.image.width / CHUNK_SIZE) * 8,
            (texture.image.height / CHUNK_SIZE) * 8,
          )
        },
      )

      const textureAmbientOcculsion = new THREE.TextureLoader().load(
        resolveAsset(
          'textures/seamlessTextures2/grass1-ambient-occlusion-map.png',
        ),
        (texture: THREE.Texture) => {
          setLoadState((prevLoadState: number): number => prevLoadState + 1)

          texture.wrapS = texture.wrapT = THREE.RepeatWrapping

          texture.repeat.set(
            (texture.image.width / CHUNK_SIZE) * 8,
            (texture.image.height / CHUNK_SIZE) * 8,
          )
        },
      )

      // const textureSpecular = new THREE.TextureLoader().load(
      //   resolveAsset('textures/seamlessTextures2/grass1-specular-map.png'),
      //   (texture: THREE.Texture) => {
      //     setLoadState((prevLoadState: number): number => prevLoadState + 1)

      //     texture.wrapS = texture.wrapT = THREE.RepeatWrapping

      //     texture.repeat.set(
      //       (texture.image.width / CHUNK_SIZE) * 8,
      //       (texture.image.height / CHUNK_SIZE) * 8,
      //     )
      //   },
      // )

      const pathTexture = new THREE.TextureLoader().load(
        resolveAsset('textures/seamlessTextures2/IMGP5511_seamless.jpg'),
        (texture: THREE.Texture) => {
          setLoadState((prevLoadState: number): number => prevLoadState + 1)

          texture.wrapS = texture.wrapT = THREE.RepeatWrapping

          texture.repeat.set(0.2, 0.2)
        },
      )

      const pathTextureNormal = new THREE.TextureLoader().load(
        resolveAsset('textures/seamlessTextures2/5511-normal.png'),
        (texture: THREE.Texture) => {
          setLoadState((prevLoadState: number): number => prevLoadState + 1)

          texture.wrapS = texture.wrapT = THREE.RepeatWrapping

          texture.repeat.set(0.2, 0.2)
        },
      )

      const pathAmbient = new THREE.TextureLoader().load(
        resolveAsset('textures/seamlessTextures2/5511-ambient.png'),
        (texture: THREE.Texture) => {
          setLoadState((prevLoadState: number): number => prevLoadState + 1)

          texture.wrapS = texture.wrapT = THREE.RepeatWrapping

          texture.repeat.set(0.2, 0.2)
        },
      )

      // const pathSpecular = new THREE.TextureLoader().load(
      //   resolveAsset('textures/seamlessTextures2/5511-specular.png'),
      //   (texture: THREE.Texture) => {
      //     setLoadState((prevLoadState: number): number => prevLoadState + 1)

      //     texture.wrapS = texture.wrapT = THREE.RepeatWrapping

      //     texture.repeat.set(0.2, 0.2)
      //   },
      // )

      const pathMaterial = new THREE.MeshStandardMaterial({
        map: pathTexture,
        normalMap: pathTextureNormal,
        normalScale: new THREE.Vector2(0.5, 0.5),
        // specularMap: pathSpecular,
        aoMap: pathAmbient,
        // shininess: 0,
        // reflectivity: 0,
      })

      const matFloor = new THREE.MeshStandardMaterial({
        map: texture,
        normalMap: textureNormal,
        // normalScale: new THREE.Vector2(2, 2),
        // normalScale: new THREE.Vector2(0.2, 0.2),
        // specularMap: textureSpecular,
        aoMap: textureAmbientOcculsion,
        // shininess: 0,
        // reflectivity: 0,
      })

      const loader = new GLTFLoader()

      loader.load(
        resolveAsset('models/grass_medium_01_1k.gltf/grass_medium_01_1k.gltf'),
        function (gltf) {
          gltf.scene.children[0].scale.set(10, 10, 10)
          const brightness: number = 5
          ;(
            (gltf.scene.children[0] as THREE.Mesh)
              .material as THREE.MeshStandardMaterial
          ).color = new THREE.Color(brightness, brightness, brightness)
          gltf.scene.children[0].castShadow = true
          gltf.scene.children[0].receiveShadow = true

          const instancedGrass = new THREE.InstancedMesh(
            (gltf.scene.children[0] as THREE.Mesh).geometry,
            (gltf.scene.children[0] as THREE.Mesh).material,
            100,
          )

          instancedGrass.scale.set(10, 10, 10)

          for (let i: number = 0; i < instancedGrass.count; i++) {
            const a: THREE.Matrix4 = new THREE.Matrix4()

            instancedGrass.getMatrixAt(i, a)

            a.setPosition(
              Math.random() > 0.5
                ? Math.random() * 10 + 15
                : -15 - Math.random() * 10,
              0,
              Math.random() * 20 - 10 + i * 5,
            )

            a.makeRotationY(THREE.MathUtils.degToRad(Math.random() * 360))

            instancedGrass.setMatrixAt(i, a)
          }

          // scene.add(instancedGrass)

          // scene.add(gltf.scene.children[0])
        },
        undefined,
        function (error) {
          console.error(error)
        },
      )

      // const loader = new GLTFLoader()

      // loader.load(
      //   resolveAsset('models/rock_moss_set_01_1k.gltf/rock_moss_set_01_1k.gltf'),
      //   function (gltf) {
      //     const rockScale: number = 5

      //     for (const rock of gltf.scene.children) {
      //       rock.position.set(Math.random() * 20, 0, Math.random() * 20)
      //       rock.scale.set(rockScale, rockScale, rockScale)

      //       const rockMaterial: THREE.MeshStandardMaterial = (
      //         rock as THREE.Mesh
      //       ).material as THREE.MeshStandardMaterial

      //       rock.castShadow = true
      //       rock.receiveShadow = true

      //       scene.add(rock)
      //     }
      //   },
      //   undefined,
      //   function (error) {
      //     console.error(error)
      //   },
      // )

      const chunkManager: ChunkManager = new ChunkManager({
        scene,
        camera,
        options: {
          CHUNK_SIZE,
          materials: { path: pathMaterial },
          matFloor,
        },
        generateChunkMethod,
        getCameraPositionMethod: (): THREE.Vector3 => {
          return player.current.body.position
        },
      })

      scene.fog = new THREE.Fog(
        0x0b0508,
        1,
        chunkManager.options.CHUNK_SIZE * 2,
      )

      const axesLines: THREE.AxesHelper =
        objectUtils.axesLines.createAxesLines()
      const grid: THREE.GridHelper = objectUtils.grid.createGrid()
      grid.material.blending = THREE.SubtractiveBlending

      const ambientLight: THREE.AmbientLight = new THREE.AmbientLight(
        0xfdc371,
        0.1,
      )
      scene.add(ambientLight)

      // 0x585857
      // 0x3d363f

      const hemiLight = new THREE.HemisphereLight(0x3f3d36, 0x404040, 2)
      scene.add(hemiLight)

      const sky: Sky = new Sky()
      sky.scale.setScalar(Number.MAX_SAFE_INTEGER)

      const sunPosition = new THREE.Vector3().setFromSphericalCoords(
        1,
        THREE.MathUtils.degToRad(95),
        THREE.MathUtils.degToRad(180),
      )
      sky.material.uniforms.sunPosition.value = sunPosition

      const uniforms = sky.material.uniforms
      uniforms['turbidity'].value = 10 // 0 ... 20
      uniforms['rayleigh'].value = 3 // 0 ... 4
      uniforms['mieCoefficient'].value = 0.005 // 0 ... 0.1
      uniforms['mieDirectionalG'].value = 0.7 // 0 ... 1

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

    const eventsManager: EventsManager = new EventsManager(
      rendererContainer.current,
    )

    const onPointerMove = (ev: PointerEvent): void => {
      if (!player.current?.pointerLocked) return

      if (ev.movementX !== 0) {
        player.current.body.rotateY(
          -0.002 * Math.max(Math.min(ev.movementX, 60), -60),
        )
      }

      if (ev.movementY !== 0) {
        rendererProperties.current?.camera.rotateX(
          -0.001 * Math.max(Math.min(ev.movementY, 60), -60),
        )
      }
    }
    eventsManager.addContainerEvent('pointermove', onPointerMove)

    const lockChangeAlert = (): void => {
      if (document.pointerLockElement === renderer.current?.domElement) {
        player.current!.pointerLocked = true
      } else {
        player.current!.pointerLocked = false
      }
    }
    eventsManager.addDocumentEvent('pointerlockchange', lockChangeAlert)

    const heldKeys: Record<string, boolean> = {}

    const onKeyup: (ev: KeyboardEvent) => void = (ev: KeyboardEvent): void => {
      heldKeys[ev.key.toLowerCase()] = false
      heldKeys[ev.code.toLowerCase()] = false
    }
    eventsManager.addWindowEvent('keyup', onKeyup)

    const onKeydown: (ev: KeyboardEvent) => void = (
      ev: KeyboardEvent,
    ): void => {
      if (heldKeys[ev.key.toLowerCase()] || heldKeys[ev.code.toLowerCase()])
        return

      switch (ev.key.toLowerCase()) {
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

      heldKeys[ev.key.toLowerCase()] = true
      heldKeys[ev.code.toLowerCase()] = true
    }
    eventsManager.addWindowEvent('keydown', onKeydown)

    const onMouseDown = (): void => {
      const pointerLockPromise: Promise<void> | undefined =
        renderer.current?.domElement.requestPointerLock({
          unadjustedMovement: true,
        }) as Promise<void> | undefined

      if (!pointerLockPromise) {
        renderer.current?.domElement.requestPointerLock()
      }
    }
    eventsManager.addContainerEvent('mousedown', onMouseDown)

    const animate: XRFrameRequestCallback = (): void => {
      if (!renderer.current) return

      statsRef.current.stats.update()

      const speed: number = heldKeys['shift'] ? 0.4 : 0.2

      if (heldKeys['arrowup'] || heldKeys['w']) {
        player.current.body.translateZ(-speed)
      }

      if (heldKeys['arrowdown'] || heldKeys['s']) {
        player.current.body.translateZ(speed)
      }

      if (heldKeys['arrowleft'] || heldKeys['a']) {
        player.current.body.translateX(-speed)
      }

      if (heldKeys['arrowright'] || heldKeys['d']) {
        player.current.body.translateX(speed)
      }

      rendererProperties.current?.chunkManager.poll()

      const curTime: DOMHighResTimeStamp = performance.now()

      rendererProperties.current?.chunkManager.forActiveChunks(
        (chunk: Chunk): void => {
          for (const childObject of chunk.objects.children) {
            if (childObject instanceof THREE.PointLight) {
              const animatedIntensity: AnimatedIntensity =
                childObject.userData.animatedIntensity

              if (animatedIntensity.atTime <= curTime) {
                const pulse: boolean = Math.random() > 0.99

                const newAnimatedIntensity: AnimatedIntensity = {
                  from: animatedIntensity.target,
                  target: pulse ? 0.1 : Math.random() * 1 + 9,
                  fromTime: curTime,
                  atTime: pulse
                    ? curTime + Math.random() * 100 + 25
                    : curTime + Math.random() * 100 + 25,
                }

                childObject.intensity = animatedIntensity.target

                childObject.userData.animatedIntensity = newAnimatedIntensity
              } else {
                const progress: number =
                  (curTime - animatedIntensity.fromTime) /
                  (animatedIntensity.atTime - animatedIntensity.fromTime)

                childObject.intensity =
                  (animatedIntensity.target - animatedIntensity.from) *
                    progress +
                  animatedIntensity.from
              }
            }
          }
        },
      )

      renderer.current.toneMappingExposure = 0.2 // 0 ... 1
      renderer.current.render(
        rendererProperties.current!.scene,
        rendererProperties.current!.camera,
      )
    }
    renderer.current.setAnimationLoop(animate)

    const panel = new GUI({ autoPlace: true })

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

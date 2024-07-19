import type { AppComponent } from '@/apps/types'
import type { ChunkManagerOptions } from '@/utils/Chunks'

import React from 'react'

import * as THREE from 'three'
import WebGL from 'three/addons/capabilities/WebGL'
import { Stats } from '@/utils/stats'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { Water } from 'three/addons/objects/Water.js'
import { Sky } from 'three/addons/objects/Sky.js'

import { LoadingScreen } from '@/components/LoadingScreen'

import * as objectUtils from '@/utils/objects'
import { LOCAL_STORAGE_KEYS } from '@/utils/constants'
import { Chunk, ChunkManager } from '@/utils/Chunks'

import styles from '@/apps/StandardApp.module.scss'
import { EventsManager } from '@/utils/EventsManager'

export const displayName: string = '🩸'

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
  }

  objects.position.add(positionOffset)

  return new Chunk({ location, objects })
}

export const FluidApp: AppComponent = (): React.ReactElement => {
  const statsPanel = React.useRef<{ value: number }>({ value: 0 })

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
    stats: Stats
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
      camera.lookAt(0, 0, -300)

      const chunkManager: ChunkManager = new ChunkManager({
        scene,
        camera,
        options: {
          CHUNK_SIZE: 250,
        },
        generateChunkMethod,
      })

      scene.fog = new THREE.Fog(0x0, 1, chunkManager.options.CHUNK_SIZE * 2)

      const axesLines: THREE.AxesHelper =
        objectUtils.axesLines.createAxesLines()
      const grid: THREE.GridHelper = objectUtils.grid.createGrid()
      grid.material.blending = THREE.SubtractiveBlending

      const ambientLight: THREE.AmbientLight = new THREE.AmbientLight(
        0xfdc371,
        1,
      )

      const spotLight = new THREE.SpotLight(
        0xfdc371,
        100,
        0,
        undefined,
        1,
        0.05,
      )

      const sunLight = spotLight

      const sky: Sky = new Sky()
      sky.scale.setScalar(Number.MAX_SAFE_INTEGER)

      const sunPosition = new THREE.Vector3().setFromSphericalCoords(
        1,
        THREE.MathUtils.degToRad(180),
        THREE.MathUtils.degToRad(180),
      )
      sky.material.uniforms.sunPosition.value = sunPosition

      scene.add(sky)

      const waterGeometry = new THREE.PlaneGeometry(10000, 10000)

      const water = new Water(waterGeometry, {
        textureWidth: 1024,
        textureHeight: 1024,
        waterNormals: new THREE.TextureLoader().load(
          '/assets/textures/waternormals.jpg',
          function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping

            setLoadState((prevLoadState: number): number => prevLoadState + 1)
          },
        ),
        sunDirection: new THREE.Vector3(0, 20, -200),
        sunColor: 0x330000,
        waterColor: 0xf01e0f,
        distortionScale: 2,
        fog: scene.fog !== undefined,
      })

      water.material.uniforms.size.value = 4

      water.rotation.x = -Math.PI / 2
      water.position.setY(0.6)

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
    eventsManager.addContainerEvent('mousedown', onMouseDown)

    const onMouseUp = (): void => {
      rendererContainer.current?.classList.remove(styles.grabbing)
    }
    eventsManager.addContainerEvent('mouseup', onMouseUp)

    const animate: XRFrameRequestCallback = (): void => {
      rendererProperties.current?.stats.update()

      rendererProperties.current!.water.material.uniforms['time'].value +=
        1.0 / 60.0 / 2

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

    return (): void => {
      panel.destroy()

      renderer.current!.setAnimationLoop(null)

      resizeObserver.disconnect()
      eventsManager.removeAllEvents()
    }
  }, [])

  return (
    <div className={styles.app}>
      <div ref={rendererContainer} className={styles.container}></div>

      <LoadingScreen loading={loadState < 1} />

      <script
        id="heightmapFragmentShader"
        type="x-shader/x-fragment"
        dangerouslySetInnerHTML={{
          __html: `
            #include <common>

            uniform vec2 mousePos;
            uniform float mouseSize;
            uniform float viscosityConstant;
            uniform float heightCompensation;

            void main()	{

              vec2 cellSize = 1.0 / resolution.xy;

              vec2 uv = gl_FragCoord.xy * cellSize;

              // heightmapValue.x == height from previous frame
              // heightmapValue.y == height from penultimate frame
              // heightmapValue.z, heightmapValue.w not used
              vec4 heightmapValue = texture2D( heightmap, uv );

              // Get neighbours
              vec4 north = texture2D( heightmap, uv + vec2( 0.0, cellSize.y ) );
              vec4 south = texture2D( heightmap, uv + vec2( 0.0, - cellSize.y ) );
              vec4 east = texture2D( heightmap, uv + vec2( cellSize.x, 0.0 ) );
              vec4 west = texture2D( heightmap, uv + vec2( - cellSize.x, 0.0 ) );

              // https://web.archive.org/web/20080618181901/http://freespace.virgin.net/hugo.elias/graphics/x_water.htm

              float newHeight = ( ( north.x + south.x + east.x + west.x ) * 0.5 - heightmapValue.y ) * viscosityConstant;

              // Mouse influence
              float mousePhase = clamp( length( ( uv - vec2( 0.5 ) ) * BOUNDS - vec2( mousePos.x, - mousePos.y ) ) * PI / mouseSize, 0.0, PI );
              newHeight += ( cos( mousePhase ) + 1.0 ) * 0.28;

              heightmapValue.y = heightmapValue.x;
              heightmapValue.x = newHeight;

              gl_FragColor = heightmapValue;

            }
          `,
        }}
      />
    </div>
  )
}

import type { AppComponent } from '@/apps/types'
import type { StatsRefObject } from '@/hooks/useStats'

import React from 'react'

import * as THREE from 'three'
import WebGL from 'three/addons/capabilities/WebGL'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

import { LoadingScreen } from '@/components/LoadingScreen'

import { useStats } from '@/hooks/useStats'

import * as objectUtils from '@/utils/objects'
import { EventsManager } from '@/utils/EventsManager'

import styles from '@/apps/StandardAppWithGrab.module.scss'

import blobs from '@/data/blobs.json'

export const displayName: string = 'Puzzle'

export const PuzzleApp: AppComponent = (): React.ReactElement => {
  const [loadState, setLoadState] = React.useState<number>(0)

  const statsRef: StatsRefObject = useStats()

  const webGLSupported = React.useRef<{ value: boolean }>({ value: true })

  const renderer = React.useRef<THREE.WebGLRenderer>()
  const rendererContainer = React.useRef<HTMLDivElement>(null)
  const rendererProperties = React.useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    controls: OrbitControls
    composer: EffectComposer
    outlinePass: OutlinePass
    statsRef: StatsRefObject
    objects: Record<string, THREE.Object3D>
    debugObjects: Record<string, THREE.Object3D>
    puzzlePieces: THREE.Group
    ambientLight: THREE.AmbientLight
  }>()

  React.useEffect((): (() => void) | void => {
    if (!webGLSupported.current.value || !rendererContainer.current) return

    if (!WebGL.isWebGLAvailable()) {
      rendererContainer.current.appendChild(WebGL.getWebGLErrorMessage())

      webGLSupported.current.value = false

      return
    }

    const dragY: number = -3.75

    const eventsManager: EventsManager = new EventsManager(
      rendererContainer.current,
    )

    if (!renderer.current) {
      renderer.current = new THREE.WebGLRenderer({ antialias: true })
      renderer.current.setSize(
        rendererContainer.current.clientWidth,
        rendererContainer.current.clientHeight,
      )

      renderer.current.setPixelRatio(window.devicePixelRatio)

      renderer.current.shadowMap.enabled = true
      renderer.current.shadowMap.type = THREE.PCFSoftShadowMap

      renderer.current.setClearColor(0x0)

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
      camera.position.set(0, 6, 0)
      camera.lookAt(0, 0, 0)

      const composer: EffectComposer = new EffectComposer(renderer.current)

      const renderPass: RenderPass = new RenderPass(scene, camera)
      composer.addPass(renderPass)

      const outlinePass: OutlinePass = new OutlinePass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        scene,
        camera,
      )
      composer.addPass(outlinePass)

      const outputPass: OutputPass = new OutputPass()
      composer.addPass(outputPass)

      const controls: OrbitControls = new OrbitControls(
        camera,
        renderer.current.domElement,
      )
      controls.target.set(0, dragY, 0)
      controls.update()

      const matFloor: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial({
        color: 0x808080,
      })
      const geoFloor: THREE.BoxGeometry = new THREE.BoxGeometry(100, 0.25, 100)
      const mshFloor: THREE.Mesh = new THREE.Mesh(geoFloor, matFloor)
      mshFloor.position.set(0, -4.25, 0)

      const rayFloor: THREE.Mesh = new THREE.Mesh(geoFloor)
      rayFloor.position.set(0, dragY, 0)
      rayFloor.visible = false

      const puzzlePieces: THREE.Group = new THREE.Group()

      const puzzleImageURL: string =
        blobs.puzzles[
          Math.min(
            Math.floor(Math.random() * blobs.puzzles.length),
            blobs.puzzles.length - 1,
          )
        ].url

      new THREE.TextureLoader().load(
        puzzleImageURL,
        (texture: THREE.Texture): void => {
          const textureSize: THREE.Vector2 = new THREE.Vector2(
            texture.image.width,
            texture.image.height,
          )

          const canvas: HTMLCanvasElement = document.createElement('canvas')
          canvas.width = textureSize.x
          canvas.height = textureSize.y

          const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d')

          if (ctx) {
            ctx.drawImage(texture.image, 0, 0)
            const imageData: ImageData = ctx.getImageData(
              0,
              0,
              ctx.canvas.width,
              ctx.canvas.height,
            )

            const pixelCount: number = imageData.data.length / 4

            let r: number = 0
            let g: number = 0
            let b: number = 0

            for (let i: number = 0; i < imageData.data.length; i += 4) {
              r += imageData.data[i] / 255
              g += imageData.data[i + 1] / 255
              b += imageData.data[i + 2] / 255
            }

            r /= pixelCount
            g /= pixelCount
            b /= pixelCount

            const outlineColor: THREE.Color = new THREE.Color(r, g, b)

            outlinePass.hiddenEdgeColor = outlineColor
            outlinePass.visibleEdgeColor = outlineColor
          }

          const puzzleGeometrySize: THREE.Vector3 = new THREE.Vector3(
            10,
            0.25,
            10 * (textureSize.y / textureSize.x),
          )

          const puzzleGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(
            puzzleGeometrySize.x,
            puzzleGeometrySize.y,
            puzzleGeometrySize.z,
          )
          const puzzleMaterial: THREE.MeshPhongMaterial =
            new THREE.MeshPhongMaterial({
              color: 0xffffff,
              map: texture,
            })

          const puzzle: THREE.Mesh = new THREE.Mesh(
            puzzleGeometry,
            puzzleMaterial,
          )
          puzzle.castShadow = true
          puzzle.receiveShadow = true

          // scene.add(puzzle)

          const xCount: number = 10
          const zCount: number = 10

          const puzzlePieceGeometrySize: THREE.Vector3 = new THREE.Vector3(
            puzzleGeometrySize.x / xCount,
            puzzleGeometrySize.y,
            puzzleGeometrySize.z / zCount,
          )

          for (let x: number = 0; x < xCount; x++) {
            for (let z: number = 0; z < zCount; z++) {
              const puzzlePieceGeometry = new THREE.BoxGeometry(
                puzzlePieceGeometrySize.x,
                puzzlePieceGeometrySize.y,
                puzzlePieceGeometrySize.z,
              )

              const uvPositions: number[] = []

              const xSpan: number = 1 / xCount
              const zSpan: number = 1 / zCount

              const valFour: number = x * xSpan
              const valOne: number = valFour + xSpan

              const valThree: number = 1 - z * zSpan
              const valTwo: number = valThree - zSpan

              const addUVsA = (): void => {
                uvPositions.push(valOne)
                uvPositions.push(valTwo)
                uvPositions.push(valOne)
                uvPositions.push(valThree)
              }

              const addUVsB = (): void => {
                uvPositions.push(valFour)
                uvPositions.push(valThree)
                uvPositions.push(valFour)
                uvPositions.push(valTwo)
              }

              const addUVsC = (): void => {
                uvPositions.push(valFour)
                uvPositions.push(valThree)
                uvPositions.push(valOne)
                uvPositions.push(valThree)
              }

              const addUVsD = (): void => {
                uvPositions.push(valFour)
                uvPositions.push(valTwo)
                uvPositions.push(valOne)
                uvPositions.push(valTwo)
              }

              const addUVsE = (): void => {
                uvPositions.push(valOne)
                uvPositions.push(valThree)
                uvPositions.push(valFour)
                uvPositions.push(valThree)
              }

              addUVsA()
              addUVsA()
              addUVsB()
              addUVsB()
              addUVsC()
              addUVsD()
              addUVsD()
              addUVsC()
              addUVsD()
              addUVsD()
              addUVsE()
              addUVsE()

              puzzlePieceGeometry.setAttribute(
                'uv',
                new THREE.Float32BufferAttribute(uvPositions, 2),
              )

              const puzzlePiece: THREE.Mesh = new THREE.Mesh(
                puzzlePieceGeometry,
                puzzleMaterial,
              )

              puzzlePiece.userData.x = x
              puzzlePiece.userData.z = z

              puzzlePiece.position.set(
                x * (puzzlePieceGeometrySize.x + 0.25),
                -4,
                z * (puzzlePieceGeometrySize.z + 0.25),
              )

              puzzlePiece.castShadow = true
              puzzlePiece.receiveShadow = true

              puzzlePieces.add(puzzlePiece)
            }
          }

          for (let i: number = 0; i < 4; i++) {
            for (const piece of puzzlePieces.children) {
              const origPosition: THREE.Vector3 = piece.position.clone()

              const randomPiece: THREE.Object3D =
                puzzlePieces.children[
                  Math.floor(Math.random() * puzzlePieces.children.length)
                ]

              piece.position.set(
                randomPiece.position.x,
                randomPiece.position.y,
                randomPiece.position.z,
              )

              randomPiece.position.set(
                origPosition.x,
                origPosition.y,
                origPosition.z,
              )
            }
          }

          scene.add(puzzlePieces)

          for (const piece of puzzlePieces.children) {
            piece.position.sub(
              new THREE.Vector3(
                ((puzzlePieceGeometrySize.x + 0.25) * (xCount - 1)) / 2,
                0,
                ((puzzlePieceGeometrySize.z + 0.25) * (zCount - 1)) / 2,
              ),
            )
          }

          setLoadState((prevLoadState: number): number => prevLoadState + 1)
        },
      )

      const cubeGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1)
      const cubeMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial(
        {
          color: 0x808080,
        },
      )
      const cube: THREE.Mesh = new THREE.Mesh(cubeGeometry, cubeMaterial)
      cube.position.set(0, 3, 0)

      const ambientLight: THREE.AmbientLight = new THREE.AmbientLight(
        0xffffff,
        0,
      )
      scene.add(ambientLight)

      const spotLight: THREE.SpotLight = new THREE.SpotLight(
        0xffffff,
        5,
        0,
        Math.PI / 20,
        1,
        0.5,
      )
      spotLight.position.set(0, 100, 0)
      spotLight.target.position.set(0, 0, 0)
      spotLight.castShadow = true
      spotLight.shadow.mapSize.width = 8192 / 2
      spotLight.shadow.mapSize.height = spotLight.shadow.mapSize.width
      spotLight.shadow.radius = 2
      scene.add(spotLight)
      scene.add(spotLight.target)

      const axesLines: THREE.AxesHelper =
        objectUtils.axesLines.createAxesLines()
      const grid: THREE.GridHelper = objectUtils.grid.createGrid()

      rendererProperties.current = {
        scene,
        camera,
        controls,
        composer,
        outlinePass,
        statsRef,
        objects: {
          mshFloor,
          rayFloor,
        },
        debugObjects: { axesLines, grid },
        puzzlePieces,
        ambientLight,
      }

      rendererContainer.current.appendChild(statsRef.current.stats.dom)

      for (const objectName in rendererProperties.current.objects) {
        rendererProperties.current.scene.add(
          rendererProperties.current.objects[objectName],
        )

        rendererProperties.current.objects[objectName].castShadow = true
        rendererProperties.current.objects[objectName].receiveShadow = true
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

      mshFloor.castShadow = false
    }

    const raycaster: THREE.Raycaster = new THREE.Raycaster()
    const pointer: THREE.Vector2 = new THREE.Vector2()
    let selectedObject: THREE.Object3D | null = null
    let draggedObject: THREE.Object3D | null = null

    const onPointerMove = (event: PointerEvent): void => {
      if (!rendererContainer.current) return

      pointer.x = (event.layerX / rendererContainer.current.clientWidth) * 2 - 1
      pointer.y =
        -(event.layerY / rendererContainer.current.clientHeight) * 2 + 1
    }
    eventsManager.addContainerEvent('pointermove', onPointerMove)

    const onMouseDown = (event: MouseEvent): void => {
      if (!selectedObject || event.shiftKey) return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      draggedObject = selectedObject
      draggedObject.position.y = dragY
    }
    eventsManager.addContainerEvent('mousedown', onMouseDown)

    const onMouseUp = (): void => {
      if (!draggedObject) return

      draggedObject.position.y = -4
      draggedObject = null
    }
    eventsManager.addContainerEvent('mouseup', onMouseUp)

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

        rendererProperties.current?.composer.setSize(
          rendererContainer.current!.clientWidth,
          rendererContainer.current!.clientHeight,
        )
      }, 0)
    }

    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(rendererContainer.current!)

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
          rendererProperties.current!.statsRef.current.next()
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

    const clock: THREE.Clock = new THREE.Clock()

    const animate: XRFrameRequestCallback = (): void => {
      rendererProperties.current?.statsRef.current.stats.update()
      rendererProperties.current?.controls.update(clock.getDelta())

      raycaster.setFromCamera(pointer, rendererProperties.current!.camera)

      if (draggedObject) {
        rendererProperties.current!.outlinePass.selectedObjects = [
          draggedObject,
        ]

        rendererProperties.current!.controls.enableRotate = false
      } else {
        const intersects: THREE.Intersection[] = raycaster.intersectObjects(
          rendererProperties.current!.puzzlePieces.children,
        )

        if (intersects.length > 0) {
          selectedObject = intersects[0].object
          rendererProperties.current!.outlinePass.selectedObjects = [
            selectedObject,
          ]
        } else {
          selectedObject = null
          rendererProperties.current!.outlinePass.selectedObjects = []

          rendererProperties.current!.controls.enableRotate = true
        }
      }

      if (draggedObject) {
        const rayPosIntersect: THREE.Intersection = raycaster.intersectObject(
          rendererProperties.current!.objects.rayFloor,
        )[0]

        if (rayPosIntersect) {
          draggedObject.position.x = rayPosIntersect.point.x
          draggedObject.position.z = rayPosIntersect.point.z
        }
      }

      rendererProperties.current?.composer.render()
    }
    renderer.current.setAnimationLoop(animate)

    return (): void => {
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

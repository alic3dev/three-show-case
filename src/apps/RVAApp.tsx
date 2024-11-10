import type { AppComponent } from '@/apps/types'

import type { LoadableResolver, LoadManager } from '@/hooks/useLoadManager'
import type { StatsRefObject } from '@/hooks/useStats'

import type {
  DataSets,
  MinifiedLake,
  MinifiedPark,
  MinifiedRoad,
  MinifiedStream,
  MinifiedStructure,
  MinifiedSurface,
  SurfacesFeaturePropertiesSubType,
} from '@/utils/RVA'

import React from 'react'

import * as THREE from 'three'
import WebGL from 'three/addons/capabilities/WebGL'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader'

import { LoadingScreen } from '@/components/LoadingScreen'

import { useLoadManager } from '@/hooks/useLoadManager'
import { useStats } from '@/hooks/useStats'

import { EventsManager } from '@/utils/EventsManager'
import * as objectUtils from '@/utils/objects'
import { resolveAsset } from '@/utils/resolveAsset'
import * as RVAUtils from '@/utils/RVA'

import styles from '@/apps/StandardApp.module.scss'

interface RVAObjects<T = THREE.Object3D[]> extends DataSets<T> {
  filteredType: {
    roads: {
      paved: T
      unpaved: T
    }
    surfaces: Record<keyof typeof SurfacesFeaturePropertiesSubType, T>
  }
  // railroads: string,
  // structures: string,
  // lakes: string,
  // streams: string,
  // boundary: string
  // parks: string
  // surfaces: string
}

export const displayName: string = 'RVA'

export const RVAApp: AppComponent = (): React.ReactElement => {
  const statsRef: StatsRefObject = useStats()
  const { loading, addBatchedLoadable, addLoadable }: LoadManager =
    useLoadManager({})

  const webGLSupported = React.useRef<{ value: boolean }>({ value: true })

  const renderer = React.useRef<THREE.WebGLRenderer>()
  const rendererContainer = React.useRef<HTMLDivElement>(null)
  const rendererProperties = React.useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    RVA: RVAObjects
    objects: THREE.Object3D[]
    debugObjects: Record<string, THREE.Object3D>
  }>()

  const settings = React.useRef<{ visible: RVAObjects<boolean> }>({
    visible: {
      boundary: true,
      contours: true,
      lakes: true,
      parks: true,
      railroads: true,
      roads: true,
      streams: true,
      structures: true,
      surfaces: true,

      filteredType: {
        roads: {
          paved: true,
          unpaved: true,
        },
        surfaces: {
          Alley: true,
          Ballast: true,
          Bridge: true,
          Driveway: true,
          Median: true,
          Overpass: true,
          Parking: true,
          Sidewalk: true,
        },
      },
    },
  })

  const player = React.useRef<{ pointerLocked: boolean; body: THREE.Group }>({
    pointerLocked: false,
    body: new THREE.Group(),
  })

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
      renderer.current.toneMappingExposure = 1

      renderer.current.setClearColor(0x000000)

      rendererContainer.current.appendChild(renderer.current.domElement)
    }

    if (!rendererProperties.current) {
      const scene: THREE.Scene = new THREE.Scene()

      const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
        90,
        rendererContainer.current.clientWidth /
          rendererContainer.current.clientHeight,
        0.0001,
        1,
      )
      camera.position.set(0, 0.1, 0)
      camera.lookAt(0, 0, 0)

      player.current.body.add(camera)
      scene.add(player.current.body)

      player.current.body.position.set(
        77.512932155879895,
        0,
        37.525919678111798,
      )

      player.current.body.rotateY(THREE.MathUtils.degToRad(180))

      const axesLines: THREE.AxesHelper =
        objectUtils.axesLines.createAxesLines()
      const grid: THREE.GridHelper = objectUtils.grid.createGrid()
      grid.material.blending = THREE.SubtractiveBlending

      const ambientLight: THREE.AmbientLight = new THREE.AmbientLight(
        0xcbd4d9,
        1,
      )
      scene.add(ambientLight)

      const hdrLoadableResolve: LoadableResolver = addLoadable()
      new RGBELoader().load(
        resolveAsset(`hdr/kloppenheim_02_puresky_4k.hdr`),
        (texture: THREE.DataTexture): void => {
          texture.mapping = THREE.EquirectangularReflectionMapping

          scene.background = texture
          scene.backgroundIntensity = 0.1

          scene.environment = texture
          scene.environmentIntensity = 0.1

          hdrLoadableResolve()
        },
      )

      const RVA: RVAObjects = {
        boundary: [],
        contours: [],
        lakes: [],
        parks: [],
        railroads: [],
        roads: [],
        streams: [],
        structures: [],
        surfaces: [],

        filteredType: {
          roads: {
            paved: [],
            unpaved: [],
          },
          surfaces: {
            Alley: [],
            Ballast: [],
            Bridge: [],
            Driveway: [],
            Median: [],
            Overpass: [],
            Parking: [],
            Sidewalk: [],
          },
        },
      }

      // fetch(resolveAsset('RVA/build/railroads.json'))
      //   .then((res: Response): Promise<string> => res.text())
      //   .then((text: string): void => {
      //     const railroads = JSON.parse(text)

      //     const material = new THREE.LineBasicMaterial({ color: 0xffff00 })

      //     for (const railroad of railroads) {
      //       const points: THREE.Vector3[] = []

      //       for (const point of railroad.geometry.coordinates) {
      //         if (railroad.geometry.type === 'MultiLineString') {
      //           for (const subPoint of point) {
      //             points.push(
      //               new THREE.Vector3(
      //                 -subPoint[0] / 111120,
      //                 0,
      //                 subPoint[1] / 111120,
      //               ),
      //             )
      //           }
      //         } else {
      //           points.push(
      //             new THREE.Vector3(-point[0] / 111120, 0, point[1] / 111120),
      //           )
      //         }
      //       }

      //       // EPSG:2284

      //       const geometry = new THREE.BufferGeometry().setFromPoints(points)

      //       const line = new THREE.Line(geometry, material)

      //       line.position.setY(0)

      //       scene.add(line)
      //     }
      //   })

      const assetsRVALoadableResolve: LoadableResolver = addBatchedLoadable(6)

      fetch(resolveAsset('RVA/build/roads.json'))
        .then((res: Response): Promise<string> => res.text())
        .then((text: string): void => {
          const roads: MinifiedRoad[] = JSON.parse(text)

          const material = new THREE.LineBasicMaterial({ color: 0x0000ff })

          const pavedPoints: THREE.Vector3[] = []
          const unpavedPoints: THREE.Vector3[] = []

          let minPoint: THREE.Vector2 | undefined = undefined
          let maxPoint: THREE.Vector2 | undefined = undefined

          const checkPoint = (point: [number, number]) => {
            if (typeof minPoint === 'undefined') {
              minPoint = new THREE.Vector2(point[0], point[1])
            }

            if (point[0] < minPoint.x) {
              minPoint.x = point[0]
            }

            if (point[1] < minPoint.y) {
              minPoint.y = point[1]
            }

            if (typeof maxPoint === 'undefined') {
              maxPoint = new THREE.Vector2(point[0], point[1])
            }

            if (point[0] > maxPoint.x) {
              maxPoint.x = point[0]
            }

            if (point[1] > maxPoint.y) {
              maxPoint.y = point[1]
            }
          }

          for (const road of roads) {
            // road.paved

            if (road.geometry.type === 'Polygon') {
              for (const polygon of road.geometry.coordinates) {
                for (let i: number = 0; i < polygon.length - 1; i++) {
                  checkPoint([-polygon[i][0], polygon[i][1]])

                  const pointsToAdd = [
                    new THREE.Vector3(-polygon[i][0], 0, polygon[i][1]),
                    new THREE.Vector3(-polygon[i + 1][0], 0, polygon[i + 1][1]),
                  ]

                  if (road.paved) {
                    pavedPoints.push(...pointsToAdd)
                  } else {
                    unpavedPoints.push(...pointsToAdd)
                  }
                }
              }
            } else {
              for (const polygon of road.geometry.coordinates) {
                for (const subPolygon of polygon) {
                  for (let i: number = 0; i < subPolygon.length - 1; i++) {
                    checkPoint([-subPolygon[i][0], subPolygon[i][1]])

                    const pointsToAdd = [
                      new THREE.Vector3(-subPolygon[i][0], 0, subPolygon[i][1]),
                      new THREE.Vector3(
                        -subPolygon[i + 1][0],
                        0,
                        subPolygon[i + 1][1],
                      ),
                    ]

                    if (road.paved) {
                      pavedPoints.push(...pointsToAdd)
                    } else {
                      unpavedPoints.push(...pointsToAdd)
                    }
                  }
                }
              }
            }
          }

          const geometryPaved = new THREE.BufferGeometry().setFromPoints(
            pavedPoints,
          )
          const geometryUnpaved = new THREE.BufferGeometry().setFromPoints(
            unpavedPoints,
          )

          const linePaved = new THREE.LineSegments(geometryPaved, material)
          linePaved.visible =
            settings.current.visible.roads &&
            settings.current.visible.filteredType.roads.paved

          const lineUnpaved = new THREE.LineSegments(geometryUnpaved, material)
          lineUnpaved.visible =
            settings.current.visible.roads &&
            settings.current.visible.filteredType.roads.unpaved

          RVA.roads.push(linePaved, lineUnpaved)
          RVA.filteredType.roads.paved.push(linePaved)
          RVA.filteredType.roads.unpaved.push(lineUnpaved)

          scene.add(linePaved, lineUnpaved)

          if (minPoint && maxPoint) {
            const _minPoint = minPoint as THREE.Vector2
            const _maxPoint = maxPoint as THREE.Vector2

            const midPoint: THREE.Vector2 = new THREE.Vector2(
              (_minPoint.x + _maxPoint.x) / 2,
              (_minPoint.y + _maxPoint.y) / 2,
            )

            player.current.body.position.set(midPoint.x, -0.01, midPoint.y)
          }

          assetsRVALoadableResolve()
        })

      fetch(resolveAsset('RVA/build/structures.json'))
        .then((res: Response): Promise<string> => res.text())
        .then((text: string): void => {
          const structures: MinifiedStructure[] = JSON.parse(text)

          const material = new THREE.LineBasicMaterial({ color: 0xffffff })

          const points: THREE.Vector3[] = []

          for (const structure of structures) {
            if (structure.geometry.type === 'Polygon') {
              for (const polygon of structure.geometry.coordinates) {
                for (let i: number = 0; i < polygon.length - 1; i++) {
                  points.push(
                    new THREE.Vector3(-polygon[i][0], 0, polygon[i][1]),
                    new THREE.Vector3(-polygon[i + 1][0], 0, polygon[i + 1][1]),
                  )
                }
              }
            } else {
              for (const polygon of structure.geometry.coordinates) {
                for (const subPolygon of polygon) {
                  for (let i: number = 0; i < subPolygon.length - 1; i++) {
                    points.push(
                      new THREE.Vector3(-subPolygon[i][0], 0, subPolygon[i][1]),
                      new THREE.Vector3(
                        -subPolygon[i + 1][0],
                        0,
                        subPolygon[i + 1][1],
                      ),
                    )
                  }
                }
              }
            }
          }

          const geometry = new THREE.BufferGeometry().setFromPoints(points)

          const line = new THREE.LineSegments(geometry, material)
          line.visible = settings.current.visible.structures

          RVA.structures.push(line)

          scene.add(line)

          assetsRVALoadableResolve()
        })

      fetch(resolveAsset('RVA/build/lakes.json'))
        .then((res: Response): Promise<string> => res.text())
        .then((text: string): void => {
          const lakes: MinifiedLake[] = JSON.parse(text)

          const material = new THREE.LineBasicMaterial({ color: 0x00aacc })

          const points: THREE.Vector3[] = []

          for (const lake of lakes) {
            for (const polygon of lake.geometry.coordinates) {
              for (let i: number = 0; i < polygon.length - 1; i++) {
                points.push(
                  new THREE.Vector3(-polygon[i][0], 0, polygon[i][1]),
                  new THREE.Vector3(-polygon[i + 1][0], 0, polygon[i + 1][1]),
                )
              }
            }
          }

          const geometry = new THREE.BufferGeometry().setFromPoints(points)

          const line = new THREE.LineSegments(geometry, material)
          line.visible = settings.current.visible.lakes

          RVA.lakes.push(line)

          scene.add(line)

          assetsRVALoadableResolve()
        })

      fetch(resolveAsset('RVA/build/streams.json'))
        .then((res: Response): Promise<string> => res.text())
        .then((text: string): void => {
          const streams: MinifiedStream[] = JSON.parse(text)

          const material = new THREE.LineBasicMaterial({ color: 0x3080cc })

          const points: THREE.Vector3[] = []

          for (const stream of streams) {
            if (stream.geometry.type === 'Polygon') {
              for (const polygon of stream.geometry.coordinates) {
                for (let i: number = 0; i < polygon.length - 1; i++) {
                  points.push(
                    new THREE.Vector3(-polygon[i][0], 0, polygon[i][1]),
                    new THREE.Vector3(-polygon[i + 1][0], 0, polygon[i + 1][1]),
                  )
                }
              }
            } else {
              for (const polygon of stream.geometry.coordinates) {
                for (const subPolygon of polygon) {
                  for (let i: number = 0; i < subPolygon.length - 1; i++) {
                    points.push(
                      new THREE.Vector3(-subPolygon[i][0], 0, subPolygon[i][1]),
                      new THREE.Vector3(
                        -subPolygon[i + 1][0],
                        0,
                        subPolygon[i + 1][1],
                      ),
                    )
                  }
                }
              }
            }
          }

          const geometry = new THREE.BufferGeometry().setFromPoints(points)

          const line = new THREE.LineSegments(geometry, material)
          line.visible = settings.current.visible.streams

          RVA.streams.push(line)

          scene.add(line)

          assetsRVALoadableResolve()
        })

      fetch(resolveAsset('RVA/build/parks.json'))
        .then((res: Response): Promise<string> => res.text())
        .then((text: string): void => {
          const parks: MinifiedPark[] = JSON.parse(text)

          const material = new THREE.LineBasicMaterial({ color: 0x30cc30 })

          const points: THREE.Vector3[] = []

          for (const park of parks) {
            if (park.geometry.type === 'Polygon') {
              for (const polygon of park.geometry.coordinates) {
                for (let i: number = 0; i < polygon.length - 1; i++) {
                  points.push(
                    new THREE.Vector3(-polygon[i][0], 0, polygon[i][1]),
                    new THREE.Vector3(-polygon[i + 1][0], 0, polygon[i + 1][1]),
                  )
                }
              }
            } else {
              for (const polygon of park.geometry.coordinates) {
                for (const subPolygon of polygon) {
                  for (let i: number = 0; i < subPolygon.length - 1; i++) {
                    points.push(
                      new THREE.Vector3(-subPolygon[i][0], 0, subPolygon[i][1]),
                      new THREE.Vector3(
                        -subPolygon[i + 1][0],
                        0,
                        subPolygon[i + 1][1],
                      ),
                    )
                  }
                }
              }
            }
          }

          const geometry = new THREE.BufferGeometry().setFromPoints(points)

          const line = new THREE.LineSegments(geometry, material)
          line.visible = settings.current.visible.parks

          RVA.parks.push(line)

          scene.add(line)

          assetsRVALoadableResolve()
        })

      fetch(resolveAsset('RVA/build/surfaces.json'))
        .then((res: Response): Promise<string> => res.text())
        .then((text: string): void => {
          const surfaces: MinifiedSurface[] = JSON.parse(text)

          const material = new THREE.LineBasicMaterial({
            color: 0x999999,
            transparent: true,
            opacity: 0.5,
          })

          const points: Record<
            keyof typeof SurfacesFeaturePropertiesSubType,
            THREE.Vector3[]
          > = {
            Alley: [],
            Ballast: [],
            Bridge: [],
            Driveway: [],
            Median: [],
            Overpass: [],
            Parking: [],
            Sidewalk: [],
          }

          function addPoints(
            type: SurfacesFeaturePropertiesSubType,
            ...newPoints: THREE.Vector3[]
          ): void {
            for (const prop in RVAUtils.lookups
              .surfaceFeaturePropertiesSubType) {
              if (
                RVAUtils.lookups.surfaceFeaturePropertiesSubType[
                  prop as keyof typeof SurfacesFeaturePropertiesSubType
                ] === type
              ) {
                points[
                  prop as keyof typeof SurfacesFeaturePropertiesSubType
                ].push(...newPoints)
              }
            }
          }

          for (const surface of surfaces) {
            if (surface.geometry.type === 'Polygon') {
              for (const polygon of surface.geometry.coordinates) {
                for (let i: number = 0; i < polygon.length - 1; i++) {
                  addPoints(
                    surface.subType,
                    new THREE.Vector3(-polygon[i][0], 0, polygon[i][1]),
                    new THREE.Vector3(-polygon[i + 1][0], 0, polygon[i + 1][1]),
                  )
                }
              }
            } else {
              for (const polygon of surface.geometry.coordinates) {
                for (const subPolygon of polygon) {
                  for (let i: number = 0; i < subPolygon.length - 1; i++) {
                    addPoints(
                      surface.subType,
                      new THREE.Vector3(-subPolygon[i][0], 0, subPolygon[i][1]),
                      new THREE.Vector3(
                        -subPolygon[i + 1][0],
                        0,
                        subPolygon[i + 1][1],
                      ),
                    )
                  }
                }
              }
            }
          }

          for (const prop in points) {
            const geometry = new THREE.BufferGeometry().setFromPoints(
              points[prop as keyof typeof SurfacesFeaturePropertiesSubType],
            )

            const line = new THREE.LineSegments(geometry, material)

            line.visible =
              settings.current.visible.surfaces &&
              settings.current.visible.filteredType.surfaces[
                prop as keyof typeof SurfacesFeaturePropertiesSubType
              ]

            RVA.surfaces.push(line)
            RVA.filteredType.surfaces[
              prop as keyof typeof SurfacesFeaturePropertiesSubType
            ].push(line)

            scene.add(line)
          }

          assetsRVALoadableResolve()
        })

      rendererProperties.current = {
        scene,
        camera,
        RVA,
        objects: [],
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
        case 'r':
          for (const road of rendererProperties.current!.RVA.roads) {
            road.visible = !road.visible
          }

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

      const speed: number = heldKeys['shift'] ? 0.0001 : 0.001

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

      if (heldKeys['arrowleft'] || heldKeys['q']) {
        player.current.body.translateY(-speed)
      }

      if (heldKeys['arrowright'] || heldKeys['e']) {
        player.current.body.translateY(speed)
      }

      if (heldKeys['space']) {
        console.log(player.current.body.position)
      }

      renderer.current.render(
        rendererProperties.current!.scene,
        rendererProperties.current!.camera,
      )
    }
    renderer.current.setAnimationLoop(animate)

    const panel = new GUI({ autoPlace: true })
    const visibilityPanel: GUI = panel.addFolder('Visibility')

    function addVisibilityPanel(
      name: keyof DataSets,
      to: GUI = visibilityPanel,
      onChange?: (v: boolean) => void,
    ) {
      to.add(settings.current.visible, name)
        .name(`${name.substring(0, 1).toUpperCase()}${name.substring(1)}`)
        .onChange((v: boolean): void => {
          if (!rendererProperties.current) return

          for (const object of rendererProperties.current.RVA[name]) {
            object.visible = v
          }

          if (onChange) {
            onChange(v)
          }
        })
    }

    function addVisibilityFilteredPanel(
      name: keyof RVAObjects['filteredType'],
    ) {
      const visibilityFilterPanel: GUI = visibilityPanel.addFolder(name)

      addVisibilityPanel(name, visibilityFilterPanel, (v: boolean): void => {
        if (!v || !rendererProperties.current) {
          return
        }

        for (const filterType in settings.current.visible.filteredType[name]) {
          for (const object of rendererProperties.current.RVA.filteredType[
            name
          ][filterType as never] as THREE.Object3D[]) {
            object.visible =
              settings.current.visible.filteredType[name][filterType as never]
          }
        }
      })

      if (!rendererProperties.current) return

      for (const filterType in settings.current.visible.filteredType[name]) {
        visibilityFilterPanel
          .add(settings.current.visible.filteredType[name], filterType as never)
          .name(
            `${filterType.substring(0, 1).toUpperCase()}${filterType.substring(
              1,
            )}`,
          )
          .onChange((v: boolean): void => {
            if (!rendererProperties.current || !settings.current.visible[name])
              return

            for (const object of rendererProperties.current.RVA.filteredType[
              name
            ][filterType as never] as THREE.Object3D[]) {
              object.visible = v
            }

            if (!v) {
              return
            }
          })
      }
    }

    addVisibilityFilteredPanel('roads')
    addVisibilityPanel('lakes')
    addVisibilityPanel('streams')
    addVisibilityPanel('parks')
    addVisibilityPanel('structures')
    addVisibilityFilteredPanel('surfaces')

    return (): void => {
      panel.destroy()

      resizeObserver.disconnect()
      eventsManager.removeAllEvents()

      renderer.current!.setAnimationLoop(null)
    }
  }, [statsRef, addBatchedLoadable, addLoadable])

  return (
    <div className={styles.app}>
      <div ref={rendererContainer} className={styles.container}></div>

      <LoadingScreen loading={loading} delay={0} />
    </div>
  )
}

import type { AppComponent } from '@/apps/types'

import type { LoadableResolver, LoadManager } from '@/hooks/useLoadManager'
import type { StatsRefObject } from '@/hooks/useStats'

import type { DataSets } from '@/utils/CHO'

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

import styles from '@/apps/StandardApp.module.scss'

interface CHOObjects<T = THREE.Object3D[]> extends DataSets<T> {
  filteredType: {
    roads: {
      area: T
      bridge: T
    }
    // surfaces: Record<keyof typeof SurfacesFeaturePropertiesSubType, T>
  }
  // railroads: string,
  // structures: string,
  // lakes: string,
  // streams: string,
  // boundary: string
  // parks: string
  // surfaces: string
}

export const displayName: string = 'CHO'

export const CHOApp: AppComponent = (): React.ReactElement => {
  const statsRef: StatsRefObject = useStats()
  const { loading, addBatchedLoadable, addLoadable }: LoadManager =
    useLoadManager({})

  const webGLSupported = React.useRef<{ value: boolean }>({ value: true })

  const renderer = React.useRef<THREE.WebGLRenderer>()
  const rendererContainer = React.useRef<HTMLDivElement>(null)
  const rendererProperties = React.useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    CHO: CHOObjects
    objects: THREE.Object3D[]
    debugObjects: Record<string, THREE.Object3D>
  }>()

  // const settings = React.useRef<{ visible: CHOObjects<boolean> }>({
  //   visible: {
  //     architectural_design_control_districts: true,
  //     bicycle_lane: true,
  //     bicycle_rack: true,
  //     contour_line_2006_2ft: true,
  //     elementary_school_zone_area: true,
  //     entrance_corridor_area: true,
  //     historic_conservation_district_area: true,
  //     municipal_boundary_area: true,
  //     parcel_area: true,
  //     parcel_point: true,
  //     park_area: true,
  //     parking_exempt_area: true,
  //     pedestrian_sidewalk_area: true,
  //     pedestrian_sidewalk_bridge_area: true,
  //     pedestrian_walkway_area: true,
  //     planning_area: true,
  //     railroad_centerline: true,
  //     road_area: true,
  //     road_bridge_area: true,
  //     road_centerline: true,
  //     structure_existing_area: true,
  //     surface_water_course_area: true,
  //     surface_water_course_line: true,
  //     trail_line: true,
  //     vehicle_alley_area: true,
  //     vehicle_driveway_area: true,
  //     vehicle_parking_area: true,
  //     wetland_area: true,

  //     // contours: true,
  //     // lakes: true,
  //     // parks: true,
  //     // railroads: true,
  //     // roads: true,
  //     // streams: true,
  //     // structures: true,
  //     // surfaces: true,

  //     filteredType: {
  //       roads: {
  //         area: true,
  //         bridge: true,
  //       },
  //       // surfaces: {
  //       //   Alley: true,
  //       //   Ballast: true,
  //       //   Bridge: true,
  //       //   Driveway: true,
  //       //   Median: true,
  //       //   Overpass: true,
  //       //   Parking: true,
  //       //   Sidewalk: true,
  //       // },
  //     },
  //   },
  // })

  const player = React.useRef<{ pointerLocked: boolean; body: THREE.Group }>({
    pointerLocked: false,
    body: new THREE.Group(),
  })

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
        0.1,
        2000000,
      )
      camera.position.set(0, 0.1, 0)
      camera.lookAt(0, 0, 0)

      player.current.body.add(camera)
      scene.add(player.current.body)

      player.current.body.position.set(11487216.125, 10000, 3902278.0249999985)

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

      const CHO: CHOObjects = {
        architectural_design_control_districts: [],
        bicycle_lane: [],
        bicycle_rack: [],
        contour_line_2006_2ft: [],
        elementary_school_zone_area: [],
        entrance_corridor_area: [],
        historic_conservation_district_area: [],
        municipal_boundary_area: [],
        parcel_area: [],
        parcel_point: [],
        park_area: [],
        parking_exempt_area: [],
        pedestrian_sidewalk_area: [],
        pedestrian_sidewalk_bridge_area: [],
        pedestrian_walkway_area: [],
        planning_area: [],
        railroad_centerline: [],
        road_area: [],
        road_bridge_area: [],
        road_centerline: [],
        structure_existing_area: [],
        surface_water_course_area: [],
        surface_water_course_line: [],
        trail_line: [],
        vehicle_alley_area: [],
        vehicle_driveway_area: [],
        vehicle_parking_area: [],
        wetland_area: [],

        filteredType: {
          roads: {
            area: [],
            bridge: [],
          },
          // surfaces: {
          //   Alley: [],
          //   Ballast: [],
          //   Bridge: [],
          //   Driveway: [],
          //   Median: [],
          //   Overpass: [],
          //   Parking: [],
          //   Sidewalk: [],
          // },
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

      const assetsCHOLoadableResolve: LoadableResolver = addBatchedLoadable(4)

      fetch(resolveAsset('CHO/build/municipal_boundary_area.json'))
        .then((res: Response): Promise<string> => res.text())
        .then((text: string): void => {
          const boundary: [number, number][] = JSON.parse(text)
          const boundaryPoints: THREE.Vector3[] = []

          // boundaryLine.visible =
          //   settings.current.visible.roads &&
          //   settings.current.visible.filteredType.roads.paved

          // RVA.roads.push(linePaved, lineUnpaved)
          // RVA.filteredType.roads.paved.push(linePaved)
          // RVA.filteredType.roads.unpaved.push(lineUnpaved)

          let minPoint: THREE.Vector2 | undefined = undefined
          let maxPoint: THREE.Vector2 | undefined = undefined

          for (let i: number = 0; i < boundary.length - 1; i++) {
            const boundarySet: [number, number] = boundary[i]
            const boundarySetNext: [number, number] = boundary[i + 1]

            boundaryPoints.push(
              new THREE.Vector3(boundarySet[0], 0, boundarySet[1]),
              new THREE.Vector3(boundarySetNext[0], 0, boundarySetNext[1]),
            )

            if (!minPoint || !maxPoint) {
              minPoint = new THREE.Vector2(boundarySet[0], boundarySet[1])
              maxPoint = new THREE.Vector2(boundarySet[0], boundarySet[1])
            } else {
              if (boundarySet[0] < minPoint.x) {
                minPoint.setX(boundarySet[0])
              }

              if (boundarySet[0] > maxPoint.x) {
                maxPoint.setX(boundarySet[0])
              }

              if (boundarySet[1] < minPoint.y) {
                minPoint.setY(boundarySet[1])
              }

              if (boundarySet[1] > maxPoint.y) {
                maxPoint.setY(boundarySet[1])
              }
            }
          }

          const boundaryMaterial = new THREE.LineBasicMaterial({
            color: 0x0000ff,
          })
          const boundaryGeometry = new THREE.BufferGeometry().setFromPoints(
            boundaryPoints,
          )

          const boundaryLine = new THREE.LineSegments(
            boundaryGeometry,
            boundaryMaterial,
          )

          scene.add(boundaryLine)

          if (minPoint && maxPoint) {
            const _minPoint = minPoint as THREE.Vector2
            const _maxPoint = maxPoint as THREE.Vector2

            const midPoint: THREE.Vector2 = new THREE.Vector2(
              (_minPoint.x + _maxPoint.x) / 2,
              (_minPoint.y + _maxPoint.y) / 2,
            )

            player.current.body.position.set(midPoint.x, 12500, midPoint.y)
          }

          assetsCHOLoadableResolve()
        })

      fetch(resolveAsset('CHO/build/road_area.json'))
        .then((res: Response): Promise<string> => res.text())
        .then((text: string): void => {
          const roadAreas = JSON.parse(text)
          const roadAreasMaterial: THREE.LineBasicMaterial =
            new THREE.LineBasicMaterial({
              color: 0x0000ff,
            })

          const roadAreasPoints: THREE.Vector3[] = []

          for (const roadArea of roadAreas) {
            if (roadArea.type === 'Polygon') {
              for (const polygon of roadArea.coordinates) {
                for (let i: number = 0; i < polygon.length - 1; i++) {
                  roadAreasPoints.push(
                    new THREE.Vector3(polygon[i][0], 0, polygon[i][1]),
                    new THREE.Vector3(polygon[i + 1][0], 0, polygon[i + 1][1]),
                  )
                }
              }
            } else {
              for (const polygon of roadArea.coordinates) {
                for (const subPolygon of polygon) {
                  for (let i: number = 0; i < subPolygon.length - 1; i++) {
                    roadAreasPoints.push(
                      new THREE.Vector3(subPolygon[i][0], 0, subPolygon[i][1]),
                      new THREE.Vector3(
                        subPolygon[i + 1][0],
                        0,
                        subPolygon[i + 1][1],
                      ),
                    )
                  }
                }
              }
            }
          }

          const roadAreasGeometry = new THREE.BufferGeometry().setFromPoints(
            roadAreasPoints,
          )

          const roadAreasMesh = new THREE.LineSegments(
            roadAreasGeometry,
            roadAreasMaterial,
          )

          // roadAreasMesh.visible =
          //   settings.current.visible.roads &&
          //   settings.current.visible.filteredType.roads.unpaved

          CHO.road_area.push(roadAreasMesh)
          scene.add(roadAreasMesh)

          assetsCHOLoadableResolve()
        })

      fetch(resolveAsset('CHO/build/road_bridge_area.json'))
        .then((res: Response): Promise<string> => res.text())
        .then((text: string): void => {
          const roadBridgeAreas = JSON.parse(text)
          const roadBridgeAreasMaterial: THREE.LineBasicMaterial =
            new THREE.LineBasicMaterial({
              color: 0x0000ff,
            })

          const roadAreasPoints: THREE.Vector3[] = []

          for (const roadArea of roadBridgeAreas) {
            if (roadArea.type === 'Polygon') {
              for (const polygon of roadArea.coordinates) {
                for (let i: number = 0; i < polygon.length - 1; i++) {
                  roadAreasPoints.push(
                    new THREE.Vector3(polygon[i][0], 0, polygon[i][1]),
                    new THREE.Vector3(polygon[i + 1][0], 0, polygon[i + 1][1]),
                  )
                }
              }
            } else {
              for (const polygon of roadArea.coordinates) {
                for (const subPolygon of polygon) {
                  for (let i: number = 0; i < subPolygon.length - 1; i++) {
                    roadAreasPoints.push(
                      new THREE.Vector3(subPolygon[i][0], 0, subPolygon[i][1]),
                      new THREE.Vector3(
                        subPolygon[i + 1][0],
                        0,
                        subPolygon[i + 1][1],
                      ),
                    )
                  }
                }
              }
            }
          }

          const roadBridgeAreasGeometry =
            new THREE.BufferGeometry().setFromPoints(roadAreasPoints)

          const roadBridgeAreasMesh = new THREE.LineSegments(
            roadBridgeAreasGeometry,
            roadBridgeAreasMaterial,
          )

          // roadAreasMesh.visible =
          //   settings.current.visible.roads &&
          //   settings.current.visible.filteredType.roads.unpaved

          CHO.road_area.push(roadBridgeAreasMesh)
          scene.add(roadBridgeAreasMesh)

          assetsCHOLoadableResolve()
        })

      // fetch(resolveAsset('RVA/build/structures.json'))
      //   .then((res: Response): Promise<string> => res.text())
      //   .then((text: string): void => {
      //     const structures: MinifiedStructure[] = JSON.parse(text)

      //     const material = new THREE.LineBasicMaterial({ color: 0xffffff })

      //     const points: THREE.Vector3[] = []

      //     for (const structure of structures) {
      //       if (structure.geometry.type === 'Polygon') {
      //         for (const polygon of structure.geometry.coordinates) {
      //           for (let i: number = 0; i < polygon.length - 1; i++) {
      //             points.push(
      //               new THREE.Vector3(-polygon[i][0], 0, polygon[i][1]),
      //               new THREE.Vector3(-polygon[i + 1][0], 0, polygon[i + 1][1]),
      //             )
      //           }
      //         }
      //       } else {
      //         for (const polygon of structure.geometry.coordinates) {
      //           for (const subPolygon of polygon) {
      //             for (let i: number = 0; i < subPolygon.length - 1; i++) {
      //               points.push(
      //                 new THREE.Vector3(-subPolygon[i][0], 0, subPolygon[i][1]),
      //                 new THREE.Vector3(
      //                   -subPolygon[i + 1][0],
      //                   0,
      //                   subPolygon[i + 1][1],
      //                 ),
      //               )
      //             }
      //           }
      //         }
      //       }
      //     }

      //     const geometry = new THREE.BufferGeometry().setFromPoints(points)

      //     const line = new THREE.LineSegments(geometry, material)
      //     line.visible = settings.current.visible.structures

      //     RVA.structures.push(line)

      //     scene.add(line)

      //     assetsRVALoadableResolve()
      //   })

      // fetch(resolveAsset('RVA/build/lakes.json'))
      //   .then((res: Response): Promise<string> => res.text())
      //   .then((text: string): void => {
      //     const lakes: MinifiedLake[] = JSON.parse(text)

      //     const material = new THREE.LineBasicMaterial({ color: 0x00aacc })

      //     const points: THREE.Vector3[] = []

      //     for (const lake of lakes) {
      //       for (const polygon of lake.geometry.coordinates) {
      //         for (let i: number = 0; i < polygon.length - 1; i++) {
      //           points.push(
      //             new THREE.Vector3(-polygon[i][0], 0, polygon[i][1]),
      //             new THREE.Vector3(-polygon[i + 1][0], 0, polygon[i + 1][1]),
      //           )
      //         }
      //       }
      //     }

      //     const geometry = new THREE.BufferGeometry().setFromPoints(points)

      //     const line = new THREE.LineSegments(geometry, material)
      //     line.visible = settings.current.visible.lakes

      //     RVA.lakes.push(line)

      //     scene.add(line)

      //     assetsRVALoadableResolve()
      //   })

      // fetch(resolveAsset('RVA/build/streams.json'))
      //   .then((res: Response): Promise<string> => res.text())
      //   .then((text: string): void => {
      //     const streams: MinifiedStream[] = JSON.parse(text)

      //     const material = new THREE.LineBasicMaterial({ color: 0x3080cc })

      //     const points: THREE.Vector3[] = []

      //     for (const stream of streams) {
      //       if (stream.geometry.type === 'Polygon') {
      //         for (const polygon of stream.geometry.coordinates) {
      //           for (let i: number = 0; i < polygon.length - 1; i++) {
      //             points.push(
      //               new THREE.Vector3(-polygon[i][0], 0, polygon[i][1]),
      //               new THREE.Vector3(-polygon[i + 1][0], 0, polygon[i + 1][1]),
      //             )
      //           }
      //         }
      //       } else {
      //         for (const polygon of stream.geometry.coordinates) {
      //           for (const subPolygon of polygon) {
      //             for (let i: number = 0; i < subPolygon.length - 1; i++) {
      //               points.push(
      //                 new THREE.Vector3(-subPolygon[i][0], 0, subPolygon[i][1]),
      //                 new THREE.Vector3(
      //                   -subPolygon[i + 1][0],
      //                   0,
      //                   subPolygon[i + 1][1],
      //                 ),
      //               )
      //             }
      //           }
      //         }
      //       }
      //     }

      //     const geometry = new THREE.BufferGeometry().setFromPoints(points)

      //     const line = new THREE.LineSegments(geometry, material)
      //     line.visible = settings.current.visible.streams

      //     RVA.streams.push(line)

      //     scene.add(line)

      //     assetsRVALoadableResolve()
      //   })

      // fetch(resolveAsset('RVA/build/parks.json'))
      //   .then((res: Response): Promise<string> => res.text())
      //   .then((text: string): void => {
      //     const parks: MinifiedPark[] = JSON.parse(text)

      //     const material = new THREE.LineBasicMaterial({ color: 0x30cc30 })

      //     const points: THREE.Vector3[] = []

      //     for (const park of parks) {
      //       if (park.geometry.type === 'Polygon') {
      //         for (const polygon of park.geometry.coordinates) {
      //           for (let i: number = 0; i < polygon.length - 1; i++) {
      //             points.push(
      //               new THREE.Vector3(-polygon[i][0], 0, polygon[i][1]),
      //               new THREE.Vector3(-polygon[i + 1][0], 0, polygon[i + 1][1]),
      //             )
      //           }
      //         }
      //       } else {
      //         for (const polygon of park.geometry.coordinates) {
      //           for (const subPolygon of polygon) {
      //             for (let i: number = 0; i < subPolygon.length - 1; i++) {
      //               points.push(
      //                 new THREE.Vector3(-subPolygon[i][0], 0, subPolygon[i][1]),
      //                 new THREE.Vector3(
      //                   -subPolygon[i + 1][0],
      //                   0,
      //                   subPolygon[i + 1][1],
      //                 ),
      //               )
      //             }
      //           }
      //         }
      //       }
      //     }

      //     const geometry = new THREE.BufferGeometry().setFromPoints(points)

      //     const line = new THREE.LineSegments(geometry, material)
      //     line.visible = settings.current.visible.parks

      //     RVA.parks.push(line)

      //     scene.add(line)

      //     assetsRVALoadableResolve()
      //   })

      fetch(resolveAsset('CHO/build/pedestrian_sidewalk_area.json'))
        .then((res: Response): Promise<string> => res.text())
        .then((text: string): void => {
          const pedestrianSidewalkArea = JSON.parse(text)

          const material = new THREE.LineBasicMaterial({
            color: 0x999999,
            transparent: true,
            opacity: 0.5,
          })

          const points: { [key: string]: THREE.Vector3[] } = {
            Alley: [],
            Ballast: [],
            Bridge: [],
            Driveway: [],
            Median: [],
            Overpass: [],
            Parking: [],
            pedestrianSidewalkArea: [],
          }

          for (const sidewalkArea of pedestrianSidewalkArea) {
            if (sidewalkArea.type === 'Polygon') {
              for (const polygon of sidewalkArea.coordinates) {
                for (let i: number = 0; i < polygon.length - 1; i++) {
                  points.pedestrianSidewalkArea.push(
                    new THREE.Vector3(polygon[i][0], 0, polygon[i][1]),
                    new THREE.Vector3(polygon[i + 1][0], 0, polygon[i + 1][1]),
                  )
                }
              }
            } else {
              for (const polygon of sidewalkArea.coordinates) {
                for (const subPolygon of polygon) {
                  for (let i: number = 0; i < subPolygon.length - 1; i++) {
                    points.pedestrianSidewalkArea.push(
                      new THREE.Vector3(subPolygon[i][0], 0, subPolygon[i][1]),
                      new THREE.Vector3(
                        subPolygon[i + 1][0],
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
              points[prop],
            )

            const line = new THREE.LineSegments(geometry, material)
            // line.visible =
            //   settings.current.visible.surfaces &&
            //   settings.current.visible.filteredType.surfaces[
            //     prop as keyof typeof SurfacesFeaturePropertiesSubType
            //   ]

            CHO.pedestrian_sidewalk_area.push(line)

            scene.add(line)
          }

          assetsCHOLoadableResolve()
        })

      fetch(resolveAsset('CHO/build/pedestrian_sidewalk_bridge_area.json'))
        .then((res: Response): Promise<string> => res.text())
        .then((text: string): void => {
          const pedestrianSidewalkBridgeArea = JSON.parse(text)

          const material = new THREE.LineBasicMaterial({
            color: 0x999999,
            transparent: true,
            opacity: 0.5,
          })

          const points: THREE.Vector3[] = []

          for (const sidewalkBridgeArea of pedestrianSidewalkBridgeArea) {
            if (sidewalkBridgeArea.type === 'Polygon') {
              for (const polygon of sidewalkBridgeArea.coordinates) {
                for (let i: number = 0; i < polygon.length - 1; i++) {
                  points.push(
                    new THREE.Vector3(polygon[i][0], 0, polygon[i][1]),
                    new THREE.Vector3(polygon[i + 1][0], 0, polygon[i + 1][1]),
                  )
                }
              }
            } else {
              for (const polygon of sidewalkBridgeArea.coordinates) {
                for (const subPolygon of polygon) {
                  for (let i: number = 0; i < subPolygon.length - 1; i++) {
                    points.push(
                      new THREE.Vector3(subPolygon[i][0], 0, subPolygon[i][1]),
                      new THREE.Vector3(
                        subPolygon[i + 1][0],
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
          // line.visible =
          //   settings.current.visible.surfaces &&
          //   settings.current.visible.filteredType.surfaces[
          //     prop as keyof typeof SurfacesFeaturePropertiesSubType
          //   ]

          CHO.pedestrian_sidewalk_bridge_area.push(line)

          scene.add(line)

          assetsCHOLoadableResolve()
        })

      rendererProperties.current = {
        scene,
        camera,
        CHO,
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
          // for (const road of rendererProperties.current!.CHO.roads) {
          //   road.visible = !road.visible
          // }

          // for (const obj of rendererProperties.current?.scene.children) {
          //   obj.visible = false
          // }

          // rendererProperties.current!.CHO.pedestrian_sidewalk_bridge_area.forEach(
          //   (a) => (a.visible = true),
          // )

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

      const speed: number = heldKeys['shift'] ? 1000 : 100

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
    // const visibilityPanel: GUI = panel.addFolder('Visibility')

    // function addVisibilityPanel(
    //   name: string, //: keyof DataSets,
    //   to: GUI = visibilityPanel,
    //   onChange?: (v: boolean) => void,
    // ) {
    //   to.add(settings.current.visible, name)
    //     .name(`${name.substring(0, 1).toUpperCase()}${name.substring(1)}`)
    //     .onChange((v: boolean): void => {
    //       if (!rendererProperties.current) return

    //       for (const object of rendererProperties.current.CHO[name]) {
    //         object.visible = v
    //       }

    //       if (onChange) {
    //         onChange(v)
    //       }
    //     })
    // }

    // function addVisibilityFilteredPanel(
    //   name: keyof CHOObjects['filteredType'],
    // ) {
    //   const visibilityFilterPanel: GUI = visibilityPanel.addFolder(name)

    //   addVisibilityPanel(name, visibilityFilterPanel, (v: boolean): void => {
    //     if (!v || !rendererProperties.current) {
    //       return
    //     }

    //     for (const filterType in settings.current.visible.filteredType[name]) {
    //       for (const object of rendererProperties.current.CHO.filteredType[
    //         name
    //       ][filterType as never] as THREE.Object3D[]) {
    //         object.visible =
    //           settings.current.visible.filteredType[name][filterType as never]
    //       }
    //     }
    //   })

    //   if (!rendererProperties.current) return

    //   for (const filterType in settings.current.visible.filteredType[name]) {
    //     visibilityFilterPanel
    //       .add(settings.current.visible.filteredType[name], filterType as never)
    //       .name(
    //         `${filterType.substring(0, 1).toUpperCase()}${filterType.substring(
    //           1,
    //         )}`,
    //       )
    //       .onChange((v: boolean): void => {
    //         if (!rendererProperties.current || !settings.current.visible[name])
    //           return

    //         for (const object of rendererProperties.current.CHO.filteredType[
    //           name
    //         ][filterType as never] as THREE.Object3D[]) {
    //           object.visible = v
    //         }

    //         if (!v) {
    //           return
    //         }
    //       })
    //   }
    // }

    // addVisibilityFilteredPanel('roads')
    // addVisibilityPanel('lakes')
    // addVisibilityPanel('streams')
    // addVisibilityPanel('parks')
    // addVisibilityPanel('structures')
    // addVisibilityFilteredPanel('surfaces')

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

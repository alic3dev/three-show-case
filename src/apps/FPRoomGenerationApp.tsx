import type { AppComponent } from '@/apps/types'

import React from 'react'

import * as THREE from 'three'
import WebGL from 'three/addons/capabilities/WebGL'
import { Stats } from '@/utils/stats'
import { GUI } from 'three/addons/libs/lil-gui.module.min'

import { LoadingScreen } from '@/components/LoadingScreen'

import { AmmoHelper } from '@/utils/ammo/AmmoHelper'
import { EventsManager } from '@/utils/EventsManager'
import { LOCAL_STORAGE_KEYS } from '@/utils/constants'
import { generateRoomLayout } from '@/utils/rooms'
import { randomColor } from '@/utils/colors'

import styles from '@/apps/StandardApp.module.scss'

export const displayName: string = 'First Person Room Generation'

const ROOM_SIZE: number = 30

export const FPRoomGenerationApp: AppComponent = (): React.ReactElement => {
  const [loadState, setLoadState] = React.useState<number>(0)

  const statsPanel = React.useRef<{ value: number }>({ value: 0 })

  const webGLSupported = React.useRef<{ value: boolean }>({ value: true })

  const renderer = React.useRef<THREE.WebGLRenderer>()
  const rendererContainer = React.useRef<HTMLDivElement>(null)
  const rendererProperties = React.useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    stats: Stats
    objects: Record<string, THREE.Object3D>
    debugObjects: Record<string, THREE.Object3D>
    ambientLight: THREE.AmbientLight
  }>()

  const player = React.useRef<{
    object: THREE.Object3D
    body: Ammo.RigidBody
    mouseLocked: boolean
  }>()

  React.useEffect((): (() => void) | void => {
    if (!webGLSupported.current.value || !rendererContainer.current) return

    if (!WebGL.isWebGLAvailable()) {
      rendererContainer.current.appendChild(WebGL.getWebGLErrorMessage())

      webGLSupported.current.value = false

      return
    }

    let resizeObserver: ResizeObserver | null = null
    const eventsManager: EventsManager = new EventsManager(
      rendererContainer.current,
    )
    let aborted: boolean = false

    if (!renderer.current) {
      renderer.current = new THREE.WebGLRenderer({ antialias: true })

      renderer.current.setSize(
        rendererContainer.current.clientWidth,
        rendererContainer.current.clientHeight,
      )
      renderer.current.setPixelRatio(window.devicePixelRatio)

      renderer.current.shadowMap.enabled = true
      renderer.current.shadowMap.type = THREE.PCFSoftShadowMap

      rendererContainer.current.appendChild(renderer.current.domElement)
    }

    const panel: GUI = new GUI({ autoPlace: true })

    if (!rendererProperties.current) {
      window.Ammo().then((Ammo: Ammo.Ammo): void => {
        if (aborted) return

        const ammoHelper: AmmoHelper = new AmmoHelper(Ammo)

        const scene: THREE.Scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(
          90,
          rendererContainer.current!.clientWidth /
            rendererContainer.current!.clientHeight,
          0.1,
          1000,
        )

        const axesLines: THREE.Group = new THREE.Group()
        const grid: THREE.Group = new THREE.Group()

        const floorDiffuseTexture = new THREE.TextureLoader().load(
          '/assets/textures/FloorsCheckerboard_S_Diffuse.jpg',
          (texture: THREE.Texture) => {
            setLoadState((prevLoadState: number): number => prevLoadState + 1)

            texture.wrapS = texture.wrapT = THREE.RepeatWrapping
          },
        )

        const floorNormalTexture = new THREE.TextureLoader().load(
          '/assets/textures/FloorsCheckerboard_S_Normal.jpg',
          (texture: THREE.Texture) => {
            setLoadState((prevLoadState: number): number => prevLoadState + 1)

            texture.wrapS = texture.wrapT = THREE.RepeatWrapping
          },
        )

        const textureScale: number = 10

        floorDiffuseTexture.repeat.set(textureScale, textureScale)
        floorNormalTexture.repeat.set(textureScale, textureScale)

        const floorTexturedMaterial = new THREE.MeshPhongMaterial({
          color: 0xffffff,
          specular: 0x202020,

          reflectivity: 1000,
          shininess: 1000,

          map: floorDiffuseTexture,
          normalMap: floorNormalTexture,
        })

        const floorWallMaterial = new THREE.MeshPhongMaterial({
          color: 0xffffff,
          specular: 0x606060,

          reflectivity: 100,
          shininess: 30,
        })
        const floorMaterial = floorTexturedMaterial

        const lightStructureMaterial = new THREE.MeshPhongMaterial({
          color: 0x404040,
          specular: 0x606060,
          reflectivity: 10,
          side: THREE.DoubleSide,
        })

        const floorGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(
          ROOM_SIZE,
          1,
          ROOM_SIZE,
        )
        const nsWallGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(
          ROOM_SIZE,
          ROOM_SIZE,
          1,
        )
        const ewWallGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(
          1,
          ROOM_SIZE,
          ROOM_SIZE,
        )

        const nsWallWithDoorUpperGeometry: THREE.BoxGeometry =
          new THREE.BoxGeometry(ROOM_SIZE / 4, ROOM_SIZE - ROOM_SIZE / 2, 1)

        const nsWallWithDoorSidesGeometry: THREE.BoxGeometry =
          new THREE.BoxGeometry((ROOM_SIZE - ROOM_SIZE / 4) / 2, ROOM_SIZE, 1)

        const roomLayout: THREE.Vector2[] = generateRoomLayout()
        const rooms = new THREE.Group()

        for (let i: number = 0; i < roomLayout.length; i++) {
          const roomPosition: THREE.Vector2 = roomLayout[i]
          const roomGroup = new THREE.Group()

          const floorMesh: THREE.Mesh = new THREE.Mesh(
            floorGeometry,
            floorMaterial,
          )
          floorMesh.position.set(0, -0.5, 0)
          floorMesh.receiveShadow = true

          const floorShape: Ammo.BoxShape = new Ammo.btBoxShape(
            new Ammo.btVector3(ROOM_SIZE / 2, 0.5, ROOM_SIZE / 2),
          )
          const floorBody: Ammo.RigidBody = ammoHelper.createRigidBody({
            object: floorMesh,
            shape: floorShape,

            pos: new THREE.Vector3(
              floorMesh.position.x + roomPosition.x * (ROOM_SIZE / 1),
              floorMesh.position.y + -0.5,
              floorMesh.position.z + roomPosition.y * (ROOM_SIZE / 1),
            ),
          })
          floorBody.setFriction(0.5)
          floorBody.setRestitution(1)

          roomGroup.add(floorMesh)

          const ceilingMesh: THREE.Mesh = new THREE.Mesh(
            floorGeometry,
            floorWallMaterial,
          )
          ceilingMesh.position.set(0, ROOM_SIZE, 0)
          ceilingMesh.receiveShadow = true

          const ceilingShape: Ammo.BoxShape = new Ammo.btBoxShape(
            new Ammo.btVector3(ROOM_SIZE / 2, 0.5, ROOM_SIZE / 2),
          )
          const ceilingBody: Ammo.RigidBody = ammoHelper.createRigidBody({
            object: ceilingMesh,
            shape: ceilingShape,
            pos: new THREE.Vector3(
              ceilingMesh.position.x + roomPosition.x * (ROOM_SIZE / 1),
              ceilingMesh.position.y + -0.5,
              ceilingMesh.position.z + roomPosition.y * (ROOM_SIZE / 1),
            ),
          })
          ceilingBody.setFriction(0.5)
          ceilingBody.setRestitution(1)

          roomGroup.add(ceilingMesh)

          if (
            roomLayout.find(
              (room: THREE.Vector2): boolean =>
                room.x === roomPosition.x && room.y === roomPosition.y - 1,
            )
          ) {
            if (Math.random() > 0.5) {
              const northWallUpperMesh: THREE.Mesh = new THREE.Mesh(
                nsWallWithDoorUpperGeometry,
                floorWallMaterial,
              )
              northWallUpperMesh.position.set(
                0,
                ROOM_SIZE / 2 + (ROOM_SIZE - ROOM_SIZE / 2) / 2,
                -ROOM_SIZE / 2 + 0.5,
              )
              northWallUpperMesh.receiveShadow = true
              northWallUpperMesh.castShadow = true

              const northWallUpperShape: Ammo.BoxShape = new Ammo.btBoxShape(
                new Ammo.btVector3(
                  ROOM_SIZE / 4 / 2,
                  (ROOM_SIZE - ROOM_SIZE / 2) / 2,
                  0.5,
                ),
              )
              const northWallUpperBody: Ammo.RigidBody =
                ammoHelper.createRigidBody({
                  object: northWallUpperMesh,
                  shape: northWallUpperShape,

                  pos: new THREE.Vector3(
                    northWallUpperMesh.position.x +
                      roomPosition.x * (ROOM_SIZE / 1),

                    northWallUpperMesh.position.y,

                    northWallUpperMesh.position.z +
                      roomPosition.y * (ROOM_SIZE / 1),
                  ),
                })
              northWallUpperBody.setFriction(0.5)
              northWallUpperBody.setRestitution(1)

              roomGroup.add(northWallUpperMesh)

              const northWallWestMesh: THREE.Mesh = new THREE.Mesh(
                nsWallWithDoorSidesGeometry,
                floorWallMaterial,
              )
              northWallWestMesh.position.set(
                -(ROOM_SIZE / 2) + (ROOM_SIZE - ROOM_SIZE / 4) / 2 / 2,
                ROOM_SIZE / 2,
                -ROOM_SIZE / 2 + 0.5,
              )
              northWallWestMesh.receiveShadow = true
              northWallWestMesh.castShadow = true

              const northWallWestShape: Ammo.BoxShape = new Ammo.btBoxShape(
                new Ammo.btVector3(
                  (ROOM_SIZE - ROOM_SIZE / 4) / 2 / 2,
                  ROOM_SIZE,
                  1,
                ),
              )
              const northWallWestBody: Ammo.RigidBody =
                ammoHelper.createRigidBody({
                  object: northWallWestMesh,
                  shape: northWallWestShape,

                  pos: new THREE.Vector3(
                    northWallWestMesh.position.x +
                      roomPosition.x * (ROOM_SIZE / 1),
                    -0.5,
                    northWallWestMesh.position.z +
                      roomPosition.y * (ROOM_SIZE / 1),
                  ),
                })
              northWallWestBody.setFriction(0.5)
              northWallWestBody.setRestitution(1)

              roomGroup.add(northWallWestMesh)

              const northWallEastMesh: THREE.Mesh = new THREE.Mesh(
                nsWallWithDoorSidesGeometry,
                floorWallMaterial,
              )
              northWallEastMesh.position.set(
                ROOM_SIZE / 2 - (ROOM_SIZE - ROOM_SIZE / 4) / 2 / 2,
                ROOM_SIZE / 2,
                -ROOM_SIZE / 2 + 0.5,
              )
              northWallEastMesh.receiveShadow = true
              northWallEastMesh.castShadow = true

              const northWallEastShape: Ammo.BoxShape = new Ammo.btBoxShape(
                new Ammo.btVector3(
                  (ROOM_SIZE - ROOM_SIZE / 4) / 2 / 2,
                  ROOM_SIZE,
                  1,
                ),
              )
              const northWallEastBody: Ammo.RigidBody =
                ammoHelper.createRigidBody({
                  object: northWallEastMesh,
                  shape: northWallEastShape,

                  pos: new THREE.Vector3(
                    northWallEastMesh.position.x +
                      roomPosition.x * (ROOM_SIZE / 1),
                    -0.5,
                    northWallEastMesh.position.z +
                      roomPosition.y * (ROOM_SIZE / 1),
                  ),
                })
              northWallEastBody.setFriction(0.5)
              northWallEastBody.setRestitution(1)

              roomGroup.add(northWallEastMesh)
            }
          } else {
            const northWallMesh: THREE.Mesh = new THREE.Mesh(
              nsWallGeometry,
              floorWallMaterial,
            )
            northWallMesh.position.set(0, ROOM_SIZE / 2, -ROOM_SIZE / 2 + 0.5)
            northWallMesh.receiveShadow = true
            northWallMesh.castShadow = true

            const northWallShape: Ammo.BoxShape = new Ammo.btBoxShape(
              new Ammo.btVector3(ROOM_SIZE / 2, ROOM_SIZE, 1),
            )
            const northWallBody: Ammo.RigidBody = ammoHelper.createRigidBody({
              object: northWallMesh,
              shape: northWallShape,

              pos: new THREE.Vector3(
                northWallMesh.position.x + roomPosition.x * (ROOM_SIZE / 1),
                -0.5,
                northWallMesh.position.z + roomPosition.y * (ROOM_SIZE / 1),
              ),
            })
            northWallBody.setFriction(0.5)
            northWallBody.setRestitution(1)

            roomGroup.add(northWallMesh)
          }

          const generateSouthDoors: boolean = false

          const hasRoomToSouth: boolean = !!roomLayout.find(
            (room) =>
              room.x === roomPosition.x && room.y === roomPosition.y + 1,
          )

          if (hasRoomToSouth && generateSouthDoors) {
            const southWallUpperMesh: THREE.Mesh = new THREE.Mesh(
              nsWallWithDoorUpperGeometry,
              floorWallMaterial,
            )
            southWallUpperMesh.position.set(
              0,
              ROOM_SIZE / 2 + (ROOM_SIZE - ROOM_SIZE / 2) / 2,
              ROOM_SIZE / 2 - 0.5,
            )
            southWallUpperMesh.receiveShadow = true
            southWallUpperMesh.castShadow = true

            const southWallUpperShape: Ammo.BoxShape = new Ammo.btBoxShape(
              new Ammo.btVector3(
                ROOM_SIZE / 4 / 2,
                (ROOM_SIZE - ROOM_SIZE / 2) / 2,
                1,
              ),
            )
            const southWallUpperBody: Ammo.RigidBody =
              ammoHelper.createRigidBody({
                object: southWallUpperMesh,
                shape: southWallUpperShape,

                pos: new THREE.Vector3(
                  southWallUpperMesh.position.x +
                    roomPosition.x * (ROOM_SIZE / 1),
                  southWallUpperMesh.position.y,
                  southWallUpperMesh.position.z +
                    roomPosition.y * (ROOM_SIZE / 1),
                ),
              })
            southWallUpperBody.setFriction(0.5)
            southWallUpperBody.setRestitution(1)

            roomGroup.add(southWallUpperMesh)

            const southWallWestMesh: THREE.Mesh = new THREE.Mesh(
              nsWallWithDoorSidesGeometry,
              floorWallMaterial,
            )
            southWallWestMesh.position.set(
              -(ROOM_SIZE / 2) + (ROOM_SIZE - ROOM_SIZE / 4) / 2 / 2,
              ROOM_SIZE / 2,
              ROOM_SIZE / 2 - 0.5,
            )
            southWallWestMesh.receiveShadow = true
            southWallWestMesh.castShadow = true

            const southWallWestShape: Ammo.BoxShape = new Ammo.btBoxShape(
              new Ammo.btVector3(
                (ROOM_SIZE - ROOM_SIZE / 4) / 2 / 2,
                ROOM_SIZE / 2,
                0.5,
              ),
            )
            const southWallWestBody: Ammo.RigidBody =
              ammoHelper.createRigidBody({
                object: southWallWestMesh,
                shape: southWallWestShape,

                pos: new THREE.Vector3(
                  southWallWestMesh.position.x -
                    roomPosition.x * (ROOM_SIZE / 1),
                  -0.5,
                  southWallWestMesh.position.z +
                    roomPosition.y * (ROOM_SIZE / 1),
                ),
              })
            southWallWestBody.setFriction(0.5)
            southWallWestBody.setRestitution(1)

            roomGroup.add(southWallWestMesh)

            const southWallEastMesh: THREE.Mesh = new THREE.Mesh(
              nsWallWithDoorSidesGeometry,
              floorWallMaterial,
            )
            southWallEastMesh.position.set(
              ROOM_SIZE / 2 - (ROOM_SIZE - ROOM_SIZE / 4) / 2 / 2,
              ROOM_SIZE / 2,
              ROOM_SIZE / 2 - 0.5,
            )
            southWallEastMesh.receiveShadow = true
            southWallEastMesh.castShadow = true

            const southWallEastShape: Ammo.BoxShape = new Ammo.btBoxShape(
              new Ammo.btVector3(
                (ROOM_SIZE - ROOM_SIZE / 4) / 2 / 2,
                ROOM_SIZE / 2,
                0.5,
              ),
            )
            const southWallEastBody: Ammo.RigidBody =
              ammoHelper.createRigidBody({
                object: southWallEastMesh,
                shape: southWallEastShape,

                pos: new THREE.Vector3(
                  southWallEastMesh.position.x +
                    roomPosition.x * (ROOM_SIZE / 1),
                  -0.5,
                  southWallEastMesh.position.z +
                    roomPosition.y * (ROOM_SIZE / 1),
                ),
              })
            southWallEastBody.setFriction(0.5)
            southWallEastBody.setRestitution(1)

            roomGroup.add(southWallEastMesh)
          } else if (!hasRoomToSouth) {
            const southWallMesh: THREE.Mesh = new THREE.Mesh(
              nsWallGeometry,
              floorWallMaterial,
            )
            southWallMesh.position.set(0, ROOM_SIZE / 2, ROOM_SIZE / 2 - 0.5)
            southWallMesh.receiveShadow = true
            southWallMesh.castShadow = true

            const southWallShape: Ammo.BoxShape = new Ammo.btBoxShape(
              new Ammo.btVector3(ROOM_SIZE / 2, ROOM_SIZE / 2, 0.5),
            )
            const southWallBody: Ammo.RigidBody = ammoHelper.createRigidBody({
              object: southWallMesh,
              shape: southWallShape,

              pos: new THREE.Vector3(
                southWallMesh.position.x + roomPosition.x * (ROOM_SIZE / 1),
                -0.5,
                southWallMesh.position.z + roomPosition.y * (ROOM_SIZE / 1),
              ),
            })
            southWallBody.setFriction(0.5)
            southWallBody.setRestitution(1)

            roomGroup.add(southWallMesh)
          }

          if (
            !roomLayout.find(
              (room) =>
                room.x === roomPosition.x + 1 && room.y === roomPosition.y,
            )
          ) {
            const eastWallMesh: THREE.Mesh = new THREE.Mesh(
              ewWallGeometry,
              floorWallMaterial,
            )
            eastWallMesh.position.set(ROOM_SIZE / 2 + 0.5, ROOM_SIZE / 2, 0)
            eastWallMesh.receiveShadow = true
            eastWallMesh.castShadow = true

            const eastWallShape: Ammo.BoxShape = new Ammo.btBoxShape(
              new Ammo.btVector3(0.5, ROOM_SIZE / 2, ROOM_SIZE / 2),
            )
            const eastWallBody: Ammo.RigidBody = ammoHelper.createRigidBody({
              object: eastWallMesh,
              shape: eastWallShape,

              pos: new THREE.Vector3(
                eastWallMesh.position.x + roomPosition.x * (ROOM_SIZE / 1),
                -0.5,
                eastWallMesh.position.z + roomPosition.y * (ROOM_SIZE / 1),
              ),
            })
            eastWallBody.setFriction(0.5)
            eastWallBody.setRestitution(1)

            roomGroup.add(eastWallMesh)
          }

          if (
            !roomLayout.find(
              (room) =>
                room.x === roomPosition.x - 1 && room.y === roomPosition.y,
            )
          ) {
            const westWallMesh: THREE.Mesh = new THREE.Mesh(
              ewWallGeometry,
              floorWallMaterial,
            )
            westWallMesh.position.set(-ROOM_SIZE / 2 - 0.5, ROOM_SIZE / 2, 0)
            westWallMesh.receiveShadow = true
            westWallMesh.castShadow = true

            const westWallShape: Ammo.BoxShape = new Ammo.btBoxShape(
              new Ammo.btVector3(0.5, ROOM_SIZE / 2, ROOM_SIZE / 2),
            )
            const westWallBody: Ammo.RigidBody = ammoHelper.createRigidBody({
              object: westWallMesh,
              shape: westWallShape,

              pos: new THREE.Vector3(
                westWallMesh.position.x + roomPosition.x * (ROOM_SIZE / 1),
                -0.5,
                westWallMesh.position.z + roomPosition.y * (ROOM_SIZE / 1),
              ),
            })
            westWallBody.setFriction(0.5)
            westWallBody.setRestitution(1)

            roomGroup.add(westWallMesh)
          }

          if (i % 4 === 0) {
            const lightStructure: THREE.Group = new THREE.Group()

            const lightTube = new THREE.Mesh(
              new THREE.TubeGeometry(
                new THREE.LineCurve3(
                  new THREE.Vector3(0, 0.45, 0),
                  new THREE.Vector3(0, 10, 0),
                ),
                64,
                0.1,
                16,
                false,
              ),
              lightStructureMaterial,
            )
            lightTube.receiveShadow = true
            lightTube.castShadow = true

            lightStructure.add(lightTube)

            const lightCone = new THREE.Mesh(
              new THREE.ConeGeometry(2, 1, 32 * 4, 1, true, 0, Math.PI * 2),
              lightStructureMaterial,
            )
            // lightCone.receiveShadow = true
            lightCone.castShadow = true

            lightStructure.add(lightCone)

            const pointLight = new THREE.PointLight(
              randomColor(),
              ROOM_SIZE * 2,
              ROOM_SIZE * 4,
            )
            // pointLight.add(new THREE.Mesh(new THREE.Geom))

            pointLight.castShadow = true

            // pointLight.shadow.blurSamples = 128
            pointLight.shadow.mapSize.width = 8192 / 8
            pointLight.shadow.mapSize.height = pointLight.shadow.mapSize.width
            pointLight.shadow.radius = 2

            pointLight.position.set(0, -1, 0)

            lightStructure.add(pointLight)

            lightStructure.position.set(0, ROOM_SIZE - 10, 0)

            const lightTubeShape = new Ammo.btCylinderShape(
              new Ammo.btVector3(0.25, 5, 0.25),
            )

            const lightTubeBody: Ammo.RigidBody = ammoHelper.createRigidBody({
              object: lightTube,
              shape: lightTubeShape,

              pos: new THREE.Vector3(
                lightStructure.position.x +
                  lightTube.position.x +
                  roomPosition.x * (ROOM_SIZE / 1),
                lightStructure.position.y + lightTube.position.y + 5,
                lightStructure.position.z +
                  lightTube.position.z +
                  roomPosition.y * (ROOM_SIZE / 1),
              ),
            })
            lightTubeBody.setFriction(0.5)
            lightTubeBody.setRestitution(1)

            const lightConeShape = new Ammo.btConeShape(2, 1)

            const lightConeBody: Ammo.RigidBody = ammoHelper.createRigidBody({
              object: lightCone,
              shape: lightConeShape,
              pos: new THREE.Vector3(
                lightStructure.position.x +
                  lightCone.position.x +
                  roomPosition.x * (ROOM_SIZE / 1),
                lightStructure.position.y + lightCone.position.y,
                lightStructure.position.z +
                  lightCone.position.z +
                  roomPosition.y * (ROOM_SIZE / 1),
              ),
            })
            lightConeBody.setFriction(0.5)
            lightConeBody.setRestitution(1)

            roomGroup.add(lightStructure)
          }

          const roomAxesHelper = new THREE.AxesHelper(1)
          roomAxesHelper.position.set(
            roomPosition.x * ROOM_SIZE,
            0,
            roomPosition.y * ROOM_SIZE,
          )
          axesLines.add(roomAxesHelper)

          const roomGridHelper = new THREE.GridHelper(
            ROOM_SIZE,
            ROOM_SIZE,
            0x666666,
            0x333333,
          )

          roomGridHelper.position.set(
            roomPosition.x * ROOM_SIZE,
            -0.4,
            roomPosition.y * ROOM_SIZE,
          )
          grid.add(roomGridHelper)

          roomGroup.position.set(
            roomPosition.x * ROOM_SIZE,
            -0.5,
            roomPosition.y * ROOM_SIZE,
          )
          rooms.add(roomGroup)
        }

        const ambientLight: THREE.AmbientLight = new THREE.AmbientLight(
          0x404040,
          0,
        )
        scene.add(ambientLight)

        const sphereGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(
          0.5,
        )
        const sphereMaterial = new THREE.MeshPhongMaterial({
          color: 0xffffff,
          specular: 0x404040,
          shininess: 500,
          // reflectivity: 500,
        })

        const spheres: THREE.Object3D[] = []
        const sphereQuaternion: THREE.Quaternion = new THREE.Quaternion(
          0,
          0,
          0,
          1,
        )

        for (let i = 0; i < 100; i++) {
          const x: number = Math.floor(i / 10)
          const z: number = i % 10

          const sphere: THREE.Mesh = new THREE.Mesh(
            sphereGeometry,
            sphereMaterial,
          )

          const positionVector: THREE.Vector3 = new THREE.Vector3(
            x * 2 - 9,
            // ((Math.abs((z - 4.5) / 4.5) + Math.abs((x - 4.5) / 4.5)) / 2) * 60 +
            10,
            z * 2 - 9,
          )

          sphere.position.set(
            positionVector.x,
            positionVector.y,
            positionVector.z,
          )

          sphere.castShadow = true
          sphere.receiveShadow = true

          const sphereShape: Ammo.SphereShape = new Ammo.btSphereShape(0.5)

          spheres.push(sphere)

          const body: Ammo.RigidBody = ammoHelper.createRigidBody({
            object: sphere,
            shape: sphereShape,
            mass: 1,
            quaternion: sphereQuaternion,
            vel: new THREE.Vector3(
              Math.random() * 10 - 5,
              Math.random() * 10 - 5,
              Math.random() * 10 - 5,
            ),
          })
          body.setRestitution(0.9)
        }

        const playerObject: THREE.Group = new THREE.Group()
        const playerMesh = new THREE.Mesh(
          new THREE.BoxGeometry(1, 3, 1),
          new THREE.MeshBasicMaterial({
            color: 0x000000,
            // transparent: true,
            // opacity: 0,
          }),
        )
        playerMesh.castShadow = true
        playerMesh.receiveShadow = true

        playerMesh.position.set(0, -1.5, 0)
        playerObject.position.set(0, 0, 0)
        camera.position.set(0, 1, 0)

        playerObject.add(camera)
        playerObject.add(playerMesh)

        const playerShape: Ammo.Shape = new Ammo.btBoxShape(
          new Ammo.btVector3(1 / 2, 3, 1 / 2),
        )

        const playerBody: Ammo.RigidBody = ammoHelper.createRigidBody({
          object: playerObject,
          shape: playerShape,
          mass: 100,
        })
        playerBody.setFriction(0.5)
        playerBody.setRestitution(0)
        playerBody.setAngularFactor(0, 0, 0)
        playerObject.position.set(ROOM_SIZE / 4, 0, ROOM_SIZE / 4)

        scene.add(playerObject)

        rendererProperties.current = {
          scene,
          camera,
          stats: new Stats(),
          objects: {
            rooms,
          },
          debugObjects: { grid, axesLines },
          ambientLight,
        }

        player.current = {
          object: playerObject,
          body: playerBody,
          mouseLocked: false,
        }

        rendererProperties.current.scene.add(...spheres)

        try {
          const statsPanelValue = JSON.parse(
            window.localStorage.getItem(LOCAL_STORAGE_KEYS.statsPanel) || '0',
          )

          if (typeof statsPanelValue === 'number') {
            statsPanel.current.value = statsPanelValue
            rendererProperties.current.stats.showPanel(statsPanelValue)
          }
        } catch {
          /* Empty */
        }

        rendererContainer.current!.appendChild(
          rendererProperties.current.stats.dom,
        )

        for (const objectName in rendererProperties.current.objects) {
          rendererProperties.current.objects[objectName].castShadow = true
          rendererProperties.current.objects[objectName].receiveShadow = true

          rendererProperties.current.scene.add(
            rendererProperties.current.objects[objectName],
          )
        }

        // mshFloor.castShadow = false
        // mshFloor.receiveShadow = true

        for (const objectName in rendererProperties.current.debugObjects) {
          const debugObject: THREE.Object3D =
            rendererProperties.current.debugObjects[objectName]

          debugObject.visible = false

          rendererProperties.current.scene.add(debugObject)
        }

        let resizeTimeoutHandle: number
        const onResize: () => void = (): void => {
          window.clearTimeout(resizeTimeoutHandle)
          resizeTimeoutHandle = window.setTimeout((): void => {
            if (!rendererProperties.current || !rendererContainer.current)
              return

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

        resizeObserver = new ResizeObserver(onResize)
        resizeObserver.observe(rendererContainer.current!)

        const heldKeys: Record<string, boolean> = {}

        const onKeyup: (ev: KeyboardEvent) => void = (
          ev: KeyboardEvent,
        ): void => {
          heldKeys[ev.key.toLowerCase()] = false
          heldKeys[ev.code] = false
        }
        eventsManager.addWindowEvent('keyup', onKeyup)

        const onKeydown: (ev: KeyboardEvent) => void = (
          ev: KeyboardEvent,
        ): void => {
          if (heldKeys[ev.key.toLowerCase()] || heldKeys[ev.code]) return

          switch (ev.key.toLowerCase()) {
            case 'f':
              renderer.current?.domElement.requestFullscreen({
                navigationUI: 'hide',
              })
              break
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

          heldKeys[ev.key.toLowerCase()] = true
          heldKeys[ev.code] = true
        }
        eventsManager.addWindowEvent('keydown', onKeydown)

        const MAX_CAMERA_SPEED: number = 0.3

        let timeoutHandle: NodeJS.Timeout

        const onPointerMove = (ev: PointerEvent): void => {
          if (!player.current?.mouseLocked) return

          if (ev.movementX !== 0) {
            playerBody.setAngularVelocity(
              new Ammo.btVector3(
                0,
                -Math.max(
                  Math.min(ev.movementX / 750, MAX_CAMERA_SPEED),
                  -MAX_CAMERA_SPEED,
                ) *
                  Math.PI *
                  50,
                0,
              ),
            )

            clearTimeout(timeoutHandle)

            timeoutHandle = setTimeout((): void => {
              playerBody.setAngularVelocity(new Ammo.btVector3(0, 0, 0))
            }, (1 / 60) * 1000)
          }

          if (ev.movementY !== 0) {
            camera.rotateX(
              -Math.max(
                Math.min(ev.movementY / 750, MAX_CAMERA_SPEED),
                -MAX_CAMERA_SPEED,
              ),
            )
          }
        }
        eventsManager.addWindowEvent('pointermove', onPointerMove)

        const lockChangeAlert = (): void => {
          if (document.pointerLockElement === renderer.current?.domElement) {
            player.current!.mouseLocked = true
          } else {
            player.current!.mouseLocked = false
          }
        }
        eventsManager.addDocumentEvent('pointerlockchange', lockChangeAlert)

        const onMouseDown = (): void => {
          const pointerLockPromise =
            // @ts-expect-error: This is valid, not sure why TS doesn't think so
            renderer.current?.domElement.requestPointerLock({
              unadjustedMovement: true,
            })

          if (!pointerLockPromise) {
            renderer.current?.domElement.requestPointerLock()
          }

          rendererContainer.current?.classList.add(styles.grabbing)
        }
        eventsManager.addContainerEvent('mousedown', onMouseDown)

        const onMouseUp = (): void => {
          rendererContainer.current?.classList.remove(styles.grabbing)
        }
        eventsManager.addContainerEvent('mouseup', onMouseUp)

        const MOVEMENT_SPEED: number = 0.2

        const clock = new THREE.Clock()
        const animate: XRFrameRequestCallback = (): void => {
          rendererProperties.current?.stats.update()

          if (heldKeys['ArrowUp'] || heldKeys['w']) {
            playerObject.translateZ(-MOVEMENT_SPEED)
          }

          if (heldKeys['ArrowDown'] || heldKeys['s']) {
            playerObject.translateZ(MOVEMENT_SPEED)
          }

          if (heldKeys['ArrowLeft'] || heldKeys['a']) {
            playerObject.translateX(-MOVEMENT_SPEED)
          }

          if (heldKeys['ArrowRight'] || heldKeys['d']) {
            playerObject.translateX(MOVEMENT_SPEED)
          }

          if (heldKeys['Space']) {
            const prevVelocity = playerBody.getLinearVelocity()

            if (
              playerObject.position.y < 2.6 &&
              playerObject.position.y > 2.4
            ) {
              playerBody.setLinearVelocity(
                new Ammo.btVector3(
                  prevVelocity.x(),
                  MOVEMENT_SPEED * 80,
                  prevVelocity.z(),
                ),
              )
            }

            playerObject.translateY(MOVEMENT_SPEED * 2)
          }

          const transform: Ammo.Transform =
            player.current!.body.getCenterOfMassTransform()

          transform.setOrigin(
            new Ammo.btVector3(
              player.current!.object.position.x,
              player.current!.object.position.y,
              player.current!.object.position.z,
            ),
          )
          player.current!.body.setCenterOfMassTransform(transform)

          ammoHelper.step(clock.getDelta())

          renderer.current!.render(
            rendererProperties.current!.scene,
            rendererProperties.current!.camera,
          )
        }
        renderer.current!.setAnimationLoop(animate)
      })
    }

    return (): void => {
      aborted = true

      panel.destroy()

      renderer.current!.setAnimationLoop(null)

      resizeObserver?.disconnect()
      eventsManager.removeAllEvents()
    }
  }, [])

  return (
    <div className={styles.app}>
      <div ref={rendererContainer} className={styles.container}></div>

      <LoadingScreen delay={0} loading={loadState < 2} />
    </div>
  )
}

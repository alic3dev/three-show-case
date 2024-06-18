import type { AppComponent } from '@/apps/types'

import React from 'react'

import * as THREE from 'three'
import WebGL from 'three/addons/capabilities/WebGL'
import Stats from 'three/addons/libs/stats.module'
import { GUI } from 'three/addons/libs/lil-gui.module.min'

import { LOCAL_STORAGE_KEYS } from '@/utils/constants'
import { generateRoomLayout } from '@/utils/rooms'

import styles from '@/apps/FPRoomGenerationApp.module.scss'

export const displayName: string = 'First Person Room Generation'

interface WindowOrDocumentEvent {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cb: (...args: any[]) => void
}

const ROOM_SIZE: number = 30

export const FPRoomGenerationApp: AppComponent = (): React.ReactElement => {
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

    const documentEvents: WindowOrDocumentEvent[] = []
    const windowEvents: WindowOrDocumentEvent[] = []

    let aborted: boolean = false

    if (!rendererProperties.current) {
      window.Ammo().then((Ammo: Ammo.Ammo): void => {
        if (aborted) return

        const scene: THREE.Scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(
          90,
          rendererContainer.current!.clientWidth /
            rendererContainer.current!.clientHeight,
          0.1,
          1000,
        )

        const gravityConstant: number = 7.8
        const quaternion: THREE.Quaternion = new THREE.Quaternion(0, 0, 0, 1)

        const rigidBodies: THREE.Object3D[] = []

        const collisionConfiguration =
          new Ammo.btDefaultCollisionConfiguration()
        const dispatcher = new Ammo.btCollisionDispatcher(
          collisionConfiguration,
        )
        const broadphase = new Ammo.btDbvtBroadphase()
        const solver = new Ammo.btSequentialImpulseConstraintSolver()
        const physicsWorld = new Ammo.btDiscreteDynamicsWorld(
          dispatcher,
          broadphase,
          solver,
          collisionConfiguration,
        )
        physicsWorld.setGravity(new Ammo.btVector3(0, -gravityConstant, 0))

        const transformAux1: Ammo.Transform = new Ammo.btTransform()

        const axesLines: THREE.Group = new THREE.Group()
        const grid: THREE.Group = new THREE.Group()

        const floorDiffuseTexture = new THREE.TextureLoader().load(
          '/assets/textures/FloorsCheckerboard_S_Diffuse.jpg',
        )
        floorDiffuseTexture.wrapS = floorDiffuseTexture.wrapT =
          THREE.RepeatWrapping

        const floorNormalTexture = new THREE.TextureLoader().load(
          '/assets/textures/FloorsCheckerboard_S_Diffuse.jpg',
        )
        floorNormalTexture.wrapS = floorNormalTexture.wrapT =
          THREE.RepeatWrapping

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
          // normalScale: new THREE.Vector2(5, 5),
        })

        // const floorWallNormalTexture = new THREE.TextureLoader().load(
        //   '/assets/textures/grasslight-big-nm.jpg',
        // )
        // floorWallNormalTexture.wrapS = floorWallNormalTexture.wrapT =
        //   THREE.RepeatWrapping

        // const floorWallTextureScale: number = 1

        // floorWallNormalTexture.repeat.set(
        //   floorWallTextureScale,
        //   floorWallTextureScale,
        // )

        const floorWallMaterial = new THREE.MeshPhongMaterial({
          color: 0xffffff,
          specular: 0x606060,

          reflectivity: 100,
          shininess: 30,

          // map: new THREE.Texture()
          // normalMap: floorWallNormalTexture,
          // normalScale: new THREE.Vector2(50, 50),
        })
        const floorMaterial = floorTexturedMaterial

        const lightStructureMaterial = new THREE.MeshPhongMaterial({
          color: 0x404040,
          // emissive: 0xff0000,
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
          const floorBody: Ammo.RigidBody = createRigidBody({
            object: floorMesh,
            shape: floorShape,
            addToScene: false,
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
          // ceilingMesh.castShadow = true

          const ceilingShape: Ammo.BoxShape = new Ammo.btBoxShape(
            new Ammo.btVector3(ROOM_SIZE / 2, 0.5, ROOM_SIZE / 2),
          )
          const ceilingBody: Ammo.RigidBody = createRigidBody({
            object: ceilingMesh,
            shape: ceilingShape,
            addToScene: false,
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
              const northWallUpperBody: Ammo.RigidBody = createRigidBody({
                object: northWallUpperMesh,
                shape: northWallUpperShape,
                addToScene: false,
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
              const northWallWestBody: Ammo.RigidBody = createRigidBody({
                object: northWallWestMesh,
                shape: northWallWestShape,
                addToScene: false,
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
              const northWallEastBody: Ammo.RigidBody = createRigidBody({
                object: northWallEastMesh,
                shape: northWallEastShape,
                addToScene: false,
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
            const northWallBody: Ammo.RigidBody = createRigidBody({
              object: northWallMesh,
              shape: northWallShape,
              addToScene: false,
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
            const southWallUpperBody: Ammo.RigidBody = createRigidBody({
              object: southWallUpperMesh,
              shape: southWallUpperShape,
              addToScene: false,
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
            const southWallWestBody: Ammo.RigidBody = createRigidBody({
              object: southWallWestMesh,
              shape: southWallWestShape,
              addToScene: false,
              pos: new THREE.Vector3(
                southWallWestMesh.position.x - roomPosition.x * (ROOM_SIZE / 1),
                -0.5,
                southWallWestMesh.position.z + roomPosition.y * (ROOM_SIZE / 1),
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
            const southWallEastBody: Ammo.RigidBody = createRigidBody({
              object: southWallEastMesh,
              shape: southWallEastShape,
              addToScene: false,
              pos: new THREE.Vector3(
                southWallEastMesh.position.x + roomPosition.x * (ROOM_SIZE / 1),
                -0.5,
                southWallEastMesh.position.z + roomPosition.y * (ROOM_SIZE / 1),
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
            const southWallBody: Ammo.RigidBody = createRigidBody({
              object: southWallMesh,
              shape: southWallShape,
              addToScene: false,
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
            const eastWallBody: Ammo.RigidBody = createRigidBody({
              object: eastWallMesh,
              shape: eastWallShape,
              addToScene: false,
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
            const westWallBody: Ammo.RigidBody = createRigidBody({
              object: westWallMesh,
              shape: westWallShape,
              addToScene: false,
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
              new THREE.Color().set(
                Math.random() * 0.7 + 0.3,
                Math.random() * 0.7 + 0.3,
                Math.random() * 0.7 + 0.3,
              ),
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

            const lightTubeBody: Ammo.RigidBody = createRigidBody({
              object: lightTube,
              shape: lightTubeShape,
              addToScene: false,
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

            const lightConeBody: Ammo.RigidBody = createRigidBody({
              object: lightCone,
              shape: lightConeShape,
              addToScene: false,
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

          const body: Ammo.RigidBody = createRigidBody({
            object: sphere,
            shape: sphereShape,
            mass: 1,
            quaternion,
            vel: new THREE.Vector3(
              Math.random() * 10 - 5,
              Math.random() * 10 - 5,
              Math.random() * 10 - 5,
            ),
          })
          body.setRestitution(0.9)
        }

        function createRigidBody({
          object,
          shape,
          mass = 0,
          pos,
          quaternion,
          vel,
          angVel,
          addToScene = true,
        }: {
          object: THREE.Object3D
          shape: Ammo.Shape
          mass?: number
          pos?: THREE.Vector3
          quaternion?: THREE.Quaternion
          vel?: THREE.Vector3
          angVel?: THREE.Vector3
          addToScene?: boolean
        }) {
          if (pos) {
            // object.position.copy(pos)
          } else {
            pos = object.position
          }

          if (quaternion) {
            object.quaternion.copy(quaternion)
          } else {
            quaternion = object.quaternion
          }

          const transform: Ammo.Transform = new Ammo.btTransform()
          transform.setIdentity()
          transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z))
          transform.setRotation(
            new Ammo.btQuaternion(
              quaternion.x,
              quaternion.y,
              quaternion.z,
              quaternion.w,
            ),
          )
          const motionState: Ammo.MotionState = new Ammo.btDefaultMotionState(
            transform,
          )

          const localInertia: Ammo.Vector3 = new Ammo.btVector3(0, 0, 0)
          shape.calculateLocalInertia(mass, localInertia)

          const rbInfo: Ammo.RigidBodyConstructionInfo =
            new Ammo.btRigidBodyConstructionInfo(
              mass,
              motionState,
              shape,
              localInertia,
            )

          const body: Ammo.RigidBody = new Ammo.btRigidBody(rbInfo)
          body.setFriction(0.5)

          if (vel) {
            body.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z))
          }

          if (angVel) {
            body.setAngularVelocity(
              new Ammo.btVector3(angVel.x, angVel.y, angVel.z),
            )
          }

          object.userData.physicsBody = body
          object.userData.collided = false

          if (addToScene) scene.add(object)

          if (mass > 0) {
            rigidBodies.push(object)

            // Disable deactivation
            body.setActivationState(4)
          }

          physicsWorld.addRigidBody(body)

          return body
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

        const playerBody: Ammo.RigidBody = createRigidBody({
          object: playerObject,
          shape: playerShape,
          mass: 100,
        })
        playerBody.setFriction(0.5)
        playerBody.setRestitution(0)
        playerBody.setAngularFactor(0, 0, 0)
        playerObject.position.set(ROOM_SIZE / 4, 0, ROOM_SIZE / 4)

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
        windowEvents.push({ name: 'resize', cb: onResize })

        const heldKeys: Record<string, boolean> = {}

        const onKeyup: (ev: KeyboardEvent) => void = (
          ev: KeyboardEvent,
        ): void => {
          heldKeys[ev.key] = false
          heldKeys[ev.code] = false
        }
        window.addEventListener('keyup', onKeyup)
        windowEvents.push({ name: 'keyup', cb: onKeyup })

        const onKeydown: (ev: KeyboardEvent) => void = (
          ev: KeyboardEvent,
        ): void => {
          if (heldKeys[ev.key] || heldKeys[ev.code]) return

          switch (ev.key) {
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

          heldKeys[ev.key] = true
          heldKeys[ev.code] = true
        }
        window.addEventListener('keydown', onKeydown)
        windowEvents.push({ name: 'keydown', cb: onKeydown })

        const MAX_CAMERA_SPEED: number = 0.3

        let timeoutHandle: NodeJS.Timeout

        const onPointerMove = (ev: PointerEvent): void => {
          if (!player.current?.mouseLocked) return

          if (ev.movementX !== 0) {
            // playerObject.rotateY(
            //   -Math.max(
            //     Math.min(ev.movementX / 750, MAX_CAMERA_SPEED),
            //     -MAX_CAMERA_SPEED,
            //   ),
            // )

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

            timeoutHandle = setTimeout(() => {
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
        window.addEventListener('pointermove', onPointerMove)
        windowEvents.push({ name: 'pointermove', cb: onPointerMove })

        const lockChangeAlert = (): void => {
          if (document.pointerLockElement === renderer.current?.domElement) {
            player.current!.mouseLocked = true
          } else {
            player.current!.mouseLocked = false
          }
        }
        document.addEventListener('pointerlockchange', lockChangeAlert)
        documentEvents.push({ name: 'pointerlockchange', cb: lockChangeAlert })

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
        window.addEventListener('mousedown', onMouseDown)
        windowEvents.push({ name: 'mousedown', cb: onMouseDown })

        const onMouseUp = (): void => {
          rendererContainer.current?.classList.remove(styles.grabbing)
        }
        window.addEventListener('mouseup', onMouseUp)
        windowEvents.push({ name: 'mouseup', cb: onMouseUp })

        function updatePhysics(deltaTime: DOMHighResTimeStamp) {
          // const staticAngularVelocity = new Ammo.btVector3(
          //   0,
          //   playerBody.getAngularVelocity().y(),
          //   0,
          // )
          // playerBody.setAngularVelocity(staticAngularVelocity)

          // Step world
          physicsWorld.stepSimulation(deltaTime, 10)

          // playerBody.setAngularVelocity(staticAngularVelocity)

          // Update rigid bodies
          for (let i: number = 0; i < rigidBodies.length; i++) {
            const objThree: THREE.Object3D = rigidBodies[i]
            const objPhys: Ammo.RigidBody = objThree.userData.physicsBody
            const ms: Ammo.MotionState = objPhys.getMotionState()

            if (ms) {
              ms.getWorldTransform(transformAux1)
              const p: Ammo.Vector3 = transformAux1.getOrigin()
              const q: Ammo.Quaternion = transformAux1.getRotation()
              objThree.position.set(p.x(), p.y(), p.z())
              objThree.quaternion.set(q.x(), q.y(), q.z(), q.w())

              objThree.userData.collided = false
            }
          }
        }

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

          const deltaTime: number = clock.getDelta()
          updatePhysics(deltaTime)

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

      for (const event of documentEvents) {
        document.removeEventListener(event.name, event.cb)
      }

      for (const event of windowEvents) {
        window.removeEventListener(event.name, event.cb)
      }
    }
  }, [])

  return (
    <div className={styles.app}>
      <div ref={rendererContainer} className={styles.container}></div>
    </div>
  )
}

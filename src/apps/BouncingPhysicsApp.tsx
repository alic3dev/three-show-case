import type { AppComponent } from '@/apps/types'

import React from 'react'

import * as THREE from 'three'
import WebGL from 'three/addons/capabilities/WebGL'
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { LOCAL_STORAGE_KEYS } from '@/utils/constants'

import styles from '@/apps/BouncingPhysicsApp.module.scss'

export const displayName: string = 'Bouncing Physics'

export const BouncingPhysicsApp: AppComponent = (): React.ReactElement => {
  const statsPanel = React.useRef<{ value: number }>({ value: 0 })

  const webGLSupported = React.useRef<{ value: boolean }>({ value: true })

  const renderer = React.useRef<THREE.WebGLRenderer>()
  const rendererContainer = React.useRef<HTMLDivElement>(null)
  const rendererProperties = React.useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    stats: Stats
    objects: Record<string, THREE.Object3D>
    ambientLight: THREE.AmbientLight
    pointLights: THREE.Light[]
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
      renderer.current.setClearColor(0x0d0d0d)

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
    const events: {
      name: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cb: (...args: any[]) => void
    }[] = []

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
        camera.position.set(0, 20, 20)
        camera.lookAt(0, 0, 0)

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

        const matFloor = new THREE.MeshPhongMaterial({
          color: 0x808080,
        })
        const geoFloor: THREE.BoxGeometry = new THREE.BoxGeometry(
          100,
          1,
          100,
          1,
          1,
        )
        const mshFloor: THREE.Mesh = new THREE.Mesh(geoFloor, matFloor)
        mshFloor.position.set(0, -0.5, 0)

        const floorShape: Ammo.BoxShape = new Ammo.btBoxShape(
          new Ammo.btVector3(100, 0.5, 100),
        )
        const floorBody: Ammo.RigidBody = createRigidBody({
          object: mshFloor,
          shape: floorShape,
        })
        floorBody.setFriction(0.5)
        floorBody.setRestitution(1)

        const xMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
          color: 0xff0000,
        })
        const yMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
          color: 0x00ff00,
        })
        const zMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
          color: 0x0000ff,
        })

        const xPoints: THREE.Vector3[] = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(1, 0, 0),
        ]
        const yPoints: THREE.Vector3[] = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 1, 0),
        ]
        const zPoints: THREE.Vector3[] = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, 1),
        ]

        const xGeometry: THREE.BufferGeometry =
          new THREE.BufferGeometry().setFromPoints(xPoints)
        const yGeometry: THREE.BufferGeometry =
          new THREE.BufferGeometry().setFromPoints(yPoints)
        const zGeometry: THREE.BufferGeometry =
          new THREE.BufferGeometry().setFromPoints(zPoints)

        const xLine: THREE.Line = new THREE.Line(xGeometry, xMaterial)
        const yLine: THREE.Line = new THREE.Line(yGeometry, yMaterial)
        const zLine: THREE.Line = new THREE.Line(zGeometry, zMaterial)

        const grid: THREE.GridHelper = new THREE.GridHelper(
          100,
          100,
          0x666666,
          0x333333,
        )

        const ambientLight: THREE.AmbientLight = new THREE.AmbientLight(
          0x444444,
        )

        // const spotLight: THREE.SpotLight = new THREE.SpotLight(
        //   0xffffff,
        //   10,
        //   0,
        //   Math.PI / 2,
        //   1,
        //   1,
        // )
        // spotLight.position.set(0, 15, 0)

        // const directionalLight: THREE.DirectionalLight =
        //   new THREE.DirectionalLight(0xffffff, 1)
        // directionalLight.position.set(0, 15, 0)

        // spotLight.lookAt(new THREE.Vector3(0, 0, 0))

        const pointLightOne: THREE.PointLight = new THREE.PointLight(
          0xffffff,
          10,
        )
        pointLightOne.position.set(0, 10, 0)

        const pointLightTwo: THREE.PointLight = new THREE.PointLight(
          0x0000ff,
          50,
        )
        pointLightTwo.position.set(9, 0, 9)

        const pointLightThree: THREE.PointLight = new THREE.PointLight(
          0x0000ff,
          50,
        )
        pointLightThree.position.set(-9, 0, -9)

        const pointLightFour: THREE.PointLight = new THREE.PointLight(
          0x0000ff,
          50,
        )
        pointLightFour.position.set(9, 0, -9)

        const pointLightFive: THREE.PointLight = new THREE.PointLight(
          0x0000ff,
          50,
        )
        pointLightFive.position.set(-9, 0, 9)

        const pointLightSix: THREE.PointLight = new THREE.PointLight(
          0xff0000,
          100,
        )
        pointLightSix.position.set(0, 0, 0)

        const pointLights: THREE.Light[] = [
          // directionalLight,
          // spotLight,
          pointLightOne,
          // pointLightTwo,
          // pointLightThree,
          // pointLightFour,
          // pointLightFive,
          pointLightSix,
        ]

        for (const pointLight of pointLights) {
          pointLight.castShadow = true
          // pointLight.receiveShadow = true

          if (pointLight.shadow) {
            pointLight.shadow.mapSize.width = 8192 / 8
            pointLight.shadow.mapSize.height = pointLight.shadow.mapSize.width
            pointLight.shadow.radius = 2
          }
        }

        const sphereGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(
          0.5,
        )
        const sphereMaterial: THREE.MeshPhongMaterial =
          new THREE.MeshPhongMaterial({
            color: 0x808080,
            specular: 0x050505,
            shininess: 1000,
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
            ((Math.abs((z - 4.5) / 4.5) + Math.abs((x - 4.5) / 4.5)) / 2) * 60 +
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
          })
          // body.setDamping(0.8, 0)
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
        }: {
          object: THREE.Object3D
          shape: Ammo.Shape
          mass?: number
          pos?: THREE.Vector3
          quaternion?: THREE.Quaternion
          vel?: THREE.Vector3
          angVel?: THREE.Vector3
        }) {
          if (pos) {
            object.position.copy(pos)
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

          scene.add(object)

          if (mass > 0) {
            rigidBodies.push(object)

            // Disable deactivation
            body.setActivationState(4)
          }

          physicsWorld.addRigidBody(body)

          return body
        }

        rendererProperties.current = {
          scene,
          camera,
          stats: new Stats(),
          objects: { mshFloor, grid, xLine, yLine, zLine },
          ambientLight,
          pointLights,
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

        const controls = new OrbitControls(
          rendererProperties.current.camera,
          renderer.current!.domElement,
        )
        controls.target.set(0, 0, 0)
        controls.update()

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

        mshFloor.castShadow = false
        mshFloor.receiveShadow = true

        grid.castShadow = false
        grid.receiveShadow = false

        rendererProperties.current.scene.add(ambientLight)

        rendererProperties.current.scene.add(
          ...rendererProperties.current.pointLights,
        )

        rendererProperties.current!.objects.grid.visible = false
        rendererProperties.current!.objects.xLine.visible = false
        rendererProperties.current!.objects.yLine.visible = false
        rendererProperties.current!.objects.zLine.visible = false

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
        events.push({ name: 'resize', cb: onResize })

        const heldKeys: Record<string, boolean> = {}

        const onKeyup: (ev: KeyboardEvent) => void = (
          ev: KeyboardEvent,
        ): void => {
          heldKeys[ev.key] = false
          heldKeys[ev.code] = false
        }
        window.addEventListener('keyup', onKeyup)
        events.push({ name: 'keyup', cb: onKeyup })

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
              rendererProperties.current!.objects.grid.visible =
                !rendererProperties.current!.objects.grid.visible
              break
            case 'l':
              rendererProperties.current!.objects.xLine.visible =
                !rendererProperties.current!.objects.xLine.visible
              rendererProperties.current!.objects.yLine.visible =
                !rendererProperties.current!.objects.yLine.visible
              rendererProperties.current!.objects.zLine.visible =
                !rendererProperties.current!.objects.zLine.visible
              break
            default:
              break
          }

          heldKeys[ev.key] = true
          heldKeys[ev.code] = true
        }
        window.addEventListener('keydown', onKeydown)
        events.push({ name: 'keydown', cb: onKeydown })

        const onMouseDown = (): void => {
          rendererContainer.current?.classList.add(styles.grabbing)
        }
        window.addEventListener('mousedown', onMouseDown)
        events.push({ name: 'mousedown', cb: onMouseDown })

        const onMouseUp = (): void => {
          rendererContainer.current?.classList.remove(styles.grabbing)
        }
        window.addEventListener('mouseup', onMouseUp)
        events.push({ name: 'mouseup', cb: onMouseUp })

        function updatePhysics(deltaTime: DOMHighResTimeStamp) {
          // Step world
          physicsWorld.stepSimulation(deltaTime, 10)

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

        const clock = new THREE.Clock()
        const animate: XRFrameRequestCallback = (): void => {
          rendererProperties.current?.stats.update()

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

      for (const event of events) {
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

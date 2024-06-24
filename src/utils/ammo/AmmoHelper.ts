import * as THREE from 'three'

export class AmmoHelper {
  private readonly Ammo: Ammo.Ammo
  private readonly physicsWorld: Ammo.DiscreteDynamicsWorld
  private rigidBodies: THREE.Object3D[] = []

  public gravity: number = 7.8

  constructor(Ammo: Ammo.Ammo) {
    this.Ammo = Ammo

    const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration()
    const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration)
    const broadphase = new Ammo.btDbvtBroadphase()
    const solver = new Ammo.btSequentialImpulseConstraintSolver()

    this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
      dispatcher,
      broadphase,
      solver,
      collisionConfiguration,
    )
    this.physicsWorld.setGravity(new Ammo.btVector3(0, -this.gravity, 0))
  }

  createRigidBody({
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
  }): Ammo.RigidBody {
    if (!pos) {
      pos = object.position
    }

    if (quaternion) {
      object.quaternion.copy(quaternion)
    } else {
      quaternion = object.quaternion
    }

    const transform: Ammo.Transform = new this.Ammo.btTransform()
    transform.setIdentity()
    transform.setOrigin(new this.Ammo.btVector3(pos.x, pos.y, pos.z))
    transform.setRotation(
      new this.Ammo.btQuaternion(
        quaternion.x,
        quaternion.y,
        quaternion.z,
        quaternion.w,
      ),
    )
    const motionState: Ammo.MotionState = new this.Ammo.btDefaultMotionState(
      transform,
    )

    const localInertia: Ammo.Vector3 = new this.Ammo.btVector3(0, 0, 0)
    shape.calculateLocalInertia(mass, localInertia)

    const rbInfo: Ammo.RigidBodyConstructionInfo =
      new this.Ammo.btRigidBodyConstructionInfo(
        mass,
        motionState,
        shape,
        localInertia,
      )

    const body: Ammo.RigidBody = new this.Ammo.btRigidBody(rbInfo)
    body.setFriction(0.5)

    if (vel) {
      body.setLinearVelocity(new this.Ammo.btVector3(vel.x, vel.y, vel.z))
    }

    if (angVel) {
      body.setAngularVelocity(
        new this.Ammo.btVector3(angVel.x, angVel.y, angVel.z),
      )
    }

    object.userData.physicsBody = body
    object.userData.collided = false

    if (mass > 0) {
      this.rigidBodies.push(object)

      // Disable deactivation
      body.setActivationState(4)
    }

    this.physicsWorld.addRigidBody(body)

    return body
  }

  step(delta: DOMHighResTimeStamp, paramTwo: number = 10) {
    this.physicsWorld.stepSimulation(delta, paramTwo)

    const transformAux1: Ammo.Transform = new this.Ammo.btTransform()

    // Update rigid bodies
    for (let i: number = 0; i < this.rigidBodies.length; i++) {
      const objThree: THREE.Object3D = this.rigidBodies[i]
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
}

declare module Ammo {
  interface DbvtBroadphase {}
  interface DbvtBroadphaseConstructor {
    new (): DbvtBroadphase
  }

  interface MotionState {
    getWorldTransform(worldTransform: Transform)
  }
  interface MotionStateConstructor {
    new (transform: Transform): MotionState
  }

  interface CollisionConfiguration {}
  interface CollisionConfigurationConstructor {
    new (): CollisionConfiguration
  }

  interface CollisionDispatcher {}
  interface CollisionDispatcherConstructor {
    new (collisionConfiguration: CollisionConfiguration): CollisionDispatcher
  }

  interface SequentialImpulseConstraintSolver {}
  interface SequentialImpulseConstraintSolverConstructor {
    new (): SequentialImpulseConstraintSolver
  }

  interface DiscreteDynamicsWorld {
    setGravity(gravity: Vector3)
    stepSimulation(delta: DOMHighResTimeStamp, paramTwo: number)
    addRigidBody(rigidBody: RigidBody)
  }
  interface DiscreteDynamicsWorldConstructor {
    new (
      dispatcher: CollisionDispatcher,
      broadphase: DbvtBroadphase,
      solver: SequentialImpulseConstraintSolver,
      collisionConfiguration: CollisionConfiguration,
    ): DiscreteDynamicsWorld
  }

  interface RigidBodyConstructionInfo {}
  interface RigidBodyConstructionInfoConstructor {
    new (
      mass: number,
      motionState: MotionState,
      physicsShape: Shape,
      localInertia: Vector3,
    ): RigidBodyConstructionInfo
  }

  interface RigidBody {
    getMotionState(): MotionState
    getCenterOfMassTransform(): Transform
    getLinearVelocity(): Vector3
    getAngularVelocity(): Vector3
    getAngularFactor(): Vector3

    setFriction(friction: number)
    setRestitution(restitution: number)
    setLinearVelocity(velocity: Vector3)
    setAngularVelocity(velocity: Vector3)
    setActivationState(activationState: number)
    setCenterOfMassTransform(transform: Transform)
    setAngularFactor(angularFactor: Vector3)
    setAngularFactor(x: number, y: number, z: number)
  }
  interface RigidBodyConstructor {
    new (rigidBodyConstructionInfo: RigidBodyConstructionInfo): RigidBody
  }

  // activate: ƒ(a)
  // applyCentralForce: ƒ(a)
  // applyCentralImpulse: ƒ(a)
  // applyCentralLocalForce: ƒ(a)
  // applyForce: ƒ(a, c)
  // applyGravity: ƒ()
  // applyImpulse: ƒ(a, c)
  // applyLocalTorque: ƒ(a)
  // applyTorque: ƒ(a)
  // applyTorqueImpulse: ƒ(a)
  // clearForces: ƒ()
  // constructor: ƒ M(a)
  // forceActivationState: ƒ(a)
  // getAabb: ƒ(a, c)
  // getAngularDamping: ƒ()
  // getAngularFactor: ƒ()
  // getAngularVelocity: ƒ()
  // getBroadphaseHandle: ƒ()
  // getBroadphaseProxy: ƒ()
  // getCenterOfMassTransform: ƒ()
  // getCollisionFlags: ƒ()
  // getCollisionShape: ƒ()
  // getFlags: ƒ()
  // getFriction: ƒ()
  // getGravity: ƒ()
  // getLinearDamping: ƒ()
  // getLinearFactor: ƒ()
  // getLinearVelocity: ƒ()
  // getMotionState: ƒ()
  // getRestitution: ƒ()
  // getRollingFriction: ƒ()
  // getUserIndex: ƒ()
  // getUserPointer: ƒ()
  // getWorldTransform: ƒ()
  // isActive: ƒ()
  // isKinematicObject: ƒ()
  // isStaticObject: ƒ()
  // isStaticOrKinematicObject: ƒ()
  // lB: ƒ M(a)
  // setActivationState: ƒ(a)
  // setAngularFactor: ƒ(a)
  // setAngularVelocity: ƒ(a)
  // setAnisotropicFriction: ƒ(a, c)
  // setCcdMotionThreshold: ƒ(a)
  // setCcdSweptSphereRadius: ƒ(a)
  // setCenterOfMassTransform: ƒ(a)
  // setCollisionFlags: ƒ(a)
  // setCollisionShape: ƒ(a)
  // setContactProcessingThreshold: ƒ(a)
  // setDamping: ƒ(a, c)
  // setFlags: ƒ(a)
  // setFriction: ƒ(a)
  // setGravity: ƒ(a)
  // setLinearFactor: ƒ(a)
  // setLinearVelocity: ƒ(a)
  // setMassProps: ƒ(a, c)
  // setMotionState: ƒ(a)
  // setRestitution: ƒ(a)
  // setRollingFriction: ƒ(a)
  // setSleepingThresholds: ƒ(a, c)
  // setUserIndex: ƒ(a)
  // setUserPointer: ƒ(a)
  // setWorldTransform: ƒ(a)
  // upcast: ƒ(a)
  // updateInertiaTensor: ƒ()

  interface Transform {
    setIdentity()
    setOrigin(origin: Vector3)
    setRotation(rotation: Quaternion)
    getOrigin(): Vector3
    getRotation(): Quaternion
  }
  interface TransformConstructor {
    new (): Transform
  }

  //   constructor
  // :
  // ƒ t(a, c)
  // getBasis
  // :
  // ƒ ()
  // getOrigin
  // :
  // ƒ ()
  // getRotation
  // :
  // ƒ ()
  // inverse
  // :
  // ƒ ()
  // lB
  // :
  // ƒ t(a, c)
  // op_mul
  // :
  // ƒ (a)
  // setFromOpenGLMatrix
  // :
  // ƒ (a)
  // setIdentity
  // :
  // ƒ ()
  // setOrigin
  // :
  // ƒ (a)
  // setRotation
  // :
  // ƒ (a)
  // __destroy__

  interface Vector3 {
    x(): number
    y(): number
    z(): number
  }
  interface Vector3Constructor {
    new (x: number, y: number, z: number): Vector3
  }

  interface Quaternion {
    x(): number
    y(): number
    z(): number
    w(): number
  }
  interface QuaternionConstructor {
    new (x: number, y: number, z: number, w: number): Quaternion
  }

  // Shapes
  interface Shape {
    calculateLocalInertia(mass: number, localIntertia: Vector3)
    setMargin(margin: number)
  }

  // "btCollisionShape"
  // "btConcaveShape"
  // "btConvexShape"
  // "btCapsuleShape"
  // "btCylinderShape"
  // "btConeShape"
  // "btTriangleMeshShape"
  // "btConvexTriangleMeshShape"
  // "btBoxShape"
  // "btSphereShape"
  // "btMultiSphereShape"
  // "btConvexHullShape"
  // "btCompoundShape"
  // "btEmptyShape"
  // "btStaticPlaneShape"
  // "btBvhTriangleMeshShape"
  // "btHeightfieldTerrainShape"
  // "btGImpactCompoundShape"
  // "btGImpactMeshShape"

  interface BoxShape extends Shape {}
  interface BoxShapeConstructor {
    new (vector: Vector3): BoxShape
  }

  interface ConeShape extends Shape {}
  interface ConeShapeConstructor {
    new (radius: number, height: number): ConeShape
  }

  interface CylinderShape extends Shape {}
  interface CylinderShapeConstructor {
    new (vector: Vector3): CylinderShape
  }

  interface SphereShape extends Shape {}
  interface SphereShapeConstructor {
    new (radius: number): SphereShape
  }

  interface Ammo {
    btDefaultMotionState: MotionStateConstructor
    btDefaultCollisionConfiguration: CollisionConfigurationConstructor

    btCollisionDispatcher: CollisionDispatcherConstructor
    btDbvtBroadphase: DbvtBroadphaseConstructor
    btSequentialImpulseConstraintSolver: SequentialImpulseConstraintSolverConstructor
    btDiscreteDynamicsWorld: DiscreteDynamicsWorldConstructor

    btRigidBodyConstructionInfo: RigidBodyConstructionInfoConstructor
    btRigidBody: RigidBodyConstructor

    btVector3: Vector3Constructor
    btQuaternion: QuaternionConstructor
    btTransform: TransformConstructor

    // Shapes
    btBoxShape: BoxShapeConstructor
    btConeShape: ConeShapeConstructor
    btCylinderShape: CylinderShapeConstructor
    btSphereShape: SphereShapeConstructor
  }
}

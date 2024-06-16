import * as THREE from 'three'

/**
 * rotateAboutPoint()
 *
 * @link https://stackoverflow.com/questions/42812861/three-js-pivot-point/42866733#42866733
 *
 * @param object3D
 * @param point Point to rotate around
 * @param axis Axis for rotation (normalized vector)
 * @param theta Radian rotation value
 * @param pointIsWorld Whether point is in world coordinates
 */
export function rotateAboutPoint({
  object3D,
  point,
  axis,
  theta,
  pointIsWorld = false,
}: {
  object3D: THREE.Object3D
  point: THREE.Vector3
  axis: THREE.Vector3
  theta: number
  pointIsWorld?: boolean
}) {
  if (pointIsWorld) {
    object3D.parent?.localToWorld(object3D.position)
  }

  object3D.position.sub(point)
  object3D.position.applyAxisAngle(axis, theta)
  object3D.position.add(point)

  if (pointIsWorld) {
    object3D.parent?.worldToLocal(object3D.position)
  }

  object3D.rotateOnAxis(axis, theta)
}

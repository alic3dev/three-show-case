import * as THREE from 'three'

export type DistrictName = 'cityCenter'

export interface DistrictDebugObjectsInterface {
  line: THREE.Mesh
  sphere: THREE.Mesh
}

export class District {
  position: THREE.Vector2
  radius: number

  debugObjects: DistrictDebugObjectsInterface

  constructor({
    position,
    radius,
    scale,
  }: {
    position: THREE.Vector2
    radius: number
    scale: number
  }) {
    this.position = position
    this.radius = radius

    this.debugObjects = {
      line: new THREE.Mesh(
        new THREE.BoxGeometry(0.1 * scale, 100 * scale, 0.1 * scale),
        new THREE.MeshBasicMaterial({ color: 0x00ffff }),
      ),
      sphere: new THREE.Mesh(
        new THREE.SphereGeometry(this.radius * scale),
        new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
        }),
      ),
    }

    this.debugObjects.line.position.set(
      this.position.x * scale,
      5 * scale,
      this.position.y * scale,
    )
    this.debugObjects.line.visible = false

    this.debugObjects.sphere.position.set(
      this.position.x * scale,
      0,
      this.position.y * scale,
    )
    this.debugObjects.sphere.visible = false
  }

  contains(point: THREE.Vector2Like): boolean {
    return this.position.distanceTo(point) <= this.radius
  }
}

import * as THREE from 'three'

export function createAxesLines(): THREE.AxesHelper {
  // const axesLines: THREE.Group = new THREE.Group()
  // axesLines.add(
  //   new THREE.Line(
  //     new THREE.BufferGeometry().setFromPoints([
  //       new THREE.Vector3(0, 0, 0),
  //       new THREE.Vector3(1, 0, 0),
  //     ]),
  //     new THREE.LineBasicMaterial({
  //       color: 16711680,
  //     }),
  //   ),
  //   new THREE.Line(
  //     new THREE.BufferGeometry().setFromPoints([
  //       new THREE.Vector3(0, 0, 0),
  //       new THREE.Vector3(0, 1, 0),
  //     ]),
  //     new THREE.LineBasicMaterial({
  //       color: 65280,
  //     }),
  //   ),
  //   new THREE.Line(
  //     new THREE.BufferGeometry().setFromPoints([
  //       new THREE.Vector3(0, 0, 0),
  //       new THREE.Vector3(0, 0, 1),
  //     ]),
  //     new THREE.LineBasicMaterial({
  //       color: 255,
  //     }),
  //   ),
  // )

  return new THREE.AxesHelper(1)
}

import * as THREE from 'three'

export function createGrid(): THREE.GridHelper {
  return new THREE.GridHelper(100, 100, 0x666666, 0x333333)
}

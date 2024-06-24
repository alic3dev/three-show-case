import * as THREE from 'three'

export function randomColor(minBrightness: number = 0.3): THREE.Color {
  const ranMax: number = 1 - minBrightness

  return new THREE.Color().set(
    Math.random() * ranMax + minBrightness,
    Math.random() * ranMax + minBrightness,
    Math.random() * ranMax + minBrightness,
  )
}

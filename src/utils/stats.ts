import OriginalStats from 'three/addons/libs/stats.module'

export class Stats extends OriginalStats {
  static className: string = 'three-stats-panel'

  static stylePropertiesToRemove: string[] = [
    'position',
    'top',
    'left',
    'cursor',
    'opacity',
    'z-index',
  ]

  constructor() {
    super()

    for (const property of Stats.stylePropertiesToRemove) {
      this.dom.style.removeProperty(property)
    }

    this.dom.classList.add(Stats.className)
  }
}

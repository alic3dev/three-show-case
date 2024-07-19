import OriginalStats from 'three/addons/libs/stats.module'

export class Stats extends OriginalStats {
  constructor() {
    super()

    this.dom.style.position = 'absolute'
  }
}

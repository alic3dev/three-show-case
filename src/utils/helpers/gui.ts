import { GUI as _GUI } from 'three/addons/libs/lil-gui.module.min.js'

import { isMobile } from '@/utils/isMobile'

export class GUI extends _GUI {
  constructor(args?: {
    autoPlace?: boolean
    container?: HTMLElement
    width?: number
    title?: string
    injectStyles?: boolean
    touchStyles?: number
    parent?: GUI
  }) {
    super(args)

    if (isMobile()) {
      this.close()
    }
  }
}

interface ContainerEvent {
  type: keyof HTMLElementEventMap
  listener: EventListener
}

interface DocumentEvent {
  type: keyof DocumentEventMap
  listener: EventListener
}

interface WindowEvent {
  type: keyof WindowEventMap
  listener: EventListener
}

export class EventsManager {
  private containerEvents: ContainerEvent[] = []
  private documentEvents: DocumentEvent[] = []
  private windowEvents: WindowEvent[] = []

  private containerElement?: HTMLElement

  constructor(containerElement?: HTMLElement) {
    this.containerElement = containerElement
  }

  addContainerEvent<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
  ): void {
    if (!this.containerElement) throw new Error('No container element')

    this.containerElement.addEventListener(type, listener)

    this.containerEvents.push({
      type,
      listener: listener as EventListener,
    })
  }

  addDocumentEvent<K extends keyof DocumentEventMap>(
    type: K,
    listener: (event: DocumentEventMap[K]) => void,
  ): void {
    document.addEventListener(type, listener)

    this.documentEvents.push({
      type,
      listener: listener as EventListener,
    })
  }

  addWindowEvent<K extends keyof WindowEventMap>(
    type: K,
    listener: (event: WindowEventMap[K]) => void,
  ): void {
    window.addEventListener(type, listener)

    this.windowEvents.push({
      type,
      listener: listener as EventListener,
    })
  }

  removeContainerEvents(): void {
    if (!this.containerElement) return

    for (const event of this.containerEvents) {
      this.containerElement.removeEventListener(event.type, event.listener)
    }

    this.containerEvents.splice(0)
  }

  removeDocumentEvents(): void {
    for (const event of this.documentEvents) {
      document.removeEventListener(event.type, event.listener)
    }

    this.documentEvents.splice(0)
  }

  removeWindowEvents(): void {
    for (const event of this.windowEvents) {
      window.removeEventListener(event.type, event.listener)
    }

    this.windowEvents.splice(0)
  }

  removeAllEvents(): void {
    this.removeContainerEvents()
    this.removeDocumentEvents()
    this.removeWindowEvents()
  }
}

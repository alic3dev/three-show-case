interface DocumentEvent {
  type: keyof DocumentEventMap
  listener: EventListener
}

interface WindowEvent {
  type: keyof WindowEventMap
  listener: EventListener
}

export class EventsManager {
  private documentEvents: DocumentEvent[] = []
  private windowEvents: WindowEvent[] = []

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
    this.removeDocumentEvents()
    this.removeWindowEvents()
  }
}

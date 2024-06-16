declare global {
  interface Window {
    Ammo: () => Promise<Ammo.Ammo>
  }
}

export const addAmoLoaderToWindow = (): void => {
  if (Object.prototype.hasOwnProperty.call(window, 'Ammo')) return

  window.Ammo = (): Promise<Ammo.Ammo> =>
    new Promise<Ammo.Ammo>((resolve): void => {
      import('ammo.js')
        .then((a): unknown => a.default())
        .then((c: unknown): void => resolve(c as Ammo.Ammo))
    })
}

declare global {
  interface Window {
    Ammo: () => Promise<Ammo.Ammo>
  }
}

export const addAmoLoaderToWindow = (): void => {
  if (Object.prototype.hasOwnProperty.call(window, 'Ammo')) return

  window.Ammo = (): Promise<Ammo.Ammo> =>
    new Promise<Ammo.Ammo>((resolve: (value: Ammo.Ammo) => void): void => {
      import('ammo.js')
        .then((a: { default: () => Ammo.Ammo }): Ammo.Ammo => a.default())
        .then((c: Ammo.Ammo): void => resolve(c))
    })
}

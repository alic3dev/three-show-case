import { UUID } from 'crypto'

export function cryptoRandomUUIDPolyfill(): UUID {
  const uInt8Array: Uint8Array = new Uint8Array(1)

  return '10000000-1000-4000-8000-100000000000'.replace(
    /[018]/g,
    (character: string): string => {
      const characterInt: number = parseInt(character)
      const randomValue: number = crypto.getRandomValues(uInt8Array)[0]
      const xorBy: number = randomValue & (characterInt === 8 ? 3 : 15)
      const value: number = characterInt ^ xorBy

      return value.toString(16)
    },
  ) as UUID
}

export function setAllRequiredPolyfills(): void {
  if (!Object.prototype.hasOwnProperty.call(crypto, 'randomUUID')) {
    crypto.randomUUID = cryptoRandomUUIDPolyfill
  }
}

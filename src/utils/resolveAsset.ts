import _cfData from '@/data/cf-client.json'
const cfData = _cfData as Record<string, string | undefined>

function returnAssetPath(path: string): string {
  return `/assets/${path}`
}

export function resolveAsset(path: string): string {
  if (
    import.meta.env.VITE_VERCEL_ENV !== 'production' &&
    import.meta.env.VITE_VERCEL_ENV !== 'preview' &&
    import.meta.env.VITE_CF_USE_ON_DEV !== 'true'
  ) {
    return returnAssetPath(path)
  }

  const cfDataPath: string | undefined = cfData[path]

  if (cfDataPath) {
    return `https://${import.meta.env.VITE_CF_DISTRIBUTION_DOMAIN}/${
      import.meta.env.VITE_CF_PREFIX
    }${cfDataPath}`
  }

  return returnAssetPath(path)
}

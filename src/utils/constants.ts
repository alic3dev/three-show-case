type LocalStorageKeyNames = 'statsPanel' | 'drawerOpen'

const localStorageKeyPrefix: string = 'three-showcase:'

export const LOCAL_STORAGE_KEYS: Record<LocalStorageKeyNames, string> = {
  statsPanel: `${localStorageKeyPrefix}current_stats_panel`,
  drawerOpen: `${localStorageKeyPrefix}side-drawer-open`,
}

export function isMobile(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

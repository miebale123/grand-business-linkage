const AREA_PREFERENCE_KEY = 'business-linkage-preferred-area'

export function getAreaLabel(location?: string | null) {
  if (!location) {
    return ''
  }

  return location.split(',')[0]?.trim() || location.trim()
}

export function getPreferredMarketplaceArea() {
  return window.localStorage.getItem(AREA_PREFERENCE_KEY) || ''
}

export function savePreferredMarketplaceArea(area?: string) {
  const nextArea = area?.trim()

  if (!nextArea || nextArea === 'All Areas') {
    window.localStorage.removeItem(AREA_PREFERENCE_KEY)
    return
  }

  window.localStorage.setItem(AREA_PREFERENCE_KEY, nextArea)
}

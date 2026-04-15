import { ref } from 'vue'

const FAVORITES_KEY = 'marketplace:favorites'

const favoriteIds = ref<string[]>([])
let hydrated = false
let storageBound = false

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readFavorites() {
  if (!canUseStorage()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : []
  } catch {
    return []
  }
}

function writeFavorites(nextIds: string[]) {
  favoriteIds.value = nextIds

  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(nextIds))
}

function ensureHydrated() {
  if (!hydrated) {
    favoriteIds.value = readFavorites()
    hydrated = true
  }

  if (!storageBound && canUseStorage()) {
    window.addEventListener('storage', (event) => {
      if (event.key === FAVORITES_KEY) {
        favoriteIds.value = readFavorites()
      }
    })
    storageBound = true
  }
}

export function useFavorites() {
  ensureHydrated()

  function isFavorite(productId: string) {
    return favoriteIds.value.includes(productId)
  }

  function toggleFavorite(productId: string) {
    const nextIds = isFavorite(productId)
      ? favoriteIds.value.filter((id) => id !== productId)
      : [...favoriteIds.value, productId]

    writeFavorites(nextIds)
    return nextIds.includes(productId)
  }

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
  }
}

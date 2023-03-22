export const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`
export const ORIGIN_URL = `https://localhost:${import.meta.env.VITE_PORT}`

export const getImageUrl = (src: string | null) => src && `${SERVER_URL}/images/${src}`

export const getCaptureUrl = (capture: string) => capture.endsWith('.mp4') ?
  `${SERVER_URL}/capture/${capture}`.replace('.mp4', '.gif') : `${SERVER_URL}/capture/${capture}`

type SelectionCacheItem = { type: '1-2' | '2-3', key: number, value: number }
const selectionCache: SelectionCacheItem[] = []

export function setSelectionCache(item: SelectionCacheItem) {
  const CACHE_MAX_ITEMS = 500
  selectionCache.length + 1 <= CACHE_MAX_ITEMS ?
    selectionCache.unshift(item) :
    (selectionCache.pop(), selectionCache.unshift(item))
}

export function getSelectionCache({ type, key }:
{ type: SelectionCacheItem['type'], key: SelectionCacheItem['key'] | null}) {
  if (key == null) return undefined
  return selectionCache.find((item) => item.type == type && item.key == key)
}

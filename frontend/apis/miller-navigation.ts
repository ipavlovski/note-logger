import { useHotkeys } from '@mantine/hooks'

import { useCategoryChain, useQueryCache } from 'frontend/apis/queries'
import { useMillerStore, useParentId } from 'frontend/apis/stores'


const getPrevIndex = <T,>(arr: Array<T & { id: number }> | undefined, id: number | null) => {
  if (id == null || arr == null) return null
  const ind = arr.findIndex((elt) => elt.id == id)
  return ind != null && ind > 0 ? ind - 1 : null
}

const getNextIndex = <T,>(arr: Array<T & { id: number }> | undefined, id: number | null) => {
  if (id == null || arr == null) return null
  const ind = arr.findIndex((elt) => elt.id == id)
  return ind != null && ind != -1 && ind + 1 < arr.length ? ind + 1 : null
}


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


const scrollMap = new Map<string,() => any>()
export function setScrollElement(columnIndex: number, nodeId: number, ref: () => any) {
  scrollMap.set(`${columnIndex}-${nodeId}`, ref)
}
export function getScrollElement(columnIndex: number, nodeId: number) {
  return scrollMap.get(`${columnIndex}-${nodeId}`)
}


export const useArrowShortcuts = () => {
  const [firstId, secondId, thirdId] = useMillerStore((state) => state.selection)
  const [selectFirst, selectSecond, selectThird] = useMillerStore((state) => state.selectAction)
  const queryCache = useQueryCache()
  const chain = useCategoryChain()

  const columnIndex = firstId && secondId && thirdId ? 2 : firstId && secondId ? 1 : 0
  const parentId = useParentId(columnIndex)
  const categoryId = chain[columnIndex + 1]?.id

  useHotkeys([
    ['ArrowLeft', () => {
      if (columnIndex == 1 && firstId != null) {
        selectFirst(firstId)
        const scroll = getScrollElement(0, firstId)
        scroll && scroll()
      }

      if (columnIndex == 2 && secondId != null) {
        selectSecond(secondId)
        const scroll = getScrollElement(1, secondId)
        scroll && scroll()
      }

    }],

    ['ArrowRight',() => {

      if (columnIndex == 0) {
        // get the cached value (if there is one)
        let secondId: number | undefined = getSelectionCache( { type: '1-2', key: firstId })?.value

        // if there is no cached value, select the 'first node' in the list
        if (secondId == null) {
          const secondColumnNodes = queryCache.getNodes({
            categoryId: chain[2]?.id, columnIndex: 1, parentId: firstId
          })
          secondId = secondColumnNodes && secondColumnNodes[0]?.id
        }

        // if there was no first node in the list, will not do anything
        // if there was a cached value OR a first node, then will select it and scroll to it
        if (secondId != null) {
          selectSecond(secondId)
          const scroll = getScrollElement(1, secondId)
          scroll && scroll()
        }

      }

      if (columnIndex == 1) {
        // get the cached value (if there is one)
        let thirdId: number | undefined = getSelectionCache( { type: '2-3', key: secondId })?.value

        // if there is no cached value, select the 'first node' in the list
        if (thirdId == null) {
          const thirdColumnNodes = queryCache.getNodes({
            categoryId: chain[3]?.id, columnIndex: 2, parentId: secondId
          })
          thirdId = thirdColumnNodes && thirdColumnNodes[0]?.id
        }

        // if there was no first node in the list, will not do anything
        // if there was a cached value OR a first node, then will select it and scroll to it
        if (thirdId != null) {
          selectThird(thirdId)
          const scroll = getScrollElement(2, thirdId)
          scroll && scroll()
        }

      }
    }],

    ['ArrowUp',() => {

      if (columnIndex == 0) {
        const firstColumnNodes = queryCache.getNodes({ categoryId, columnIndex, parentId })
        const ind = getPrevIndex(firstColumnNodes, firstId)

        if (ind != null && firstColumnNodes != null) {
          selectFirst(firstColumnNodes[ind].id)
          const scroll = getScrollElement(columnIndex, firstColumnNodes[ind].id)
          scroll && scroll()
        }
      }

      if (columnIndex == 1) {
        const secondColumnNodes = queryCache.getNodes({ categoryId, columnIndex, parentId })
        const ind = getPrevIndex(secondColumnNodes, secondId)

        if (ind != null && secondColumnNodes != null) {
          selectSecond(secondColumnNodes[ind].id)
          const scroll = getScrollElement(columnIndex, secondColumnNodes[ind].id)
          scroll && scroll()
        }
      }

      if (columnIndex == 2) {
        const thirdColumnNodes = queryCache.getNodes({ categoryId, columnIndex, parentId })
        const ind = getPrevIndex(thirdColumnNodes, thirdId)
        ind != null && thirdColumnNodes != null && selectThird(thirdColumnNodes[ind].id)

        if (ind != null && thirdColumnNodes != null) {
          selectThird(thirdColumnNodes[ind].id)
          const scroll = getScrollElement(columnIndex, thirdColumnNodes[ind].id)
          scroll && scroll()
        }
      }
    }],

    ['ArrowDown',() => {

      if (columnIndex == 0) {
        const firstColumnNodes = queryCache.getNodes({ categoryId, columnIndex, parentId })
        const ind = getNextIndex(firstColumnNodes, firstId)

        if (ind != null && firstColumnNodes != null) {
          selectFirst(firstColumnNodes[ind].id)
          const scroll = getScrollElement(columnIndex, firstColumnNodes[ind].id)
          scroll && scroll()
        }
      }

      if (columnIndex == 1) {
        const secondColumnNodes = queryCache.getNodes({ categoryId, columnIndex, parentId })
        const ind = getNextIndex(secondColumnNodes, secondId)

        if (ind != null && secondColumnNodes != null) {
          selectSecond(secondColumnNodes[ind].id)
          const scroll = getScrollElement(columnIndex, secondColumnNodes[ind].id)
          scroll && scroll()
        }
      }

      if (columnIndex == 2) {
        const thirdColumnNodes = queryCache.getNodes({ categoryId, columnIndex, parentId })
        const ind = getNextIndex(thirdColumnNodes, thirdId)

        if (ind != null && thirdColumnNodes != null) {
          selectThird(thirdColumnNodes[ind].id)
          const scroll = getScrollElement(columnIndex, thirdColumnNodes[ind].id)
          scroll && scroll()
        }
      }
    }],
  ])
}

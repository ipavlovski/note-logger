import { useHotkeys } from '@mantine/hooks'

import { useCategoryChain, useQueryCache } from 'frontend/apis/queries'
import { useMillerStore, useParentId } from 'frontend/apis/stores'
import { getSelectionCache } from 'frontend/apis/utils'


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
      if (columnIndex == 2) secondId != null && selectSecond(secondId)
      if (columnIndex == 1) firstId != null && selectFirst(firstId)
    }],

    ['ArrowRight',() => {

      if (columnIndex == 0) {
        const cachedId = getSelectionCache( { type: '1-2', key: firstId })
        if (cachedId != null) selectSecond(cachedId.value)

        if (cachedId == null) {
          const secondColumnNodes = queryCache.getNodes({
            categoryId: chain[2]?.id, columnIndex: 1, parentId: firstId
          })
          if (secondColumnNodes && secondColumnNodes[0]?.id) selectSecond(secondColumnNodes[0].id)
        }
      }

      if (columnIndex == 1) {
        const cachedId = getSelectionCache( { type: '2-3', key: secondId })
        if (cachedId != null) selectThird(cachedId.value)

        if (cachedId == null) {
          const thirdColumnNodes = queryCache.getNodes({
            categoryId: chain[3]?.id, columnIndex: 2, parentId: secondId
          })
          if (thirdColumnNodes && thirdColumnNodes[0]?.id) selectThird(thirdColumnNodes[0].id)
        }
      }
    }],

    ['ArrowUp',() => {

      if (columnIndex == 0) {
        const firstColumnNodes = queryCache.getNodes({ categoryId, columnIndex, parentId })
        const ind = getPrevIndex(firstColumnNodes, firstId)
        ind != null && firstColumnNodes != null && selectFirst(firstColumnNodes[ind].id)
      }

      if (columnIndex == 1) {
        const secondColumnNodes = queryCache.getNodes({ categoryId, columnIndex, parentId })
        const ind = getPrevIndex(secondColumnNodes, secondId)
        ind != null && secondColumnNodes != null && selectSecond(secondColumnNodes[ind].id)
      }

      if (columnIndex == 2) {
        const thirdColumnNodes = queryCache.getNodes({ categoryId, columnIndex, parentId })
        const ind = getPrevIndex(thirdColumnNodes, thirdId)
        ind != null && thirdColumnNodes != null && selectThird(thirdColumnNodes[ind].id)

      }
    }],

    ['ArrowDown',() => {

      if (columnIndex == 0) {
        const firstColumnNodes = queryCache.getNodes({ categoryId, columnIndex, parentId })
        const ind = getNextIndex(firstColumnNodes, firstId)
        ind != null && firstColumnNodes != null && selectFirst(firstColumnNodes[ind].id)
      }

      if (columnIndex == 1) {
        const secondColumnNodes = queryCache.getNodes({ categoryId, columnIndex, parentId })
        const ind = getNextIndex(secondColumnNodes, secondId)
        ind != null && secondColumnNodes != null && selectSecond(secondColumnNodes[ind].id)
      }

      if (columnIndex == 2) {
        const thirdColumnNodes = queryCache.getNodes({ categoryId, columnIndex, parentId })
        const ind = getNextIndex(thirdColumnNodes, thirdId)
        ind != null && thirdColumnNodes != null && selectThird(thirdColumnNodes[ind].id)
      }
    }],
  ])
}

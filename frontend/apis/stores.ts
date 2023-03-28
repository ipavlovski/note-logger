import { create } from 'zustand'

import { setSelectionCache } from 'frontend/apis/miller-navigation'

interface MillerStore {
  chainName: string
  selection: [number | null, number | null, number | null]
  selectAction: [
    (nodeId: number| null) => void,
    (nodeId: number | null) => void,
    (nodeId: number | null) => void
  ]
  actions: {
    setChainName: (chainName: string) => void
  }
}

export const useMillerStore = create<MillerStore>((set) => ({
  selection: [null, null, null],
  chainName: 'daily-log',
  selectAction: [
    (nodeId) => set((state) => {
      const [firstId, secondId, thirdId] = state.selection

      if (thirdId != null && secondId != null)
        setSelectionCache({ type: '2-3', key: secondId, value: thirdId })
      if (firstId != null && secondId != null)
        setSelectionCache({ type: '1-2', key: firstId, value: secondId })

      return { selection: [nodeId, null, null] }
    }),

    (nodeId) => set((state) => {
      const [firstId, secondId, thirdId] = state.selection

      if (thirdId != null && secondId != null)
        setSelectionCache({ type: '2-3', key: secondId, value: thirdId })
      if (firstId != null && secondId != null)
        setSelectionCache({ type: '1-2', key: firstId, value: secondId })

      return { selection: [firstId, nodeId, null] }
    }),

    (nodeId) => set((state) => {
      const [firstId, secondId, thirdId] = state.selection

      if (thirdId != null && secondId != null)
        setSelectionCache({ type: '2-3', key: secondId, value: thirdId })

      return { selection: [firstId, secondId, nodeId,] }
    }),

  ],
  actions: {
    setChainName: (chainName) => set((state) => ({ chainName }))
  }
}))

export const useParentId = (columnIndex: 0 | 1 | 2) => {
  const selection = useMillerStore((store) => store.selection)
  const parentId = columnIndex == 0 ? null : selection[columnIndex - 1]

  return parentId
}


interface ActiveEntryStore {
  entryId: number | null
  markdown: string
  actions: {
    setMarkdown: (markdown: string) => void
    setEntry: (entryId: number | null, markdown: string) => void
    clearEntry: () => void
  }
}

const getLocalEntry = () => {
  const entry = localStorage.getItem('entry')
  return entry ?
    JSON.parse(entry) as { entryId: number | null, markdown: string} :
    { entryId: null, markdown: '' }
}

const setLocalEntry = (entryId: number | null, markdown: string) => {
  localStorage.setItem('entry', JSON.stringify({ entryId, markdown }))
  return { entryId, markdown }
}


export const useActiveEntryStore = create<ActiveEntryStore>((set) => ({
  entryId: getLocalEntry().entryId,
  markdown: getLocalEntry().markdown,
  actions: {
    setMarkdown: (markdown) => set((state) => setLocalEntry(state.entryId, markdown)),
    clearEntry: () => set(() => setLocalEntry(null, '')),
    setEntry: (entryId, markdown) => set(() => setLocalEntry(entryId, markdown))
  },
}))

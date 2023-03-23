import { create } from 'zustand'

import { setSelectionCache } from 'frontend/apis/utils'

interface MillerStore {
  chainName: string
  selection: [number | null, number | null, number | null]
  selectAction: [(nodeId: number) => void, (nodeId: number) => void, (nodeId: number) => void]
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

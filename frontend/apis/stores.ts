import { create } from 'zustand'

import { setSelectionCache } from 'frontend/apis/utils'

type MillerSelection = {
  firstId: number | null,
  secondId: number | null,
  thirdId: number | null
}

interface MillerStore {
  chainName: string
  selection: MillerSelection
  actions: {
    selectFirst: (nodeId: number) => void
    selectSecond: (nodeId: number) => void
    selectThird: (nodeId: number) => void
    setChain: (chainName: string) => void
  }
}


export const useMillerStore = create<MillerStore>((set) => ({
  selection: { firstId: null, secondId: null, thirdId: null },
  chainName: 'daily-log',
  actions: {
    selectFirst: (nodeId) => set((state) => {
      const { firstId, secondId, thirdId } = state.selection

      if (thirdId != null && secondId != null)
        setSelectionCache({ type: '2-3', key: secondId, value: thirdId })
      if (firstId != null && secondId != null)
        setSelectionCache({ type: '1-2', key: firstId, value: secondId })

      return { selection: { firstId: nodeId, secondId: null, thirdId: null, } }
    }),

    selectSecond: (nodeId) => set((state) => {
      const { firstId, secondId, thirdId } = state.selection

      if (thirdId != null && secondId != null)
        setSelectionCache({ type: '2-3', key: secondId, value: thirdId })
      if (firstId != null && secondId != null)
        setSelectionCache({ type: '1-2', key: firstId, value: secondId })

      return { selection: { firstId, secondId: nodeId, thirdId: null, } }
    }),

    selectThird: (nodeId) => set((state) => {
      const { firstId, secondId, thirdId } = state.selection

      if (thirdId != null && secondId != null)
        setSelectionCache({ type: '2-3', key: secondId, value: thirdId })

      return { selection: { firstId, secondId, thirdId: nodeId, } }
    }),

    setChain: (chainName) => set((state) => ({ chainName }))

  }
}))

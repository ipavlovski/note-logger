import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'

import client from 'frontend/client'

import { HistoryWithNode } from 'backend/routes/query'

interface NodeList {
  selected: number[],
  active: number | null
}

const initialState: NodeList = {
  selected: [],
  active: null
}

const nodeListSlice = createSlice({
  name: 'nodeList',
  initialState,
  reducers: {
    selectNode(state, action: PayloadAction<number>) {
      state.active = action.payload
    }
  },
})

export const { selectNode } = nodeListSlice.actions

export default nodeListSlice.reducer

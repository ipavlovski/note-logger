import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'

import { nodeListSlice } from 'frontend/slices'
import { nodeViewSlice } from 'frontend/slices'
import { nodeApi } from 'frontend/api'

const store = configureStore({
  reducer: {
    nodeList: nodeListSlice.reducer,
    nodeView: nodeViewSlice.reducer,
    [nodeApi.reducerPath]: nodeApi.reducer,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(nodeApi.middleware),
})

// configure listeners using the provided defaults
setupListeners(store.dispatch)

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export default store

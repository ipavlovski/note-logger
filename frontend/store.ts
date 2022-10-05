import { configureStore } from '@reduxjs/toolkit'

import nodeListReducer from 'components/node-list/node-list-slice'
import nodeViewReducer from 'components/node-view/node-view-slice'

const store = configureStore({
  reducer: {
    nodeList: nodeListReducer,
    nodeView: nodeViewReducer,
  },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

export default store

import NodeList from 'frontend/NodeList'
import styles from 'frontend/App.module.css'
import NodeView from 'frontend/NodeView'
import Omnibar from 'frontend/Omnibar'
import { createContext, useReducer, useState } from 'react'

import { HistoryWithNode, HistoryAcc } from 'common/types'

interface State {
  history: HistoryAcc[]
  activeNodeId: number
  selectedNodes: { id: number; setter: React.Dispatch<React.SetStateAction<boolean>> }[]
}

export interface Context {
  state: State
  dispatch: React.Dispatch<Action>
}

type Action =
  | { type: 'ADD_HISTORY'; payload: HistoryAcc[] }
  | { type: 'ACTIVATE_NODE'; payload: number }
  | {
      type: 'SELECT_NODE'
      payload: { id: number; setter: React.Dispatch<React.SetStateAction<boolean>> }
    }
  | { type: 'DESELECT_NODE'; payload: { id: number } }

const initState: State = {
  history: [],
  activeNodeId: 3,
  selectedNodes: [],
}

export const Context = createContext<Context>({ dispatch: () => {}, state: initState })

function processHist(newAcc: HistoryAcc[], masterAcc: HistoryAcc[]) {
  newAcc.forEach(accNew => {
    const accMatch = masterAcc.find(accMaster => accMaster.title == accNew.title)
    if (accMatch == null) {
     masterAcc.push(accNew)
    } else {
     accNew.children.forEach(histItem => {
       const matchInd = accMatch.children.findIndex(accItem => accItem.node_id == histItem.node_id)
       matchInd == -1 ? accMatch.children.push(histItem) : 
         accMatch.children[matchInd].visited_at = histItem.visited_at
     })
    }
 })
 return masterAcc
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_HISTORY':
      console.log(`INCOMING HISTORY:`, action.payload)
      const newHist = processHist(action.payload, state.history)
      return { ...state, history: newHist }
    case 'ACTIVATE_NODE':
      return { ...state, activeNodeId: action.payload }
    case 'SELECT_NODE':
      action.payload.setter(true)
      return { ...state, selectedNodes: state.selectedNodes.concat(action.payload) }
    case 'DESELECT_NODE':
      state.selectedNodes.find(v => v.id == action.payload.id)?.setter(false)
      return { ...state, selectedNodes: state.selectedNodes.filter(v => v.id != action.payload.id) }
    default:
      return state
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initState)

  return (
    <Context.Provider value={{ state, dispatch }}>
      <div className={styles.container}>
        <Omnibar />
        <NodeList />
        <NodeView />
      </div>
    </Context.Provider>
  )
}

export default App

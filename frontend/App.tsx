import NodeList from "frontend/NodeList"
import styles from "frontend/App.module.css"
import NodeView from "frontend/NodeView"
import Omnibar from "frontend/Omnibar"
import { createContext, useState } from "react"

// fixes the context provider value
export const NodeContext = createContext<any>("")
export const SelectionContext = createContext<any>("")

function App() {
  const [context, setContext] = useState<string>("44900")

  return (
    <NodeContext.Provider value={[context, setContext]}>
      <div className={styles.container}>
        <Omnibar />
        <NodeList />
        <NodeView />
      </div>
    </NodeContext.Provider>
  )
}

export default App

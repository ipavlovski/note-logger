// import React, { ClipboardEvent, useRef, useState, useEffect } from 'react'

// import './index.css'

// import Omnibar from 'frontend/components/Omnibar'
// import Nodes from 'frontend/components/Nodes'
// import Preview from 'frontend/components/Preview'
// import Leafs from 'frontend/components/Leafs'

// function App() {


//   // var tmp = await fetch()



//   return <>
//     {/* <Preview /> */}
//     <Omnibar />
//     <Nodes />
//     <Leafs initmd={''} />
//   </>
// }

// export default App


import NodeList from "frontend/NodeList"
import styles from "frontend/App.module.css"
import NodeView from "frontend/NodeView"
import Omnibar from "frontend/Omnibar"
import { createContext, useState } from "react"

// fixes the context provider value
export const NodeContext = createContext<any>("")

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

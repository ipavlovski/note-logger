import { HistoryWithNode } from "common/types"
import { useState, useEffect, useRef, useContext } from "react"
import styles from "frontend/Nodes.module.css"
import { NodeContext } from 'frontend/App'


function Node(v: HistoryWithNode) {
  const [context, setContext] = useContext(NodeContext);

  const clickHandler = () => {
    setContext(v.node.id)
    console.log(`iri: ${v.node.id}`)
  }
  return (
    <li onClick={clickHandler}>{v.node.title}</li>
  )
}

function NodeList() {
  const [history, setHistory] = useState<HistoryWithNode[]>()
  // const [context, setContext] = useContext(NodeContext);

  const fetchHistory = async (isoString?: Date) => {
    const url = isoString
      ? `https://localhost:3002/history/${isoString}`
      : "https://localhost:3002/history/"
    return await fetch(url).then((v) => v.json())
  }

  useEffect(() => {
    fetchHistory().then(v => {
      setHistory(v)
      // setContext(v[0].node.id)
    })
    
  }, [])


  const listInnerRef = useRef() as React.MutableRefObject<HTMLDivElement>
  const onScroll = () => {
    if (listInnerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listInnerRef.current
      if (scrollTop + clientHeight === scrollHeight) {
        // console.log("Reached bottom")
        if (history != null) {
          const lastHistoryDate = history[history.length - 1].visited_at
          console.log('fetching...')
          fetchHistory(lastHistoryDate).then(v => setHistory(history.concat(v)))
        }
      }
    }
  } 

  if (history == null) {
    return (
      <ul>
        <li>couldnt get proper input</li>
      </ul>
    )
  } else {
    return (
      <div
        onScroll={() => onScroll()}
        ref={listInnerRef}
        style={{
          gridArea: "nodes",
          overflowY: "scroll",
          maxHeight: "95vh",
          transform: `scaleX(-1)`,
        }}
        className={styles.nodes}
      >
        <ul style={{ transform: `scaleX(-1)` }}>
          {history.map((v) => {
            return <Node {...v} key={v.id}/>
          })}
        </ul>
      </div>
    )
  }
}

export default NodeList

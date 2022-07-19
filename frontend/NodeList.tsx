import { HistoryWithNode } from "common/types"
import { useState, useEffect, useRef, useContext, MouseEvent } from "react"
import styles from "frontend/Nodes.module.css"
import { NodeContext } from 'frontend/App'


// function Node(v: HistoryWithNode) {
function Node(v: HistoryWithNode & { selected: { allSelected: number[], setAllSelected: any}}) {
  const [context, setContext] = useContext(NodeContext);
  const [ selected, setSelected ] = useState(false)

  const clickHandler = (e: MouseEvent<HTMLLIElement>) => {
    if (e.shiftKey) {
      setSelected(! selected)
      if (! selected) {
        console.log('not selected')
        v.selected.setAllSelected(v.selected.allSelected.concat(v.node.id))
      } else {
        const arr = v.selected.allSelected.filter(item => item !== v.node.id)
        v.selected.setAllSelected(arr)
      }
    } else {
      setContext(v.node.id)
    }
  }


  return (
    <li onClick={clickHandler} style={{color: selected ? 'red' : 'blue'}}>{v.node.title}</li>
  )
}

function NodeList() {
  const [history, setHistory] = useState<HistoryWithNode[]>()
  // const [context, setContext] = useContext(NodeContext);

  const [ allSelected, setAllSelected] = useState<number[]>([])

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
          userSelect: 'none'
        }}
        className={styles.nodes}
      >
        <ul style={{ transform: `scaleX(-1)` }}>
          <p>selected: {allSelected.length}</p>
          {history.map((v: HistoryWithNode) => {
            // return <Node {...v} key={v.id} />
            const props = { ...v, selected: { allSelected, setAllSelected } }
            // @ts-ignore
            return <Node {...props} key={v.id} />
          })}
        </ul>
      </div>
    )
  }
}

export default NodeList

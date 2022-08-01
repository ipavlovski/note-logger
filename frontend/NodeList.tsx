import { HistoryAcc, HistoryWithNode } from 'common/types'
import { useState, useEffect, useRef, useContext, MouseEvent } from 'react'
import styles from 'frontend/Nodes.module.css'
import { Context } from 'frontend/App'

// function Node(v: HistoryWithNode) {
function Node(histNode: HistoryWithNode) {
  const { state, dispatch } = useContext<Context>(Context)
  const [selected, setSelected] = useState(false)
  const [active, setActive] = useState(false)

  const clickHandler = (e: MouseEvent<HTMLLIElement>) => {
    if (e.shiftKey) {
      const isSelected = state.selectedNodes.find(v => v.id == histNode.id)
      if (!isSelected) {
        dispatch({ type: 'SELECT_NODE', payload: { id: histNode.id, setter: setSelected } })
      } else {
        dispatch({ type: 'DESELECT_NODE', payload: { id: histNode.id } })
      }
    } else {
      dispatch({ type: 'ACTIVATE_NODE', payload: histNode.node.id })
      if (!active) {
        setActive(true)
      } else {
        setActive(false)
      }
    }
  }

  useEffect(() => {
    if (histNode.node.id != state.activeNodeId) {
      setActive(false)
    }
  }, [state.activeNodeId])

  return (
    <li
      onClick={clickHandler}
      style={{
        color: selected ? 'red' : active ? 'blue' : 'black',
        listStyle: 'none',
      }}>
      <span
        style={{
          background: 'black',
          borderRadius: '50%',
          content: '',
          width: '0.4rem',
          height: '0.4rem',
          display: 'inline-block',
          marginRight: '0.5rem',
          marginLeft: '-1rem',
        }}></span>
      {histNode.node.title}
    </li>
  )
}

function TreeNode({ title, children }: { title: string; children: HistoryWithNode[] }) {
  return (
    <li style={{ listStyle: 'none' }}>
      <div style={{ marginLeft: '0rem' }}>
        <span
          style={{
            background: 'black',
            borderRadius: '50%',
            content: '',
            width: '0.8rem',
            height: '0.8rem',
            display: 'inline-block',
            marginRight: '0.5rem',
            marginLeft: '0rem',
          }}></span>
        {title}
      </div>
      {children.length ? (
        <ul>
          {children.map((v: HistoryWithNode) => {
            return <Node {...v} key={v.id} />
          })}
        </ul>
      ) : null}
    </li>
  )
}

function NodeList() {
  const { state, dispatch } = useContext<Context>(Context)

  const fetchHistory = async (isoString: Date) => {
    const url = `https://localhost:3002/history/${isoString.toISOString()}`
    // console.log(`url: ${url}`)
    return await fetch(url).then(v => v.json())
  }

  useEffect(() => {
    console.log('FETCHING!')
    fetchHistory(new Date()).then(v => dispatch({ type: 'ADD_HISTORY', payload: v }))
  }, [])

  const listInnerRef = useRef() as React.MutableRefObject<HTMLDivElement>
  const onScroll = () => {
    if (listInnerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listInnerRef.current
      if (scrollTop + clientHeight === scrollHeight) {
        if (state.history.length > 0) {
          console.log('fetching...')
          const latestDate = state.history[state.history.length -1].children
            .map(v => v.visited_at).sort().at(0)!
          
          fetchHistory(new Date(latestDate)).then(v => dispatch({ type: 'ADD_HISTORY', payload: v }))
        }
      }
    }
  }

  return (
    <div
      onScroll={() => onScroll()}
      ref={listInnerRef}
      style={{
        gridArea: 'nodes',
        overflowY: 'scroll',
        maxHeight: '95vh',
        transform: `scaleX(-1)`,
        userSelect: 'none',
      }}
      className={styles.nodes}>
      <ul style={{ transform: `scaleX(-1)` }}>
        {state.history.map((v: HistoryAcc) => {
          return <TreeNode {...v} />
        })}
      </ul>
    </div>
  )
}

export default NodeList

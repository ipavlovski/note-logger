import { HistoryWithNode } from 'backend/routes/query'
import { fetchNode, parseNode } from 'components/node-view/node-view-slice'
import { useAppDispatch, useAppSelector } from 'frontend/hooks'
import { useCallback, useRef, useState } from 'react'
import Omnibar from 'components/node-list/omnibar'
import { createStyles, Text, Image, Group } from '@mantine/core'
import { fetchHistory } from 'components/node-list/node-list-slice'
import { IconCirclePlus, IconRefresh } from '@tabler/icons'

const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`

export interface HistoryTree {
  title: string
  item: HistoryWithNode | null
  children: HistoryTree[]
}

const useStyles = createStyles(theme => ({
  outer: {
    overflowY: 'scroll',
    maxHeight: '90vh',
    transform: `scaleX(-1)`,
    '&::-webkit-scrollbar': {
      width: 6,
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: '#b8adad',
      borderRadius: 12,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#7a2a73',
      borderRadius: 12,
    },
  },
  inner: {
    transform: `scaleX(-1)`,
    paddingLeft: 8,
  },
  node: {
    margin: 1,
    padding: 4,
    color: theme.colors.dark[0],
    ':hover': {
      color: theme.white,
      backgroundColor: theme.colors.dark[6],
    },
  },
  refresh: {
    width: 36,
    height: 36,
    cursor: 'pointer',
    color: theme.colors.dark[1],
    ':hover': {
      color: theme.colors.dark[0],
    },
  },
  selected: {
    padding: 4,
    color: theme.white,
    backgroundColor: '#7a2a73',
    borderRadius: 6,
    ':hover': {
      color: theme.white,
      backgroundColor: '#7a3a73',
    },
  },
}))

export default function NodeList() {
  const { classes, cx } = useStyles()
  const dispatch = useAppDispatch()
  const { treeRoots } = useAppSelector(state => state.nodeList)
  const [selectedNodeId, setSelectedNodeId] = useState<number>()

  const ref = useRef() as React.MutableRefObject<HTMLDivElement>
  const onScroll = () => {
    if (ref.current) {
      const { scrollTop, scrollHeight, clientHeight } = ref.current
      if (Math.floor(scrollTop + clientHeight) === scrollHeight) {
        if (treeRoots.length > 0) {
          console.log('fetching...')
          // const latestDate = state.history[state.history.length -1].children
          // .map(v => v.visited_at).sort().at(0)!
          const latest = treeRoots
            .map(v => v.visited_at)
            .sort()
            .at(0)!
          dispatch(fetchHistory({ isoDate: latest as unknown as string }))
        }
      }
    }
  }

  const treeItems = treeRoots.map(({ node, id }) => (
    <Group key={id} noWrap>
      {node.icon != null ? (
        <Image
          radius={'md'}
          style={{ width: 120, height: 80 }}
          src={`${SERVER_URL}/${node.icon.path}`}
        />
      ) : (<IconRefresh
        className={classes.refresh}
        onClick={() => {
          dispatch(parseNode(node.id))
        }}
      />)}
      <Text
        size={'sm'}
        className={cx(classes.node, id == selectedNodeId && classes.selected)}
        onClick={() => {
          setSelectedNodeId(id)
          dispatch(fetchNode(node.id))
        }}>
        {node.title}
      </Text>
    </Group>
  ))

  return (
    <div>
      <Omnibar />
      <div className={classes.outer} onScroll={() => onScroll()} ref={ref}>
        <div className={classes.inner}>{treeItems}</div>
      </div>
    </div>
  )
}

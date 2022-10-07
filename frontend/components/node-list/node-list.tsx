import { createStyles, Group, Image, Text } from '@mantine/core'
import { IconRefresh } from '@tabler/icons'
import { HistoryWithNode } from 'backend/routes/query'
import { selectNode } from 'components/node-list/node-list-slice'
import Omnibar from 'components/node-list/omnibar'
import { nodeApi } from 'frontend/api'
import { useAppDispatch, useAppSelector } from 'frontend/store'
import { useEffect, useRef } from 'react'

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
  icon: {
    minWidth: 120,
    padding: 4,
    // margin: 4
  },
}))

const date = new Date().toISOString()

function TreeItem({ item }: { item: HistoryWithNode }) {
  const dispatch = useAppDispatch()
  const { classes, cx } = useStyles()
  const { active } = useAppSelector(state => state.nodeList)

  const [parseNode] = nodeApi.useParseNodeByIdMutation()

  return (
    <Group noWrap>
      {item.node.icon != null ? (
        <div className={classes.icon}>
          <Image radius={'md'} src={`${SERVER_URL}/${item.node.icon.path}`} />
        </div>
      ) : (
        <IconRefresh
          className={classes.refresh}
          onClick={() => {
            parseNode(item.node.id)
          }}
        />
      )}
      <Text
        size={'sm'}
        className={cx(classes.node, item.node.id == active && classes.selected)}
        onClick={() => dispatch(selectNode(item.node_id))}>
        {item.node.title}
      </Text>
    </Group>
  )
}

export default function NodeList() {
  const { classes, cx } = useStyles()
  const dispatch = useAppDispatch()
  // const { treeRoots } = useAppSelector(state => state.nodeList)
  // const [selectedNodeId, setSelectedNodeId] = useState<number>()

  const { data: historyItems, isSuccess } = nodeApi.useGetHistoryByDateQuery(date)

  useEffect(() => {
    isSuccess && dispatch(selectNode(historyItems[0].node_id))
  }, [isSuccess])

  const ref = useRef() as React.MutableRefObject<HTMLDivElement>
  const onScroll = () => {
    if (ref.current) {
      const { scrollTop, scrollHeight, clientHeight } = ref.current
      if (Math.floor(scrollTop + clientHeight) === scrollHeight) {
        console.log('FETCH MORE STUFF')
        // if (treeRoots.length > 0) {
        //   console.log('fetching...')
        //   const latest = treeRoots
        //     .map(v => v.visited_at)
        //     .sort()
        //     .at(0)!
        //   console.log('FETCH MORE STUFF...')
        // dispatch(fetchHistory({ isoDate: latest as unknown as string }))
      }
    }
  }

  const treeItems = historyItems ? (
    historyItems.map(historyNode => <TreeItem item={historyNode} key={historyNode.id}></TreeItem>)
  ) : (
    <Text>No items</Text>
  )

  return (
    <div>
      <Omnibar />
      <div className={classes.outer} onScroll={() => onScroll()} ref={ref}>
        <div className={classes.inner}>{treeItems}</div>
      </div>
    </div>
  )
}

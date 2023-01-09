import { createStyles, Group, Image, Text } from '@mantine/core'
import { IconRefresh } from '@tabler/icons'
import { useQuery } from '@tanstack/react-query'
import { useRef } from 'react'

import { NodeWithIcon } from 'backend/routes'
import { useAppStore } from 'components/app'
import Omnibar from 'components/node-list/omnibar'

const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`

export interface HistoryTree {
  title: string
  item: NodeWithIcon | null
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
    minWidth: 40,
    maxWidth: 40,
    padding: 4,
    // margin: 4
  },
}))

function TreeItem({ node }: { node: NodeWithIcon }) {
  const { classes, cx } = useStyles()
  const active = useAppStore(state => state.active)
  const setActive = useAppStore(state => state.setActive)
  const clearEditSelect = useAppStore(state => state.clearEditSelect)

  return (
    <Group noWrap>
      {node.icon != null ? (
        <div className={classes.icon}>
          <Image radius={'md'} src={`${SERVER_URL}/${node.icon.path}`} />
        </div>
      ) : (
        <IconRefresh
          className={classes.refresh}
          onClick={() => {
            console.log('refresh action')
            // parseNode(node.id)
          }}
        />
      )}
      <Text
        size={'sm'}
        className={cx(classes.node, node.id == active && classes.selected)}
        onClick={() => {
          console.log(`Setting the active node: ${node.id}`)
          setActive(node.id)
          clearEditSelect()

        }}>
        {node.title}
      </Text>
    </Group>
  )
}

export default function NodeList() {
  const { classes, cx } = useStyles()

  // useEffect(() => {
  //   isSuccess && dispatch(selectNode(historyItems[0].node_id))
  // }, [isSuccess])

  const { data: historyItems } = useQuery({
    queryKey: ['repoData'],
    queryFn: () =>
      fetch(`${SERVER_URL}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: '' }),
      }).then((res): Promise<NodeWithIcon[]> => res.json()),
  })

  const ref = useRef() as React.MutableRefObject<HTMLDivElement>
  const onScroll = () => {
    if (ref.current) {
      const { scrollTop, scrollHeight, clientHeight } = ref.current
      if (Math.floor(scrollTop + clientHeight) === scrollHeight) {
        console.log('FETCH MORE STUFF')
        // if (treeRoots.length > 0) console.log('fetching...')
        // const latest = treeRoots.map(v => v.visited_at).sort().at(0)!
        // dispatch(fetchHistory({ isoDate: latest as unknown as string }))
      }
    }
  }

  const treeItems =
    historyItems && historyItems.length > 0 ? (
      historyItems.map((node) => <TreeItem node={node} key={node.id}></TreeItem>)
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

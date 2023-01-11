import { createStyles, Group, Image, Text } from '@mantine/core'
import { IconRefresh } from '@tabler/icons'
import { useQuery } from '@tanstack/react-query'
import { useRef } from 'react'

import { useAppStore } from 'components/app'
import Omnibar from 'components/omnibar'

import type { TimelineNode, TreeBranch } from 'backend/query'

const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`


const useStyles = createStyles(theme => ({
  outer: {
    overflowY: 'scroll',
    maxHeight: '90vh',
    transform: `scaleX(-1)`,
    '&::-webkit-scrollbar': {
      width: 4,
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
  childList: {
    paddingLeft: 12,
  },
  depth0: {
    marginLeft: 6,
  },
  depth1: {
    marginLeft: 6,
  },
  depth2: {
    marginLeft: 6,
  },
  depth3: {
    marginLeft: 6,
  },
  depth4: {
    marginLeft: 6,
  },
  depth5: {
    marginLeft: 6,
  },
  depth6: {
    marginLeft: 6,
  },
}))

function TreeItem({ node }: { node: TimelineNode }) {
  const { classes, cx } = useStyles()

  const active = useAppStore(state => state.active)
  const setActive = useAppStore(state => state.setActive)
  const clearEditSelect = useAppStore(state => state.clearEditSelect)

  const processTreeBranch = (treeBranch: TreeBranch) => {
    const item =
      'id' in treeBranch.item ? (
        <Group noWrap>
          <div className={classes.icon}>
            <Image radius={'md'} src={`${SERVER_URL}/${treeBranch.item.icon?.path}`} />
          </div>
          <Text
            size={'sm'}
            className={cx(classes.node, treeBranch.item.id == active && classes.selected)}
            onClick={() => {
              if ('id' in treeBranch.item) {
                setActive(treeBranch.item.id)
                clearEditSelect()
              }
            }}>
            {treeBranch.item.title}
          </Text>
        </Group>
      ) : (
        <Text>{treeBranch.item.title}</Text>
      )

    const depth = treeBranch.depth + 1
    const children =
      treeBranch.children.length > 0 ? (
        <ul
          className={cx(
            classes.childList,
            depth == 0
              ? classes.depth0
              : depth == 1
              ? classes.depth1
              : depth == 2
              ? classes.depth2
              : depth == 3
              ? classes.depth3
              : depth == 4
              ? classes.depth4
              : depth == 5
              ? classes.depth5
              : classes.depth6
          )}>
          {treeBranch.children.map(processTreeBranch)}
        </ul>
      ) : (
        <ul></ul>
      )

    return (
      <div>
        {item}
        {children}
      </div>
    )
  }

  return (
    <div>
      <h3>{node.startDate}</h3>
      {node.treeRoots.map(processTreeBranch)}
    </div>
  )
}

export default function NodeList() {
  const { classes, cx } = useStyles()

  // useEffect(() => {
  //   isSuccess && dispatch(selectNode(historyItems[0].node_id))
  // }, [isSuccess])

  const { data: timelineNodes } = useQuery({
    queryKey: ['nodeList'],
    queryFn: async () => {
      const props = {
        endDate: new Date(),
        range: 'week',
        split: 'day',
        virtualNodes: true,
        includeArchived: false,
      }

      return fetch(`${SERVER_URL}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(props),
      }).then((res): Promise<TimelineNode[]> => res.json())
    },
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

  return (
    <div>
      <Omnibar />
      <div className={classes.outer} onScroll={() => onScroll()} ref={ref}>
        <div className={classes.inner}>
          {timelineNodes && timelineNodes.length > 0 ? (
            timelineNodes.map((node, ind) => <TreeItem node={node} key={ind}></TreeItem>)
          ) : (
            <Text>No items</Text>
          )}
        </div>
      </div>
    </div>
  )
}
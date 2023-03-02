import { createStyles } from '@mantine/core'
import { trpc, useActiveEntryStore } from 'components/app'
import Remark from 'components/remark'
import { Box, Flex, Skeleton, Text } from '@mantine/core'
import { useHover } from '@mantine/hooks'
import { useActiveStore } from 'components/app'
// import { originalRoot } from 'components/data'
// import type { TreeNode, Category, Entry } from 'components/data'

import { TreeNode, Category, TreeEntry } from 'backend/query'

//  ==============================
//              STYLES
//  ==============================


const mainWidth = 140
const padOffset = 24
const topOffset = 24
const leftOffset = -10

const circleSize = 12
const headerHeight = 38

const skelWidth = 520

const colNode = '#ffffff'
const colHeader = '#ffffff'
const colEntry = '#ffffff'


const useStyles = createStyles((_, { depth }: {depth: number}, getRef) => ({

  treeNode: {
    position: 'relative',
    margin: 0,
    paddingLeft: padOffset,

    // horizontal line
    '&:before': {
      display: depth == 1 ? 'none' : 'block',
      position: 'absolute',
      width: padOffset,
      borderBottom: `2px solid ${colNode}`,
      top: topOffset,
      left: leftOffset,
      content: '""'
    },

    // vertical line
    '&::after': {
      // display: 'block',
      display: depth == 1 ? 'none' : 'block',
      position: 'absolute',
      height: '100%',
      borderLeft: `2px solid ${colNode}`,
      top: topOffset,
      left: leftOffset,
      content: '""'
    },

    // if it is the LAST item, don't add vertical line
    '&:last-child::after': {
      display: 'none'
    },


  },
  header: {
    position: 'relative',
    display: 'flex',
    gap: 8,
    fontSize: 18,
    padding: 0,
    // lineHeight: '100%',
    // padding: '2px 5px',
    height: headerHeight,
    margin: 0,

    // line going down
    '&::before': {
      // display: isEmpty ? 'none' : 'block',
      display: 'block',
      position: 'absolute',
      borderLeft: `2px solid ${colHeader}`,
      content: '""',
      height: '100%',
      top: topOffset,
      left: leftOffset,
    },

    // if it is the only child (no entries/categories), dont show line
    '&:only-child::before': {
      display: 'none'
    },

    // circle
    '&:after': {
      position: 'absolute',
      width: circleSize,
      height: circleSize,
      top: topOffset - circleSize / 2,
      left: leftOffset - circleSize / 2,
      borderRadius: '50%',
      backgroundColor: 'white',
      content: '""',
    },


  },
  entry: {
    position: 'relative',
    paddingLeft: mainWidth - padOffset*depth + 10,
    margin: 0,

    // horizontal line
    '&:before': {
      position: 'absolute',
      width: mainWidth - padOffset*depth,
      borderBottom: `2px solid ${colEntry}`,
      top: topOffset,
      left: leftOffset,
      content: '""',
    },

    // vertical line
    '&::after': {
      position: 'absolute',
      height: '100%',
      borderLeft: `2px solid ${colEntry}`,
      top: topOffset,
      left: leftOffset,
      content: '""',
    },

    // if it is the LAST item, don't add vertical line
    '&:last-child::after': {
      display: 'none'
    },
  },
  box: {
    padding: 0,
    margin: 0
  },
  entryHeader: {
    margin: 0,
    padding: '12px 0 0',
    height: headerHeight,
    display: 'flex',

    // circle
    '&:before': {
      position: 'absolute',
      width: circleSize,
      height: circleSize,
      top: topOffset - circleSize / 2,
      left: mainWidth - padOffset*depth - circleSize,
      borderRadius: '50%',
      border: '2px white solid',
      content: '""',
    },


  },


}))


function Entry({ entry, depth, ind }: {entry: TreeEntry, depth: number, ind: number}) {
  const { classes } = useStyles({ depth })

  const { hovered, ref } = useHover()
  const setActive = useActiveStore((state) => state.setActive)
  if (hovered) setActive(entry.treePath.map((v) => v.id), entry.id)

  return (
    <Box ref={ref} key={ind} className={classes.entry} >
      <Text truncate className={classes.entryHeader}>{entry.title ?? ''}</Text>
      {/* <Skeleton width={skelWidth} height={40} animate={false} /> */}
      <Remark markdown={entry.markdown} />
    </Box>
  )
}

function TreeView({ treeRoot: { depth, category, entries, children } }: {treeRoot: TreeNode}) {

  const { classes } = useStyles({ depth })

  return (
    <Box className={classes.treeNode} >

      {/* category header */}
      <Box className={classes.header}>
        <Skeleton height={30} circle animate={false}/>
        <Text truncate>{category.name}</Text>
      </Box>

      {/* entries */}
      {entries.length > 0 && entries.map((entry, ind) => (
        <Entry key={ind} depth={depth} entry={entry} ind={ind}/>
      ))}

      {/* child categories */}
      {children.length > 0 &&
      <div className={classes.box}>
        { children.map((treeNode, ind) => <TreeView key={ind} treeRoot={treeNode}/>) }
      </div>
      }

    </Box>
  )
}


export default function TreeMain() {

  const defaultQuery = 'all'
  const entries = trpc.getEntries.useQuery(defaultQuery)

  if (!entries.data) return <div>Loading...</div>

  return (
    <div style={{ margin: 16 }} >
      {entries.data.map((treeNode, ind) => <TreeView key={ind} treeRoot={treeNode} />)}
    </div>
  )
}

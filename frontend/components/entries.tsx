import { Box, Center, createStyles, Flex, px, rem, Skeleton, Text } from '@mantine/core'
import { useIntersection } from '@mantine/hooks'
import { useActiveStore, useQueriedEntries, useViewTogglesStore } from 'components/app'
import Remark from 'components/remark/remark'

import { IconHash } from '@tabler/icons-react'
import { TreeCategory, TreeEntry as ITreeEntry, TreeNode } from 'backend/query'
import { createContext, ReactNode, useContext, useRef } from 'react'
import LinearHeader from 'components/header'

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

const TreeContext = createContext<React.MutableRefObject<HTMLDivElement | null> | null>(null)

// type CssStylesNames = { [key in Selectors<typeof useStyles>]: string }


const useTreeStyles = createStyles((_, { depth }: {depth: number}) => ({

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
  scrollable: {
    // marginTop: 12,
    // overflowX: 'hidden',
    maxHeight: '74vh',
    overflowY: 'scroll',
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

  ix: {
    color: 'green'
  }

}))


function TreeEntry({ entry, depth, ind }: {entry: ITreeEntry, depth: number, ind: number}) {

  const { classes, cx } = useTreeStyles({ depth })
  const setActive = useActiveStore((state) => state.setActive)
  const parentRef = useContext(TreeContext)
  const { ref, entry: ix } = useIntersection({ root: parentRef?.current })

  if (ix?.isIntersecting) {
    setActive(entry.treePath.map((v)=>v.id), entry.id)
    console.log(`${entry.treePath.map((v)=>v.id).join()} id: ${entry.id} is intersecting!`)
  }

  return (
    <Box key={ind} className={cx(classes.entry)} ref={ref} >
      <Text truncate className={classes.entryHeader}>{entry.title ?? ''}</Text>
      <Remark markdown={entry.markdown} />
    </Box>
  )
}


function LinearEntry({ entry }: {entry: ITreeEntry }) {
  // const { classes, cx } = useLinearStyles()

  const setActive = useActiveStore((state) => state.setActive)
  const parentRef = useContext(TreeContext)
  const { ref, entry: ix } = useIntersection({ root: parentRef?.current })

  if (ix?.isIntersecting) {
    setActive(entry.treePath.map((v)=>v.id), entry.id)
    console.log(`${entry.treePath.map((v)=>v.id).join()} id: ${entry.id} is intersecting!`)
  }


  return (
    <Box ref={ref} >
      <LinearHeader entry={entry}/>
      <Remark markdown={entry.markdown} />
    </Box>
  )
}

function LinearCategory({ category }: {category: TreeCategory}) {
  return (
    <Center mt={100}>
      <Text underline>{category.name}</Text>
    </Center>
  )
}


function TreeView({ treeRoot: { depth, category, entries, children } }: {treeRoot: TreeNode}) {

  const { classes, cx } = useTreeStyles({ depth })

  return (
    <Box className={cx(classes.treeNode)} >

      {/* category header */}
      <Box className={classes.header}>
        <Skeleton height={30} circle animate={false}/>
        <Text truncate>{category.name}</Text>
      </Box>

      {/* entries */}
      {entries.length > 0 && entries.map((entry, ind) => (
        <TreeEntry key={ind} depth={depth} entry={entry} ind={ind} />
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


type LinearNodes = Array< (ITreeEntry & { type: 'entry'}) | (TreeCategory & { type: 'category'}) >
function linearizeTreeNode(treeNode: TreeNode, acc: LinearNodes, maxDepth: number) {
  const { depth, category, children, entries } = treeNode
  depth <= maxDepth && acc.push({ ...category, type: 'category' })
  entries.forEach((entry) => acc.push({ ...entry, type: 'entry' }))
  if (children.length > 0) children.forEach((child) => linearizeTreeNode(child, acc, maxDepth))
  return acc
}

function LinearView({ treeRoot }: {treeRoot: TreeNode}) {
  const maxDepth = useViewTogglesStore((state) => state.maxDepth)
  const linearNodes = linearizeTreeNode(treeRoot, [], maxDepth)

  return (
    <>
      {linearNodes.map((v, ind) => v.type == 'entry' ?
        <LinearEntry key={ind} entry={v} /> :
        <LinearCategory key={ind} category={v} />
      )}
    </>
  )
}

function InsersectionObserver({ children, className }: {children: ReactNode, className: string}) {
  const parentRef = useRef<null | HTMLDivElement>(null)

  return (
    <div className={className} ref={parentRef}>
      <TreeContext.Provider value={parentRef}>
        {children}
      </TreeContext.Provider>
    </div>
  )
}


/**
 * Render all the entries.
 * In the case the screen is mobile, TOC will dissappear and will show tree directly
 * Otherwise when TOC is visible, hide the tree structure and show it linearized
 */
export default function Entries({ className }: { className: string}) {
  // const defaultQuery = 'all'
  const entries = useQueriedEntries()

  // if (!entries) return <div>Loading...</div>
  const SHOW_TREE = false

  return (
    <InsersectionObserver className={className}>
      {SHOW_TREE ?
        entries.map((treeNode, ind) => <TreeView key={ind} treeRoot={treeNode} />) :
        entries.map((treeNode, ind) => <LinearView key={ind} treeRoot={treeNode} />)
      }
    </InsersectionObserver>
  )

}
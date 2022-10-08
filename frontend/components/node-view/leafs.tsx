import { Container, createStyles, Text } from '@mantine/core'
import { createNewLeaf, toggleLeafSelect } from 'components/node-view/node-view-slice'
import { MouseEvent, useState } from 'react'

import { useAppDispatch, useAppSelector } from 'frontend/store'
import Monaco from './monaco'
import Remark from './remark'

import { Divider } from '@mantine/core'
import { IconCirclePlus } from '@tabler/icons'

import type { LeafWithImages } from 'backend/routes/leaf'
import Gallery from 'components/node-view/gallery'

const useStyles = createStyles(theme => ({
  outerLeaf: {
    padding: 8,
    borderTop: `2px solid ${theme.colors.dark[3]}`,
    marginRight: 16,
    '&:hover': {
      borderTop: `2px solid ${theme.colors.dark[1]}`,
    },
  },
  innerLeaf: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  selected: {
    paddingLeft: 16,
    paddingRight: 16,
    borderLeft: '2px solid #dfcc43',
    ':hover': {
      borderLeft: '2px solid #dfcc43',
    },
  },
  scrollable: {
    overflowX: 'hidden',
    overflowY: 'scroll',
    maxHeight: '60vh',
    userSelect: 'none',
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
}))

function Leaf({ leaf }: { leaf: LeafWithImages }) {
  const dispatch = useAppDispatch()
  const { leafs } = useAppSelector(store => store.nodeView.selected)
  const markdown = useAppSelector(
    store => store.nodeView.nodeWithProps?.leafs.find(v => v.id == leaf.id)?.content || ''
  )
  const [isEditing, setEditing] = useState(false)

  // const { latestLeafId } = useAppSelector(state => state.nodeView)
  // const [markdown, setMarkdown] = useState(leaf.content)

  const { classes, cx } = useStyles()

  const images = leaf.images.filter(({ type }) => type == 'gallery')

  return (
    <div
      onClick={event => {
        // when shift is pressed, toggle selection of the element
        event.shiftKey && dispatch(toggleLeafSelect(leaf.id))
        // this prevents residual selects when shift is pressed
        event.preventDefault()
      }}>
      <Container className={classes.outerLeaf}>
        <Text align="end" size={'sm'}>
          {/* Leaf created: {leaf.createdAt as unknown as string} */}
          {new Date(leaf.createdAt).toLocaleString()}
        </Text>
        <div>{images.length > 0 && <Gallery images={images} />}</div>
        <div
          className={cx(classes.innerLeaf, leafs.includes(leaf.id) && classes.selected)}
          onDoubleClick={(event: MouseEvent<HTMLDivElement>) => {
            // is bang-shift-key to prevent accidental editing during shift-selection op
            !event.shiftKey && setEditing(true)
          }}>
          {isEditing ? (
            <Monaco leaf={leaf} setEditing={setEditing} markdown={markdown} />
          ) : (
            <Remark markdown={markdown == '' ? '...' : markdown} />
          )}
        </div>
      </Container>
    </div>
  )
}

export default function Leafs({ nodeId, leafs }: { nodeId: number; leafs: LeafWithImages[] }) {
  const dispatch = useAppDispatch()
  const { classes, cx } = useStyles()

  return (
    <div className={classes.scrollable}>
      {leafs.map((leaf, ind) => (
        <Leaf leaf={leaf} key={ind} />
      ))}
      <Divider
        onDoubleClick={() => dispatch(createNewLeaf(nodeId))}
        m="md"
        variant="dashed"
        labelPosition="center"
        style={{
          cursor: 'grab',
          userSelect: 'none',
        }}
        label={<IconCirclePlus size={'1.5rem'} />}
      />
    </div>
  )
}

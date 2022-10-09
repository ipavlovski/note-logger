import { Container, createStyles, Text } from '@mantine/core'
import { startLeafEditing, toggleLeafSelect } from 'components/node-view/node-view-slice'
import { MouseEvent, useState } from 'react'

import { useAppDispatch, useAppSelector } from 'frontend/store'
import Monaco from './monaco'
import Remark from './remark'

import { Divider } from '@mantine/core'
import { IconCirclePlus } from '@tabler/icons'

import type { LeafWithImages } from 'backend/routes/leaf'
import Gallery from 'components/node-view/gallery'
import { nodeApi } from 'frontend/api'

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
  divider: {
    cursor: 'grab',
    userSelect: 'none',
  },
}))

function Leaf({ leaf }: { leaf: LeafWithImages }) {
  const { classes, cx } = useStyles()
  const dispatch = useAppDispatch()
  const { leafs: selectedLeafs } = useAppSelector(store => store.nodeView.selected)

  const isEditing = useAppSelector(store => store.nodeView.editing.includes(leaf.id))

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
          {new Date(leaf.createdAt).toLocaleString()}
        </Text>

        <div>{images.length > 0 && <Gallery images={images} />}</div>

        <div
          className={cx(classes.innerLeaf, selectedLeafs.includes(leaf.id) && classes.selected)}
          onDoubleClick={(event: MouseEvent<HTMLDivElement>) => {
            // is bang-shift-key to prevent accidental editing during shift-selection op
            !event.shiftKey && dispatch(startLeafEditing(leaf.id))
          }}>
          {isEditing ? (
            <Monaco leaf={leaf} markdown={leaf.content} />
          ) : (
            <Remark markdown={leaf.content == '' ? '...' : leaf.content} />
          )}
        </div>
      </Container>
    </div>
  )
}

export default function Leafs({ nodeId, leafs }: { nodeId: number; leafs: LeafWithImages[] }) {
  const { classes, cx } = useStyles()
  const [createNewLeaf, newLeafResult] = nodeApi.useCreateNewLeafMutation()
  console.log(newLeafResult)

  return (
    <div className={classes.scrollable}>
      {leafs.map((leaf, ind) => (
        <Leaf leaf={leaf} key={ind} />
      ))}

      <Divider
        onDoubleClick={() => {
          createNewLeaf(nodeId)
        }}
        m="md"
        variant="dashed"
        labelPosition="center"
        className={classes.divider}
        label={<IconCirclePlus size={'1.5rem'} />}
      />
    </div>
  )
}

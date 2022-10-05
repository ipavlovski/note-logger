import { MouseEvent, useState } from 'react'
import { Container, Grid, Skeleton } from '@mantine/core'
import { toggleLeafSelect } from 'components/node-view/node-view-slice'
import { createStyles, Text } from '@mantine/core'

import { useAppDispatch, useAppSelector } from 'frontend/hooks'
import Monaco from './monaco'
import Remark from './remark'

import type { LeafWithMedia } from 'backend/routes/leaf'
import Gallery from 'components/node-view/gallery'

const useStyles = createStyles((theme) => ({
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
}))

export default function Leaf({ editing, leaf }: { editing: boolean; leaf: LeafWithMedia }) {
  const dispatch = useAppDispatch()
  const { leafs } = useAppSelector((store) => store.nodeView.selected)
  const markdown = useAppSelector(
    (store) => store.nodeView.nodeWithProps?.leafs.find((v) => v.id == leaf.id)?.content || ''
  )

  const [isEditing, setEditing] = useState(editing)
  // const [markdown, setMarkdown] = useState(leaf.content)

  const { classes, cx } = useStyles()

  const images = leaf.media.filter(({ type }) => type == 'gallery')

  return (
    <div
      onClick={(event) => {
        // when shift is pressed, toggle selection of the element
        event.shiftKey && dispatch(toggleLeafSelect(leaf.id))
        // this prevents residual selects when shift is pressed
        event.preventDefault()
      }}
    >
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
          }}
        >
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

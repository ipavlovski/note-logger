import { ActionIcon, Avatar, Container, createStyles, Flex, Grid, Group, Select,
  Text, Image } from '@mantine/core'
import { IconPlus, IconUserCircle } from '@tabler/icons-react'

import CreateNodeButton from 'components/create-node-button'
import { setScrollElement, useArrowShortcuts } from 'frontend/apis/miller-navigation'
import {
  useCategoryChain, useChainNames, useCreateCategoryChain, useQueriedNodes
} from 'frontend/apis/queries'
import { useMillerStore, useParentId } from 'frontend/apis/stores'
import { SERVER_URL } from 'frontend/apis/utils'
import { Node } from '@prisma/client'
import { useScrollIntoView } from '@mantine/hooks'
import { RefObject, useRef } from 'react'

const useStyles = createStyles(() => ({
  column: {
    overflowY: 'scroll',
    height: 300,
    '&::-webkit-scrollbar': {
      display: 'none'
    },
    borderLeft: '1px solid white',
    paddingLeft: 16
  },
  item: {
    color: '#ffffff',
    '&:hover': {
      color: '#cd7c7c'
    }
  },
  active: {
    color: 'green',
    '&:hover': {
      color: '#1dd132'
    }
  },
}))


export const getImageUrl = (src: string | null, dir: 'icons' | 'thumbnails' | 'capture') =>
  src && `${SERVER_URL}/${dir}/${src}`

// export const getCaptureUrl = (capture: string) => capture.endsWith('.mp4') ?
//   `${SERVER_URL}/capture/${capture}`.replace('.mp4', '.gif') : `${SERVER_URL}/capture/${capture}`


// https://stackoverflow.com/questions/26423335/elements-coordinates-relative-to-its-parent
// Note that if the top or left coordinates are negative,
// it means that the child escapes its parent in that direction.
// Same if the bottom or right coordinates are positive.
function isElementVisible(child: RefObject<HTMLDivElement>, parent: RefObject<HTMLDivElement>) {
  const parentPos = parent.current!.getBoundingClientRect()
  const childPos = child.current!.getBoundingClientRect()
  const relativePos = {
    top: childPos.top - parentPos.top,
    right: childPos.right - parentPos.right,
    bottom: childPos.bottom - parentPos.bottom,
    left: childPos.left - parentPos.left
  }
  return relativePos.top > 0
}


function ColumnItem({ node, className, onClick, index, parent }:
{ node: Node, className: string, onClick: React.MouseEventHandler, index: number,
  parent: RefObject<HTMLDivElement> }) {

  // const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({ offset: 60, })
  const ref = useRef<HTMLDivElement>(null)
  const executeScroll = () => {
    // console.log(isElementVisible(ref, parent))
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }
  setScrollElement(index, node.id, executeScroll)

  return (
    <Group align={'center'} mt={16} spacing={2}>

      <Flex align={'center'} gap={12}>
        <Avatar src={getImageUrl(node?.icon, 'icons')} radius="xl" m={4} >
          <IconUserCircle size="1.5rem" />
        </Avatar>

        <Text truncate ref={ref}
          className={className}
          onClick={onClick}>
          {node.name}
        </Text>

      </Flex>

      <Image
        radius='sm'
        src={getImageUrl(node?.thumbnail, 'thumbnails')}
      />

    </Group>
  )
}


function Column({ index }: { index: 0 | 1 | 2}) {
  const { classes: { active, column, item }, cx } = useStyles()
  const chain = useCategoryChain()
  const nodes = useQueriedNodes(index)
  const selectAction = useMillerStore((state) => state.selectAction[index])
  const selected = useMillerStore((state) => state.selection[index])
  const parentId = useParentId(index)

  const parentRef = useRef<HTMLDivElement>(null)

  const createNewColumn = () => {
    console.log('new column!!!')
  }

  const removeSelection = () => {
    console.log(`remove selection: ${chain[index+1]?.name}`)
    selectAction(null)
  }

  return (
    <>
      {/* HEADER */}
      <div>
        {(chain[index] != null && chain[index+1] == null) &&
        <ActionIcon variant={'gradient'} radius={'xl'} size={'sm'}>
          <IconPlus size="0.9rem" onClick={createNewColumn} />
        </ActionIcon>}

        {chain[index+1] != null &&
        <Flex align={'center'} gap={12}>
          <h3>{chain[index+1]!.name}</h3>

          {(parentId || index == 0) &&
          <CreateNodeButton categoryId={chain[index+1]!.id} parentId={parentId}/>
          }
        </Flex>}

      </div>

      {/* NODES */}
      <div
        className={cx(chain[index+1] != null && column)}
        onClick={() => removeSelection()}
      >
        {nodes.map((node) => (
          <ColumnItem
            className={cx(item, node.id == selected && active)}
            key={ node.id}
            onClick={(e) => {
              selectAction(node.id)
              e.stopPropagation()
            }}
            index={index}
            node={node}
            parent={parentRef}
          />
        ))}
      </div>
    </>

  )
}


function CategorySelector() {
  const chainName = useMillerStore((state) => state.chainName)
  const { setChainName } = useMillerStore((state) => state.actions)
  const chainNames = useChainNames()
  const createCategoryChain = useCreateCategoryChain()

  return (
    <Container size='xs'>
      <Select
        radius="lg"
        searchable creatable
        label="List of chains:" placeholder="Choose a chain..."
        data={chainNames.map((chain) => chain.name)}
        value={chainName} onChange={setChainName}
        getCreateLabel={(query) => `+ Create chain '${query}'...`}
        onCreate={(chainName) => {
          createCategoryChain.mutate(chainName)
          return chainName
        }}
      />
    </Container>
  )
}

export default function MillerColumns() {
  useArrowShortcuts()

  return (

    <>
      <CategorySelector />
      <Grid>

        <Grid.Col span={3} >
          <Column index={0} />
        </Grid.Col>

        <Grid.Col span={4}>
          <Column index={1} />
        </Grid.Col>

        <Grid.Col span={5}>
          <Column index={2} />
        </Grid.Col>

      </Grid>
    </>

  )
}
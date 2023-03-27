import {
  ActionIcon, Avatar, Container, createStyles, Flex, Grid, Group, Image, Select,
  Text
} from '@mantine/core'
import { IconPlus, IconUserCircle } from '@tabler/icons-react'

import { Node } from '@prisma/client'
import CreateNodeButton from 'components/create-node-button'
import { setScrollElement, useArrowShortcuts } from 'frontend/apis/miller-navigation'
import {
  useCategoryChain, useChainNames, useCreateCategoryChain, useQueriedNodes
} from 'frontend/apis/queries'
import { useMillerStore, useParentId } from 'frontend/apis/stores'
import { SERVER_URL } from 'frontend/apis/utils'
import { RefObject, useEffect, useRef, useState } from 'react'

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

function useIntersectionObserver(ref: RefObject<Element>, root: RefObject<Element>):
IntersectionObserverEntry | undefined {

  const [entry, setEntry] = useState<IntersectionObserverEntry>()

  const updateEntry = ([entry]: IntersectionObserverEntry[]): void => {
    setEntry(entry)
  }

  useEffect(() => {
    const node = ref?.current
    if (!node || !root) return

    const observer = new IntersectionObserver(updateEntry, { root: root.current })
    observer.observe(node)
    return () => observer.disconnect()

  }, [ref?.current, root?.current])

  return entry
}


function ColumnItem({ node, className, onClick, index, parent }:
{ node: Node, className: string, onClick: React.MouseEventHandler, index: number,
  parent: RefObject<HTMLDivElement> }) {

  const ref = useRef<HTMLDivElement>(null)

  const entry = useIntersectionObserver(ref, parent)
  const isVisible = !!entry?.isIntersecting

  const executeScroll = () => {
    !isVisible && ref.current?.scrollIntoView({ behavior: 'smooth' })
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
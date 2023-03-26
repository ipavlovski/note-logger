import { ActionIcon, Container, createStyles, Flex, Grid, Select } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'

import CreateNodeButton from 'components/create-node-button'
import { useArrowShortcuts } from 'frontend/apis/miller-navigation'
import {
  useCategoryChain, useChainNames, useCreateCategoryChain, useQueriedNodes
} from 'frontend/apis/queries'
import { useMillerStore, useParentId } from 'frontend/apis/stores'


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


function Column({ index }: { index: 0 | 1 | 2}) {
  const { classes: { active, column, item }, cx } = useStyles()
  const chain = useCategoryChain()
  const nodes = useQueriedNodes(index)
  const selectAction = useMillerStore((state) => state.selectAction[index])
  const selected = useMillerStore((state) => state.selection[index])
  const parentId = useParentId(index)

  const createNewColumn = () => {
    console.log('new column!!!')
  }

  const removeSelection = () => {
    console.log(`remove selection: ${chain[index+1]?.name}`)
    selectAction(null)
  }

  return (
    <>

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

      <div
        className={cx(chain[index+1] != null && column)}
        onClick={() => removeSelection()}
      >
        {nodes.map((node) => (
          <p className={cx(item, node.id == selected && active)}
            key={ node.id}
            onClick={(e) => {
              selectAction(node.id)
              e.stopPropagation()
            }}
          >
            {node.name}
          </p>
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
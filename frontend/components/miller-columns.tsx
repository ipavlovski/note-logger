import { ActionIcon, Container, createStyles, Grid, Select } from '@mantine/core'
import { useMillerStore } from 'frontend/apis/stores'
import { Button , Flex, MultiSelect } from '@mantine/core'
import { useState } from 'react'
import { useCategoryChain, useChainNames,
  useCreateCategoryChain, useQueriedNodes } from 'frontend/apis/queries'
import { IconPlus } from '@tabler/icons-react'


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

  },
  active: {
    color: 'green'
  }
}))


function Column({ index }: { index: 0 | 1 | 2}) {
  const { classes: { active, column, item }, cx } = useStyles()
  const chain = useCategoryChain().map((chain) => chain?.name)
  const nodes = useQueriedNodes(index)
  const selectAction = useMillerStore((state) => state.selectAction[index])
  const selected = useMillerStore((state) => state.selection[index])

  const createNewColumn = () => {
    console.log('new column!!!')
  }

  const addNewItem = () => {
    console.log(`adding new item: ${chain[index+1]}`)
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
          <h3>{chain[index+1]}</h3>
          <ActionIcon variant={'gradient'} radius={'xl'} size={'sm'}>
            <IconPlus size="0.9rem" onClick={addNewItem} />
          </ActionIcon>

        </Flex>}

      </div>

      <div className={cx(chain[index+1] != null && column)}>
        {nodes.map((node) => (
          <p className={cx(item, node.id == selected && active)}
            key={ node.id}
            onClick={() => selectAction(node.id)}>{node.name}
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
  // useArrowShortcuts()

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
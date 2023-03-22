import { Container, createStyles, Grid, Select } from '@mantine/core'
import { useMillerStore } from 'frontend/apis/stores'
import { Button , Flex, MultiSelect } from '@mantine/core'
import { useState } from 'react'
import { useChainNames, useCreateCategoryChain, useQueriedNodes } from 'frontend/apis/queries'

const useStyles = createStyles(() => ({
  column: {
    overflowY: 'scroll',
    height: 900,
    '&::-webkit-scrollbar': {
      display: 'none'
    },
  },
  item: {

  },
  active: {
    color: 'green'
  }
}))


function FirstColumn() {
  const { classes: { active, column, item }, cx } = useStyles()
  const nodes = useQueriedNodes(1)
  const { selectFirst } = useMillerStore((state) => state.actions)
  const selected = useMillerStore((state) => state.selection.firstId)


  return (
    <div className={column}>
      {nodes.map((node) => (
        <p className={cx(item, node.id == selected && active)}
          key={ node.id}
          onClick={() => selectFirst(node.id)}>{node.name}
        </p>
      ))}
    </div>
  )
}

function SecondColumn() {
  const { classes: { active, column }, cx } = useStyles()
  const nodes = useQueriedNodes(2)

  return (
    <div className={column}>
      {nodes.map((node) => <p key={ node.id}>{node.name}</p>)}
    </div>
  )
}


function ThirdColumn() {
  const { classes: { active, column }, cx } = useStyles()
  const nodes = useQueriedNodes(3)

  return (
    <div className={column}>
      {nodes.map((node) => <p key={ node.id}>{node.name}</p>)}
    </div>
  )
}


function CategorySelector() {
  const [selectedChain, setSelectedChain] = useState<string | null>()
  const chainNames = useChainNames()
  const createCategoryChain = useCreateCategoryChain()

  return (
    <Container size='xs'>
      <Select
        radius="lg"
        searchable creatable
        label="List of chains:" placeholder="Choose a chain..."
        data={chainNames.map((chain) => chain.name)}
        value={selectedChain} onChange={setSelectedChain}
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

        <Grid.Col span={3}>
          <FirstColumn />
        </Grid.Col>

        <Grid.Col span={4}>
          <SecondColumn />
        </Grid.Col>

        <Grid.Col span={5}>
          <ThirdColumn />
        </Grid.Col>

      </Grid>
    </>

  )
}
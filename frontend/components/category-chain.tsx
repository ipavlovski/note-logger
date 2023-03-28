import {
  ActionIcon, Container, Flex, Select
} from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'

import { Popover, Textarea } from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'
import {
  trpc,
  useCategoryChain, useChainNames, useCreateCategoryChain, useCreateCategoryColumn
} from 'frontend/apis/queries'
import { useMillerStore } from 'frontend/apis/stores'
import { useState } from 'react'


export function NewColumnButton({ index }: {index: 0 | 1 | 2}) {
  const [name, setName] = useState('')

  const chain = useCategoryChain()
  const utils = trpc.useContext()
  const createCategoryColumn = useCreateCategoryColumn()

  const createNewColumn = () => {
    console.log('creating new column')
    const parentId = chain[index]?.id
    parentId && createCategoryColumn.mutateAsync({ name, parentId }, {
      onSuccess: () => {
        utils.getCategoryChain.invalidate()
      }
    })
  }

  return (
    <Popover width={400} position="bottom" withArrow shadow="md" >
      <Popover.Target>
        <ActionIcon variant={'gradient'} radius={'xl'} size={'sm'}>
          <IconPlus size="0.9rem" />
        </ActionIcon>
      </Popover.Target>

      <Popover.Dropdown p={8}>
        <Flex align="center">
          {/* title input */}
          <Textarea autosize size={'sm'}
            value={name} onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Add title" style={{ width: 340 }} />

          {/* submit button */}
          <ActionIcon color="lime" size="lg" radius="xl" variant="filled" m={10}
            disabled={name == ''}
            onClick={createNewColumn} >
            <IconCheck size="1.25rem" />
          </ActionIcon>
        </Flex>
      </Popover.Dropdown>
    </Popover>
  )
}


export function CategorySelector() {
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
import { ActionIcon, Container, createStyles, Flex, Grid, Popover, Select, Textarea, UnstyledButton } from '@mantine/core'
import { getHotkeyHandler, useHotkeys } from '@mantine/hooks'
import { IconCheck, IconLink, IconPhoto, IconPlus, IconUserCircle } from '@tabler/icons-react'
import {
  useCategoryChain, useChainNames, useCreateCategoryChain, useCreateNewNode, useParentId, useQueriedNodes
} from 'frontend/apis/queries'
import { useMillerStore } from 'frontend/apis/stores'
import { useState, ClipboardEvent } from 'react'


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
  },
  button: {
    backgroundColor: '#343A40',
    margin: 6,
    width: 44,
    height: 44,
    textAlign: 'center',
    borderRadius: '50%',
    '&:focus': {
      color: '#6a76b5'
    }
  }
}))


function UrlHandler() {
  const { classes: { button } } = useStyles()

  return (
    <UnstyledButton
      className={button}
      onPaste={() => console.log('LOL!')}
      onKeyDown={getHotkeyHandler([
        ['ctrl+v', () => console.log('handling paste!!!')],
      ])}

    >
      <IconLink height={44}/>
    </UnstyledButton>
  )
}


function IconHandler() {
  const { classes: { button } } = useStyles()

  return (
    <UnstyledButton
      className={button}
      onPaste={() => console.log('LOL!')}
      onKeyDown={getHotkeyHandler([
        ['ctrl+v', () => console.log('handling paste!!!')],
      ])}

    >
      <IconUserCircle height={44}/>
    </UnstyledButton>
  )
}


function ThumbnailHandler() {
  const { classes: { button } } = useStyles()

  return (
    <UnstyledButton
      className={button}
      onPaste={() => console.log('LOL!')}
      onKeyDown={getHotkeyHandler([
        ['ctrl+v', () => console.log('handling paste!!!')],
      ])}

    >
      <IconPhoto height={44}/>
    </UnstyledButton>
  )
}


function CreateNodeButton({ parentId, categoryId }:
{ parentId: number | null, categoryId: number }) {

  const { classes: { button }, cx } = useStyles()
  const [titleValue, setTitleValue] = useState('')
  const [base64, setBase64] = useState<string | ArrayBuffer | null>(null)
  const createNewNode = useCreateNewNode()

  const blobToBase64 = async (blob: Blob): Promise<string | ArrayBuffer | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(blob)
    })
  }

  const pasteHandler = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardText = e.clipboardData?.getData('Text').trim() || ''
    const indNewLine = clipboardText.indexOf('\n')
    const firstLine = clipboardText.substring(0, indNewLine)
    const restLines = clipboardText.substring(indNewLine + 1)
    const isBase64 = /^data:.*:base64/.test(firstLine)

    // handle base64
    if (isBase64) {
      e.stopPropagation()
      e.preventDefault()
      setBase64(`data:video/mp4;base64,${restLines}`)
      return
    }

    // handlethe image scenario
    const query = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName })
    if (query.state == 'granted' || query.state == 'prompt') {
      const clipboard = await navigator.clipboard.read()
      if (clipboard[0].types.includes('image/png')) {
        const blob = await clipboard[0].getType('image/png')
        const b64 = await blobToBase64(blob)
        setBase64(b64)
      }
    }
  }

  const submitHandler = () => {
    console.log(`Create new node for parent:${parentId} category:${categoryId}`)
    createNewNode.mutate({
      categoryId, parentId, name: titleValue
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
        <Flex align="center" justify="center">
          <UrlHandler />
          <IconHandler />
          <ThumbnailHandler />
        </Flex>
        <Flex align="center">
          <Textarea onPaste={pasteHandler} autosize size={'sm'}
            value={titleValue} onChange={(e) => setTitleValue(e.currentTarget.value)}
            placeholder="Add title" style={{ width: 340 }} />

          {/* submit button */}
          <ActionIcon color="lime" size="lg" radius="xl" variant="filled" m={10}
            disabled={titleValue == ''}
            onClick={submitHandler} >
            <IconCheck size="1.25rem" />
          </ActionIcon>
        </Flex>
      </Popover.Dropdown>
    </Popover>
  )
}


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

  const addNewItem = () => {
    console.log(`adding new item: ${chain[index+1]?.name}`)
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
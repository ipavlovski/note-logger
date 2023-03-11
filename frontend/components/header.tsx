import {
  ActionIcon, Anchor, createStyles, Flex, HoverCard, MultiSelect, Text, TextInput, UnstyledButton
} from '@mantine/core'
import { getHotkeyHandler, useDisclosure } from '@mantine/hooks'
import { IconEdit, IconHash } from '@tabler/icons-react'
import { TreeEntry } from 'backend/query'
import { MouseEventHandler, useState } from 'react'

import { trpc } from 'components/app'


const useStyles = createStyles((theme) => ({
  input: {
    color: theme.colors.cactus[0],
    fontSize: 21,
    backgroundColor: 'transparent'
  },
  titleText: {
    color: theme.colors.cactus[0],
    fontSize: 27,
    fontWeight: 'bold',
    display: 'inline-block'
  },
  titleRoot: {
    display: 'inline-block',
  },
  titleDropdown: {
    background: 'none',
    border: 'none' }
}))


function HoverActionIcon({ clickHandler }: {clickHandler: MouseEventHandler<HTMLButtonElement>}) {
  return (
    <ActionIcon
      onClick={clickHandler} size={32} radius="xl" variant="transparent" color='cactus.0'
    >
      <IconEdit size={26} stroke={1.5}/>
    </ActionIcon>
  )
}

function EntryTitle({ title: initTitle, entryId }: { title: string, entryId: number }) {
  const { classes: { input, titleRoot, titleDropdown, titleText } } = useStyles()
  const [title, setTitle] = useState(initTitle)
  const [isEditing, { open: startEdit, close: stopEdit }] = useDisclosure(false)
  const updateEntryAnnotations = trpc.updateEntryAnnotations.useMutation()

  const updateTitle = async () => {
    stopEdit()
    updateEntryAnnotations.mutate({ entryId, title })
  }

  return (
    <HoverCard
      disabled={isEditing} shadow="sm" position='right' openDelay={300}
      classNames={{ dropdown: titleDropdown }}
    >

      <HoverCard.Target>
        {isEditing ?
          <TextInput autoFocus variant='default' classNames={{ input: input, root: titleRoot }}
            value={title} onChange={(event) => setTitle(event.currentTarget.value)}
            onKeyDown={getHotkeyHandler([['Escape', updateTitle]])}
          /> :
          <Text truncate className={titleText} >
            {title}
          </Text>}
      </HoverCard.Target>

      <HoverCard.Dropdown>
        <HoverActionIcon clickHandler={startEdit}/>
      </HoverCard.Dropdown>

    </HoverCard>
  )
}


function EntryTags({ tags, entryId }: {tags: string[], entryId: number }) {
  const { classes: { input } } = useStyles()
  const [isEditing, { open: startEdit, close: stopEdit }] = useDisclosure(false)
  const [entryTags, setEntryTags] = useState<string[]>(tags)

  const { data: allTags = [] } = trpc.getTags.useQuery('')
  const createTag = trpc.createTag.useMutation()

  const updateEntryAnnotations = trpc.updateEntryAnnotations.useMutation()

  const handleSubmit = async () => {
    stopEdit()
    updateEntryAnnotations.mutate({ entryId, tags })
  }

  return (
    <HoverCard
      disabled={isEditing} shadow="sm" position='right' openDelay={50} closeDelay={300}
      styles={{ dropdown: { background: 'none', border: 'none' } }}
    >

      <HoverCard.Target>
        {isEditing ?
          <MultiSelect
            autoFocus
            data={allTags.map(({ name }) => ({ value: name, label: `#${name}` }))}
            placeholder="Select tags"
            width={800}
            maxDropdownHeight={400}
            transitionProps={{ duration: 150, transition: 'pop-top-left', timingFunction: 'ease', }}
            // style={{ flexGrow: 1 }}
            classNames={{
              input: input
            }}
            styles={{
              input: {
                backgroundColor: 'transparent'
              },
              root: {
                // display: 'inline-block',
                marginBottom: 14
              }
            }}
            value={entryTags}
            onChange={setEntryTags}
            searchable
            creatable
            getCreateLabel={(query) => `+ Create tag #${query}`}
            onCreate={(tagName) => {
              // return createTag.mutate(tagName), null
              createTag.mutate(tagName)
              return tagName
            }}
            onKeyDown={getHotkeyHandler([['Escape', handleSubmit]])}
          />
          :
          <Flex gap={12}>
            {
              tags.length == 0 ?
                <Anchor component="button" td='underline'>#untagged</Anchor> :
                tags.map((name) => (
                  <Anchor component="button" td='underline' key={name}>#{name}</Anchor>
                ))
            }
          </Flex>}
      </HoverCard.Target>

      <HoverCard.Dropdown>
        <ActionIcon onClick={startEdit}
          size={32} radius="xl" variant="transparent" color='cactus.0'>
          <IconEdit size={26} stroke={1.5}/>
        </ActionIcon>
      </HoverCard.Dropdown>

    </HoverCard>
  )
}

function EntryCategory({ categories, entryId }:
{ categories: TreeEntry['treePath'], entryId: number}) {

  return (
    <UnstyledButton mt={5} mr={8}>
      <IconHash color={'#2BBC8A'} size={24} />
    </UnstyledButton>
  )
}


export default function LinearHeader({ entry }: {entry: TreeEntry}) {
  return (
    <div >
      <Flex align={'center'} mt={24}>
        <EntryCategory categories={entry.treePath} entryId={entry.id} />
        <EntryTitle title={entry.title ?? 'untitled'} entryId={entry.id} />
      </Flex>
      <EntryTags tags={entry.tags.map(({ name }) => name)} entryId={entry.id}/>
    </div>
  )
}
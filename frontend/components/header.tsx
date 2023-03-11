import {
  ActionIcon, Anchor, createStyles, Flex, HoverCard, MultiSelect, Text, TextInput, UnstyledButton
} from '@mantine/core'
import { getHotkeyHandler, useDisclosure } from '@mantine/hooks'
import { IconEdit, IconHash } from '@tabler/icons-react'
import { TreeEntry } from 'backend/query'
import { useState } from 'react'

import { trpc, useQueryStore, useViewTogglesStore } from 'components/app'


// style={{
//   borderRadius: 10,
//   padding: '6px 0px',
//   margin: '50px 0 20px',
// }}


const useStyles = createStyles((theme) => ({
  subHeadline: {
    color: '#2BBC8A',
    fontSize: 21
  },
}))


function EntryTitle({ title: initTitle, entryId }: { title: string, entryId: number }) {
  const { classes } = useStyles()
  const [title, setTitle] = useState(initTitle)
  const [isEditing, { open: startEdit, close: stopEdit }] = useDisclosure(false)
  const updateEntryAnnotations = trpc.updateEntryAnnotations.useMutation()

  const handleSubmit = async () => {
    stopEdit()
    updateEntryAnnotations.mutate({ entryId, title })
  }

  return (
    <HoverCard
      disabled={isEditing} shadow="sm" position='right' openDelay={300}
      styles={{ dropdown: { background: 'none', border: 'none' } }}
    >

      <HoverCard.Target>
        {isEditing ?
          <TextInput
            autoFocus
            variant='default'
            classNames={{ input: classes.subHeadline }}
            styles={{
              input: {
                backgroundColor: 'transparent'
              },
              root: {
                display: 'inline-block',
              }
            }}
            value={title} onChange={(event) => setTitle(event.currentTarget.value)}
            onKeyDown={getHotkeyHandler([['Escape', handleSubmit]])}
          /> :
          <Text
            truncate
            style={{ display: 'inline-block' }} color='cactus.0' size={27} weight={'bold'}>
            {title}
          </Text>}
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


function EntryTags({ tags, entryId }: {tags: string[], entryId: number }) {
  const { classes: { subHeadline } } = useStyles()
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
              input: subHeadline
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


export default function LinearHeader({ entry }: {entry: TreeEntry}) {
  return (
    <div >
      <Flex align={'center'} mt={24}>
        <UnstyledButton mt={5} mr={8}>
          <IconHash color={'#2BBC8A'} size={24} />
        </UnstyledButton>
        <EntryTitle title={entry.title ?? 'untitled'} entryId={entry.id} />
      </Flex>
      <EntryTags tags={entry.tags.map(({ name }) => name)} entryId={entry.id}/>
    </div>
  )
}
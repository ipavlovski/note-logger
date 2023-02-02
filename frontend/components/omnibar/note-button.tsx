import { createStyles, Group, Popover, Select, TextInput, UnstyledButton } from '@mantine/core'
import { getHotkeyHandler } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import { IconNotes } from '@tabler/icons'
import { OmnibarButtonStylesNames } from 'components/omnibar/omnibar'
import { useCreateNoteMutation, useFolderPathsQuery, useNewFolderPathsMutation } from 'frontend/api'
import { useState, Dispatch, SetStateAction } from 'react'

type Dispatcher<T> = Dispatch<SetStateAction<T>>


const useStyles = createStyles(theme => ({
  dropdown: {
    background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
  }
}))

export default function NoteUploadButton({ classNames }: 
    { classNames: OmnibarButtonStylesNames }) {

  const { classes } = useStyles()
  const [title, setTitle] = useState('')
  const [uriPath, setUriPath] = useState<string | null>(null)
  const createNote = useCreateNoteMutation()

  const submitHandler = () => {
    try {
      // validations
      if (uriPath == '' || uriPath == null) throw new Error('Must specify filepath.')
      if (title == '') throw new Error('Must specify title.')

      createNote.mutate([title, uriPath])

      // notify
      showNotification({ color: 'green', message: 'Status: success' })

      // reset all the input fields AND close the popup
    } catch (err) {
      showNotification({
        message: err instanceof Error ? err.message : 'unknown error',
        color: 'orange',
      })
    }
  }

  return (
    <Popover width={350} position="bottom-start" withArrow shadow="md" radius="sm">
      <Popover.Target>
        <UnstyledButton className={classNames.rightSideIcon} >
          <IconNotes size={20} stroke={1.5} />
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown className={classes.dropdown}>
        <Group>
          <PathInputSelect value={uriPath} setter={setUriPath}/>
          <NoteTitleSelect value={title } setter={setTitle} enter={submitHandler}/>
        </Group>
      </Popover.Dropdown>
    </Popover>
  )
}

function PathInputSelect({ value, setter }: 
  { value: string | null, setter: Dispatcher<string | null>}) {

  const { data: pathSuggestions } = useFolderPathsQuery('note')
  const createNewFileFolder = useNewFolderPathsMutation('note')

  return (
    <Select
      placeholder='Note uri: eg. path/to/note'
      style={{ flexGrow: 1 }}
      searchable
      creatable
      getCreateLabel={query => `+ Create ${query }`}
      onCreate={(query: string) => {
        createNewFileFolder.mutate(query)
        return null
      }}
      data={pathSuggestions ?? []}
      // label="Upload PDF file:"
      value={value}
      onChange={setter}
    />
  )
}

function NoteTitleSelect({ value, setter, enter, }:
  { value: string; setter: Dispatcher<string>; enter: () => void }) {
    
  return (
    <TextInput
      style={{ flexGrow: 1 }}
      placeholder="Insert a text-node title here"
      value={value}
      onChange={event => setter(event.target.value)}
      onKeyDown={getHotkeyHandler([['Enter', enter]])}
    />
  )
}

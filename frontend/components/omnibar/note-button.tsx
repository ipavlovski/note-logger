import { Group, Popover, Select, TextInput, UnstyledButton } from '@mantine/core'
import { getHotkeyHandler } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import { IconNotes } from '@tabler/icons'
import { OmnibarButtonStylesNames } from 'components/omnibar/omnibar'
import { useState, Dispatch, SetStateAction } from 'react'

type Dispatcher<T> = Dispatch<SetStateAction<T>>

export default function NoteUploadButton({ classNames }: 
  { classNames: OmnibarButtonStylesNames }) {
  const [uriInput, setUriInput] = useState('')

  const handleEnter = () => {
    showNotification({ message: `Uploading note to uri: ${uriInput}`, color: 'teal' })
  }

  return (
    <Popover width={350} position="bottom-start" withArrow shadow="md" radius="sm">
      <Popover.Target>
        <UnstyledButton
          className={classNames.rightSideIcon}
          onClick={() => {
            console.log('Uploading Note')
          }}>
          <IconNotes size={20} stroke={1.5} />
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown
        sx={theme => ({
          background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
        })}>
        <Group>
          <PathInputSelect />
          <NoteTitleSelect value={uriInput } 
            setter={setUriInput} enter={handleEnter}/>
        </Group>
      </Popover.Dropdown>
    </Popover>
  )
}

function PathInputSelect() {
  return (
    <Select
      placeholder='Note uri: eg. path/to/note'
      style={{ flexGrow: 1 }}
      searchable
      creatable
      getCreateLabel={query => `+ Create ${query }`}
      data={[]}
    />
  )
}

function NoteTitleSelect({ value, setter, enter, }: 
  { value: string; setter: Dispatcher<string>; enter: () => void 
}) {
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

import {
  createStyles,
  FileButton,
  Group,
  MultiSelect,
  Popover,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { getHotkeyHandler } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import { IconBook, IconBooks, IconCirclePlus, IconCode, IconHash, IconLink, IconNotes } from '@tabler/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`

const useStyles = createStyles(theme => ({
  rightSideIcon: {
    padding: 6,

    '&:hover': {
      backgroundColor: theme.colors.blue[8],
      borderRadius: theme.radius.xl,
      color: theme.white,
    },
  },
  query: {
    flexGrow: 1,
    marginRight: 4,
  },
  flexWrapper: {
    display: 'flex',
  },
}))

export default function Omnibar() {
  const { classes, cx } = useStyles()

  return (
    <div className={classes.flexWrapper}>
      <QueryInput />
      <Group spacing={0}>
        <UrlUpload />
        <PdfUpload />
        <NoteUpload />
      </Group>
    </div>
  )
}

function QueryInput() {
  const [data, setData] = useState<{ value: string; label: string }[]>([])
  const [value, setValue] = useState<string[] | undefined>([])
  const [input, setInput] = useState<string>('')
  const { classes, cx } = useStyles()
  const queryClient = useQueryClient()

  const submitURI = useMutation(
    (input: string) => {
      return fetch(`${SERVER_URL}/uri`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: input }),
      })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['nodeList'])
      },
    }
  )

  const handleSubmit = () => {
    const isURI = input.startsWith('https://') || input.startsWith('https://')

    if (isURI) {
      // send the uri to the backend
      // fetch(`${SERVER_URL}/uri`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ uri: input }),
      // })
      submitURI.mutate(input)
    } else {
      showNotification({ title: 'Your message', message: 'Not a uri...' })
    }
  }

  return (
    <MultiSelect
      mb={6}
      data={data}
      value={value}
      onChange={setValue}
      placeholder="Enter a query..."
      searchable
      radius={'xl'}
      size={'sm'}
      className={classes.query}
      styles={theme => ({
        input: { padding: 2 },
      })}
      icon={<IconHash size={18} stroke={2} />}
      // rightSection={<RightSection />}
      // rightSectionWidth={120}
      onSearchChange={input => {
        setInput(input)
      }}
      onCreate={query => {
        const item = { value: query, label: query }
        setData(current => [...current, item])
        return item
      }}
      onKeyDown={getHotkeyHandler([['ctrl+Enter', handleSubmit]])}
      spellCheck={false}
    />
  )
}



function UrlUpload() {
  const { classes, cx } = useStyles()
  const [uriInput, setUriInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const handleEnter = () => {
    showNotification({ message: `Uploading file to uri: ${uriInput}`, color: 'teal' })
  }

  return (
    <Popover width={350} position="bottom-start" withArrow shadow="md" radius="sm">
      <Popover.Target>
        <UnstyledButton
          className={classes.rightSideIcon}
          onClick={() => {
            console.log('Uploading URL')
          }}>
          <IconLink size={20} stroke={1.5} />
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown
        sx={theme => ({
          background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
        })}>
        <Group>
          <TextInput
            placeholder="paste a URL here"
            // label="Upload PDF file:"
            value={uriInput}
            style={{ flexGrow: 1 }}
            onChange={event => setUriInput(event.target.value)}
            onKeyDown={getHotkeyHandler([['Enter', handleEnter]])}
          />
        </Group>
      </Popover.Dropdown>
    </Popover>
  )
}




function PdfUpload() {
  const [uriInput, setUriInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const { classes, cx } = useStyles()

  const handleEnter = () => {
    showNotification({ message: `Uploading file to uri: ${uriInput}`, color: 'teal' })
  }

  return (
    <Popover width={350} position="bottom-start" withArrow shadow="md" radius="sm">
      <Popover.Target>
        <UnstyledButton className={classes.rightSideIcon}>
          <IconBook size={20} stroke={1.5} />
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown
        sx={theme => ({
          background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
        })}>
        <Group>
          <TextInput
            placeholder="File uri: eg. path/to/file.pdf"
            // label="Upload PDF file:"
            value={uriInput}
            style={{ flexGrow: 1 }}
            onChange={event => setUriInput(event.target.value)}
            onKeyDown={getHotkeyHandler([['Enter', handleEnter]])}
          />
          <FileButton onChange={setFile} accept="image/png,image/jpeg">
            {props => (
              <UnstyledButton {...props} mt={6}>
                <IconCirclePlus size={24} stroke={1.5} />
              </UnstyledButton>
            )}
          </FileButton>
        </Group>
      </Popover.Dropdown>
    </Popover>
  )
}

function NoteUpload() {
  const { classes, cx } = useStyles()
  const [uriInput, setUriInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const handleEnter = () => {
    showNotification({ message: `Uploading file to uri: ${uriInput}`, color: 'teal' })
  }

  return (
    <Popover width={350} position="bottom-start" withArrow shadow="md" radius="sm">
      <Popover.Target>
        <UnstyledButton
          className={classes.rightSideIcon}
          onClick={() => {
            console.log('Uploading URL')
          }}>
          <IconNotes size={20} stroke={1.5} />
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown
        sx={theme => ({
          background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
        })}>
        <Group>
          <TextInput
            placeholder="note uri: eg. path/to/note"
            // label="Upload PDF file:"
            value={uriInput}
            style={{ flexGrow: 1 }}
            onChange={event => setUriInput(event.target.value)}
            onKeyDown={getHotkeyHandler([['Enter', handleEnter]])}
          />
        </Group>
      </Popover.Dropdown>
    </Popover>
  )
}

import {
  createStyles,
  FileButton,
  Group,
  MultiSelect,
  Popover,
  Select,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { getHotkeyHandler } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import {
  IconBook,
  IconBooks,
  IconCheck,
  IconCirclePlus,
  IconCode,
  IconHash,
  IconLink,
  IconNotes,
} from '@tabler/icons'
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


const data=[
  { value: "1", label: 'default/', group: 'default' },
  { value: "2", label: 'docs/', group: 'docs' },
  { value: "3", label: 'docs/apartment/', group: 'docs' },
  { value: "5", label: 'docs/apartment/custom/', group: 'docs' },
  { value: "6", label: 'car/taxes/', group: 'car' },
  { value: "7", label: 'car/other/', group: 'car' },
]

function PdfUpload() {
  const [filename, setFilename] = useState('')
  const [uriPath, setUriPath] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const { classes, cx } = useStyles()

  const handleEnter = () => {
    // showNotification({ message: `Uploading file to uri: ${uriInput}`, color: 'teal' })
    // console.log(uriInput)
    console.log(file)
    if (file) {
      console.log(new Date(file.lastModified).toISOString())
      // console.log(file.)
    }
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
            placeholder="Node Title"
            // label="Upload PDF file:"
            // value={filename}
            style={{ flexGrow: 1 }}
            // onChange={event => setFilename(event.target.value)}
            onKeyDown={getHotkeyHandler([['Enter', handleEnter]])}
          />
          <Select
            placeholder="File uri: eg. path/to/file.pdf"
            style={{ flexGrow: 1 }}
            searchable
            creatable
            getCreateLabel={(query) => `+ Create ${query}`}
            data={data}
            // label="Upload PDF file:"
            // value={uriPath}
            // onChange={event => setUriPath(event.target.value)}
            // onKeyDown={getHotkeyHandler([['Enter', handleEnter]])}
          />
          <TextInput
            placeholder="File uri: eg. path/to/file.pdf"
            // label="Upload PDF file:"
            value={filename}
            style={{ flexGrow: 1 }}
            onChange={event => setFilename(event.target.value)}
            onKeyDown={getHotkeyHandler([['Enter', handleEnter]])}
          />
          <FileButton
            onChange={file => {
              if (file) {
                setFile(file)
                setFilename(file.name)
              }
            }}
            accept="application/pdf">
            {props => (
              <UnstyledButton {...props} mt={6}>
                <IconCirclePlus size={24} stroke={1.5} />
              </UnstyledButton>
            )}
          </FileButton>
          <UnstyledButton mt={6}>
              <IconCheck size={24} stroke={1.5} />
          </UnstyledButton>
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
        <Select
            placeholder="File uri: eg. path/to/note"
            style={{ flexGrow: 1 }}
            searchable
            creatable
            getCreateLabel={(query) => `+ Create ${query}`}
            data={data}
            // label="Upload PDF file:"
            // value={uriPath}
            // onChange={event => setUriPath(event.target.value)}
            // onKeyDown={getHotkeyHandler([['Enter', handleEnter]])}
          />
          <TextInput
            placeholder="Insert a text-node title here"
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

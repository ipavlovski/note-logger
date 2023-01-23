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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SERVER_URL } from 'components/app'
import { useState } from 'react'

type PathSuggestion = {
  value: string
  label: string
  group: string
}

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
  const [fileTitle, setFileTitle] = useState('')
  const [uriPath, setUriPath] = useState<string | null>(null)
  const [filename, setFilename] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const { classes, cx } = useStyles()
  const queryClient = useQueryClient()

  const { data: pathSuggestions } = useQuery({
    queryKey: ['fileSuggestions'],
    queryFn: async () => {
      return fetch(`${SERVER_URL}/paths/file`)
        .then((res): Promise<PathSuggestion[]> => res.json())
        .then(res => res.map(v => ({ ...v, label: v.value })))
    },
  })

  const createNewFileFolder = useMutation(
    async (query: string) => {
      await fetch(`${SERVER_URL}/paths/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'file', uri: query }),
      })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['fileSuggestions'])
      },
    }
  )

  const uploadFile = useMutation(
    (formData: FormData) => {
      return fetch(`${SERVER_URL}/file`, { method: 'POST', body: formData })
    },
    { onSuccess: () => queryClient.invalidateQueries(['activeNode']) }
  )

  const submitHandler = async () => {
    try {
      // validate title
      if (fileTitle == '') throw new Error('Must input node title.')

      // validate uri path
      if (uriPath == '') throw new Error('Must specify filepath.')

      // validate filename: end in '.pdf', 'only 1 dot', alpha-numerics only
      if (filename == '') throw new Error('Must input filename.')

      // ensure file exists
      if (!file) throw new Error('File is not ready')

      // prep the metadata
      const info = {
        uriPath,
        fileTitle,
        filename,
        metadata: { lastModified: new Date(file.lastModified).toISOString(), fileSize: file.size },
      }

      const formData = new FormData()
      formData.append('file', file, JSON.stringify(info))
      const { status } = await uploadFile.mutateAsync(formData)

      // notify
      showNotification({ color: 'green', message: `Status: ${status}` })

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
            style={{ flexGrow: 1 }}
            value={fileTitle}
            onChange={event => setFileTitle(event.target.value)}
            // label="Upload PDF file:"
            // onKeyDown={getHotkeyHandler([['Enter', handleEnter]])}
          />
          <Select
            placeholder="File uri: eg. path/to/file.pdf"
            style={{ flexGrow: 1 }}
            searchable
            creatable
            getCreateLabel={query => `+ Create ${query}`}
            onCreate={(query: string) => {
              createNewFileFolder.mutate(query)
              return null
            }}
            data={pathSuggestions ?? []}
            // label="Upload PDF file:"
            value={uriPath}
            onChange={setUriPath}
            // onChange={event => setUriPath(event.target.value)}
            // onKeyDown={getHotkeyHandler([['Enter', handleEnter]])}
          />
          <TextInput
            placeholder="File uri: eg. path/to/file.pdf"
            value={filename}
            style={{ flexGrow: 1 }}
            onChange={event => setFilename(event.target.value)}
            // label="Upload PDF file:"
            // onKeyDown={getHotkeyHandler([['Enter', handleEnter]])}
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
            <IconCheck size={24} stroke={1.5} onClick={submitHandler} />
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
            getCreateLabel={query => `+ Create ${query}`}
            data={[]}
            // label="Upload PDF file:"
            // value={uriPath}
            // onChange={event => setUriPath(event.target.value)}
            // onKeyDown={getHotkeyHandler([['Enter', handleEnter]])}
          />
          <TextInput
            style={{ flexGrow: 1 }}
            placeholder="Insert a text-node title here"
            value={uriInput}
            onChange={event => setUriInput(event.target.value)}
            onKeyDown={getHotkeyHandler([['Enter', handleEnter]])}
          />
        </Group>
      </Popover.Dropdown>
    </Popover>
  )
}

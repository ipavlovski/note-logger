import { createStyles, Group, MultiSelect, Selectors } from '@mantine/core'
import { getHotkeyHandler } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import { IconHash } from '@tabler/icons'
import NoteUploadButton from 'components/omnibar/note-button'
import PdfUploadButton from 'components/omnibar/pdf-button'
import UrlUploadButton from 'components/omnibar/url-button'
import { useState } from 'react'

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

export type OmnibarButtonStylesNames = {
  [key in Selectors<typeof useStyles>]: string
}

function QueryInput() {
  const [data, setData] = useState<{ value: string; label: string }[]>([])
  const [value, setValue] = useState<string[] | undefined>([])
  const [input, setInput] = useState<string>('')
  const { classes } = useStyles()

  const handleSubmit = () => {
    showNotification({ message: `Uploading file to uri: ${input}`, color: 'teal' })
  }

  const handleCreate = (query: string) => {
    const item = { value: query, label: query }
    setData(current => [...current, item])
    return item
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
      styles={() => ({ input: { padding: 2 } })}
      icon={<IconHash size={18} stroke={2} />}
      onSearchChange={input => setInput(input)}
      onCreate={handleCreate}
      onKeyDown={getHotkeyHandler([['ctrl+Enter', handleSubmit]])}
      spellCheck={false}
    />
  )
}

export default function Omnibar() {
  const { classes } = useStyles()

  return (
    <div className={classes.flexWrapper}>
      <QueryInput />
      <Group spacing={0}>
        <UrlUploadButton classNames={classes} />
        <PdfUploadButton classNames={classes} />
        <NoteUploadButton classNames={classes} />
      </Group>
    </div>
  )
}

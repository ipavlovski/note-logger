import { FileButton, Group, Popover, Select, TextInput, UnstyledButton } from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import { IconBook, IconCheck, IconCirclePlus } from '@tabler/icons'
import { OmnibarButtonStylesNames } from 'components/omnibar/omnibar'
import { useFolderPathsQuery, useNewFolderPathsMutation, useUploadFileMutation } from 'frontend/api'
import { useState } from 'react'

export default function PdfUploadButton({ classNames }: { classNames: OmnibarButtonStylesNames }) {
  const [fileTitle, setFileTitle] = useState('')
  const [uriPath, setUriPath] = useState<string | null>(null)
  const [filename, setFilename] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const { data: pathSuggestions } = useFolderPathsQuery('file')
  const createNewFileFolder = useNewFolderPathsMutation('file')
  const uploadFile = useUploadFileMutation()

  const submitHandler = async () => {
    try {
      // validations
      if (fileTitle == '') throw new Error('Must input node title.')
      if (uriPath == '') throw new Error('Must specify filepath.')
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
        <UnstyledButton className={classNames.rightSideIcon}>
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

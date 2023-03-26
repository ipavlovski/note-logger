import { ActionIcon, AspectRatio, Avatar, createStyles, Flex, HoverCard, Image, Popover, Text,
  Textarea, UnstyledButton } from '@mantine/core'
import { getHotkeyHandler, useDisclosure } from '@mantine/hooks'
import { IconCheck, IconLink, IconPhoto, IconPlus, IconUserCircle } from '@tabler/icons-react'
import { useState } from 'react'

import { useCreateNewNode } from 'frontend/apis/queries'


const useStyles = createStyles(() => ({

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
  },
  active: {
    color: '#21a152',
    '&:focus': {
      color: '#1bbc59'
    }
  }
}))


type ReactSetter<T> = React.Dispatch<React.SetStateAction<T | null>>

function UrlHandler({ url, setUrl }: {url: string | null, setUrl: ReactSetter<string>}) {
  const { classes: { button, active }, cx } = useStyles()

  return (

    <HoverCard shadow="md" disabled={! url} position='top' offset={30}>
      <HoverCard.Target>
        <UnstyledButton
          className={cx(button, !! url && active)}
          onPaste={() => console.log('LOL!')}
          onKeyDown={getHotkeyHandler([
            ['ctrl+v', async () => {
              const clipboard = await getClipboardContents()

              const url = await getClipboardURL(clipboard)
              if (url) setUrl(url)
            }],
            ['delete', () => {
              setUrl(null)
            }]
          ])}

        >
          <IconLink height={44}/>

        </UnstyledButton>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <Text size="sm">
          {url}
        </Text>
      </HoverCard.Dropdown>
    </HoverCard>

  )
}


function IconHandler({ icon, setIcon }: {icon: string | null, setIcon: ReactSetter<string>}) {
  const { classes: { button, active }, cx } = useStyles()

  return (
    <UnstyledButton
      className={cx(button, !! icon && active)}
      onPaste={() => console.log('LOL!')}
      onKeyDown={getHotkeyHandler([
        ['ctrl+v', async () => {
          const clipboard = await getClipboardContents()

          const image = await getClipboardImage(clipboard)
          if (image) {
            setIcon(image)
            return
          }

          const url = await getClipboardURL(clipboard)
          if (url) {
            console.log('set icon using url...')
            return
          }
        }],
        ['delete', () => setIcon(null)]
      ])}
    >
      {icon ?
        <Avatar src={icon} radius="xl" m={4} /> :
        <IconUserCircle height={44}/>}
    </UnstyledButton>
  )
}


function ThumbnailHandler({ thumbnail, setThumbnail }:
{thumbnail: string | null, setThumbnail: ReactSetter<string>}) {

  const { classes: { button, active }, cx } = useStyles()

  return (
    <UnstyledButton
      className={cx(button, !! thumbnail && active)}
      onPaste={() => console.log('LOL!')}
      onKeyDown={getHotkeyHandler([
        ['ctrl+v', async () => {
          const clipboard = await getClipboardContents()

          const image = await getClipboardImage(clipboard)
          if (image) {
            setThumbnail(image)
            return
          }

          const video = await getClipboardVideo(clipboard)
          if (video) {
            setThumbnail(video)
            return
          }
        }],
      ])}

    >
      <IconPhoto height={44}/>
    </UnstyledButton>
  )
}

const getClipboardContents = async () => {
  const query = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName })
  if (query.state == 'granted' || query.state == 'prompt') {
    const items = await navigator.clipboard.read()
    return items[0]
  }
  return null
}

const getClipboardImage = async (clipboardItem: ClipboardItem | null) => {
  if (clipboardItem != null && clipboardItem.types.includes('image/png')) {
    const blob = await clipboardItem.getType('image/png')
    return new Promise<string | null>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = (err) => reject(null)
      reader.readAsDataURL(blob)
    })
  }
  return null
}

const getClipboardVideo = async (clipboardItem: ClipboardItem | null) => {
  if (clipboardItem != null && clipboardItem.types.includes('text/plain')) {
    const blob = await clipboardItem.getType('text/plain')
    const text = await blob.text()

    const ind = text.indexOf('\n')
    const firstLine = text.substring(0, ind)
    const restLines = text.substring(ind + 1)

    const isBase64 = /^data:.*:base64/.test(firstLine)
    if (isBase64) return `data:video/mp4;base64,${restLines}`
  }
  return null
}


const getClipboardURL = async (clipboardItem: ClipboardItem | null) => {
  if (clipboardItem != null && clipboardItem.types.includes('text/plain')) {
    const blob = await clipboardItem.getType('text/plain')
    const text = await blob.text()

    const isURL = /^(http|https):\/\/[^ "]+$/.test(text)
    if (isURL) return text
  }
  return null
}

function ThumbnailPreview({ thumbnail }: {thumbnail: string | null}) {
  return thumbnail?.startsWith('data:image/png') ?
    <Image m={8} height={120} width={300} radius='sm' src={thumbnail} /> :
    thumbnail?.startsWith('data:image/png') ?
      <AspectRatio ratio={16 / 9} m={8} p={0} >
        <video controls height={120} width='auto' >
          <source type="video/mp4" src={thumbnail} />
        </video>
      </AspectRatio> :
      null
}


export default function CreateNodeButton({ parentId, categoryId }:
{ parentId: number | null, categoryId: number }) {

  const { classes: { button } } = useStyles()

  const createNewNode = useCreateNewNode()
  const [opened, { open, toggle, close }] = useDisclosure(false)

  const [name, setName] = useState('')
  const [url, setUrl] = useState<string | null>(null)
  const [icon, setIcon] = useState<string | null>(null)
  const [thumbnail, setThumbnail] = useState<string | null>(null)


  const submitHandler = async () => {
    // create new node
    createNewNode.mutate({ parentId, categoryId, name, url, icon, thumbnail })

    // clear the fields
    setName('')
    setUrl(null)
    setIcon(null)
    setThumbnail(null)
    close()

  }

  return (
    <Popover width={400} position="bottom" withArrow shadow="md"
      opened={opened} onChange={toggle}>
      <Popover.Target>
        <ActionIcon variant={'gradient'} radius={'xl'} size={'sm'} onClick={() => toggle()}>
          <IconPlus size="0.9rem" />
        </ActionIcon>
      </Popover.Target>

      <Popover.Dropdown p={8}>
        <Flex align="center" justify="center">
          <UrlHandler url={url} setUrl={setUrl}/>
          <IconHandler icon={icon} setIcon={setIcon} />
          <ThumbnailHandler thumbnail={thumbnail} setThumbnail={setThumbnail} />
        </Flex>
        <Flex align="center">
          <Textarea autosize size={'sm'}
            value={name} onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Add title" style={{ width: 340 }} />

          {/* submit button */}
          <ActionIcon color="lime" size="lg" radius="xl" variant="filled" m={10}
            disabled={name == ''}
            onClick={submitHandler} >
            <IconCheck size="1.25rem" />
          </ActionIcon>
        </Flex>
        <ThumbnailPreview thumbnail={thumbnail}/>
      </Popover.Dropdown>
    </Popover>
  )
}
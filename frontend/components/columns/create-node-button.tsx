import { ActionIcon, AspectRatio, Avatar, createStyles, Flex, HoverCard, Image, Popover, Text,
  Textarea, UnstyledButton } from '@mantine/core'
import { getHotkeyHandler, useDisclosure } from '@mantine/hooks'
import { IconCheck, IconLink, IconPhoto, IconPlus, IconUserCircle } from '@tabler/icons-react'
import { useState } from 'react'

import { trpc, useCreateNewNode } from 'frontend/apis/queries'
import ClipboardHandler, { blobToBase64 } from 'frontend/apis/clipboard'

type ReactSetter<T> = React.Dispatch<React.SetStateAction<T | null>>

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


function UrlButton({ url, setUrl }: {url: string | null, setUrl: ReactSetter<string>}) {
  const { classes: { button, active }, cx } = useStyles()

  return (

    <HoverCard shadow="md" disabled={! url} position='top' offset={30}>
      <HoverCard.Target>
        <UnstyledButton
          className={cx(button, !! url && active)}
          onPaste={() => console.log('LOL!')}
          onKeyDown={getHotkeyHandler([
            ['ctrl+v', async () => {
              const clipboard = await ClipboardHandler.create()

              const url = await clipboard.getURL()
              if (url) setUrl(url)
            }],
            ['delete', () => setUrl(null)]
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


function IconButton({ icon, setIcon }: {icon: string | null, setIcon: ReactSetter<string>}) {
  const { classes: { button, active }, cx } = useStyles()

  return (
    <UnstyledButton
      className={cx(button, !! icon && active)}
      onPaste={() => console.log('LOL!')}
      onKeyDown={getHotkeyHandler([
        ['ctrl+v', async () => {
          const clipboard = await ClipboardHandler.create()

          const image = await clipboard.getImage()
          if (image) {
            setIcon(image)
            return
          }

          const url = await clipboard.getURL()
          if (url) {
            try {
              const blob = await fetch(url).then((res) => res.blob())
              const image = await blobToBase64(blob)
              const isImage = image?.startsWith('data:image/jpeg') ||
                image?.startsWith('data:image/png')
              if (isImage) setIcon(image)
            } catch (err) {
              console.log(err)
            }

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

function ThumbnailButton({ thumbnail, setThumbnail }:
{thumbnail: string | null, setThumbnail: ReactSetter<string>}) {

  const { classes: { button, active }, cx } = useStyles()

  return (
    <UnstyledButton
      className={cx(button, !! thumbnail && active)}
      onPaste={() => console.log('LOL!')}
      onKeyDown={getHotkeyHandler([
        ['ctrl+v', async () => {
          const clipboard = await ClipboardHandler.create()

          const url = await clipboard.getURL()
          if (url) {
            try {
              const blob = await fetch(url).then((res) => res.blob())
              const image = await blobToBase64(blob)
              const isImage = image?.startsWith('data:image/jpeg') ||
                image?.startsWith('data:image/png')
              if (isImage) setThumbnail(image)
            } catch (err) {
              console.log(err)
            }

            return
          }

          const image = await clipboard.getImage()
          if (image) {
            setThumbnail(image)
            return
          }

          const video = await clipboard.getVideo()
          if (video) {
            setThumbnail(video)
            return
          }
        }],
        ['delete', () => setThumbnail(null)]

      ])}

    >
      <IconPhoto height={44}/>
    </UnstyledButton>
  )
}


function ThumbnailPreview({ thumbnail }: {thumbnail: string | null}) {
  return (thumbnail?.startsWith('data:image/png') || thumbnail?.startsWith('data:image/jpeg')) ?
    <Image m={8} height={120} width={300} radius='sm' src={thumbnail} /> :
    thumbnail?.startsWith('data:video/mp4') ?
      <AspectRatio ratio={16 / 9} m={8} p={0} >
        <video controls height={120} width='auto' >
          <source type="video/mp4" src={thumbnail} />
        </video>
      </AspectRatio> :
      null
}


export default function CreateNodeButton({ parentId, categoryId }:
{ parentId: number | null, categoryId: number }) {

  const utils = trpc.useContext()

  const createNewNode = useCreateNewNode()
  const [opened, { open, toggle, close }] = useDisclosure(false)

  const [name, setName] = useState('')
  const [url, setUrl] = useState<string | null>(null)
  const [icon, setIcon] = useState<string | null>(null)
  const [thumbnail, setThumbnail] = useState<string | null>(null)


  const submitHandler = async () => {
    // create new node
    await createNewNode.mutateAsync({ parentId, categoryId, name, url, icon, thumbnail }, {
      onSuccess: () => {
        // invalidate results
        utils.getQueriedNodes.invalidate()

        // clear the fields
        setName('')
        setUrl(null)
        setIcon(null)
        setThumbnail(null)

        // close the menu
        close()
      }
    })


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
          <UrlButton url={url} setUrl={setUrl}/>
          <IconButton icon={icon} setIcon={setIcon} />
          <ThumbnailButton thumbnail={thumbnail} setThumbnail={setThumbnail} />
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

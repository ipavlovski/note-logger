import { Group, Popover, TextInput, UnstyledButton } from '@mantine/core'
import { getHotkeyHandler } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import { IconLink } from '@tabler/icons'
import { OmnibarButtonStylesNames } from 'components/omnibar/omnibar'
import { useState } from 'react'

export default function UrlUploadButton({ classNames }: { classNames: OmnibarButtonStylesNames }) {
  const [uriInput, setUriInput] = useState('')
  const handleEnter = () => {
    showNotification({ message: `Uploading file to uri: ${uriInput}`, color: 'teal' })
  }

  return (
    <Popover width={350} position="bottom-start" withArrow shadow="md" radius="sm">
      <Popover.Target>
        <UnstyledButton
          className={classNames.rightSideIcon}
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

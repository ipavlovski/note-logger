import { useState } from 'react'
import { MultiSelect } from '@mantine/core'
import { IconChevronDown } from '@tabler/icons'
import { getHotkeyHandler } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'

const SERVER_URL = `https://localhost:${import.meta.env.VITE_SERVER_PORT}`

export default function Omnibar() {
  const [data, setData] = useState<{ value: string; label: string }[]>([])
  const [value, setValue] = useState<string[] | undefined>([])
  const [input, setInput] = useState<string>('')

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
      mb={16}
      data={data}
      value={value}
      onChange={setValue}
      placeholder="Enter a query..."
      searchable
      radius={'xl'}
      size={'xs'}
      rightSection={<IconChevronDown size={8} />}
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

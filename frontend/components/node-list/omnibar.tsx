import { useState } from 'react'
import { MultiSelect } from '@mantine/core'
import { IconChevronDown } from '@tabler/icons'

export default function Omnibar() {
  const [data, setData] = useState([
    { value: 'react', label: 'React' },
    { value: 'ng', label: 'Angular' },
  ])

  return (
    <MultiSelect
      mb={16}
      data={data}
      placeholder="Select items"
      searchable
      getCreateLabel={(query) => `+ Create ${query}`}
      radius={'xl'}
      size={'xs'}
      rightSection={<IconChevronDown size={8} />}
      onCreate={(query) => {
        const item = { value: query, label: query }
        setData((current) => [...current, item])
        return item
      }}
    />
  )
}

import { Center, MultiSelect } from '@mantine/core'
import { IconFilter } from '@tabler/icons-react'
import { trpc, useFilterStore } from 'components/app'


export default function Omnibar() {
  const selectedTags = useFilterStore((store) => store.tags)
  const { setTags } = useFilterStore((store) => store.actions)

  const allTags = trpc.getTags.useQuery('')

  // const { data: allTags } = useTagsQuery()
  if (! allTags.data) return null

  return (
    <Center>
      <MultiSelect
        style={{ width: 640 }}
        data={allTags.data.map(({ name }) => ({ value: name, label: `#${name}` }))}
        searchable
        radius={'lg'}
        rightSection={<></>}
        icon={<IconFilter size={24} stroke={2} />}
        m={24}
        styles={(theme) => ({
          input: { padding: 2 },
          label: { color: theme.colors.cactus[0], fontSize: 14 } })
        }
        value={selectedTags}
        onChange={setTags}
        placeholder={'Choose tags...'}

      />
    </Center>
  )
}

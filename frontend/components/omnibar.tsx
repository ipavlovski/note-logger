import { ActionIcon, Center, createStyles, Flex, MultiSelect, UnstyledButton } from '@mantine/core'
import { IconFilter, IconSquareToggleHorizontal, IconTexture, IconWriting } from '@tabler/icons-react'
import { trpc, useQueryStore, useViewTogglesStore } from 'components/app'


const useStyles = createStyles(() => ({
  regular: {
    margin: 2,
    color: 'white',
  },
  active: {
    color: 'green'
  }
}))

function LiveRenderToggle() {
  const { classes, cx } = useStyles()
  const isVisible = useViewTogglesStore((state) => state.liveRenderVisible)
  const { setLiveRenderVisible } = useViewTogglesStore((state) => state.actions)

  return (
    <ActionIcon
      onClick={() => setLiveRenderVisible(! isVisible)}
      className={cx(classes.regular, isVisible && classes.active)}
    >
      <IconSquareToggleHorizontal />
    </ActionIcon>
  )
}


function PreviewToggle() {
  const { classes, cx } = useStyles()
  const isVisible = useViewTogglesStore((state) => state.previewVisible)
  const { setPreviewVisible } = useViewTogglesStore((state) => state.actions)

  return (
    <ActionIcon
      onClick={() => setPreviewVisible(! isVisible)}
      className={cx(classes.regular, isVisible && classes.active)}
    >
      <IconTexture />
    </ActionIcon>
  )
}


function EditorToggle() {
  const { classes, cx } = useStyles()
  const isVisible = useViewTogglesStore((state) => state.editorVisible)
  const { setEditorVisible } = useViewTogglesStore((state) => state.actions)

  return (
    <ActionIcon
      onClick={() => setEditorVisible(! isVisible)}
      className={cx(classes.regular, isVisible && classes.active)}
    >
      <IconWriting />
    </ActionIcon>
  )
}

function RightSection() {
  return (
    <Flex>
      <EditorToggle />
      <PreviewToggle />
      <LiveRenderToggle />
    </Flex>
  )
}

export default function Omnibar() {
  const selectedTags = useQueryStore((store) => store.queryArgs.tags)
  const { setTags } = useQueryStore((store) => store.actions)

  const allTags = trpc.getTags.useQuery('')
  if (! allTags.data) return null

  return (
    <Center>
      <MultiSelect
        style={{ width: 640 }} radius={'lg'} m={24}
        styles={(theme) => ({
          input: { padding: 2 },
          label: { color: theme.colors.cactus[0], fontSize: 14 } })
        }
        searchable
        placeholder={'Choose tags...'}
        data={allTags.data.map(({ name }) => ({ value: name, label: `#${name}` }))}
        value={selectedTags} onChange={setTags}
        icon={<IconFilter size={24} stroke={2} />}
        rightSection={<RightSection />}
        rightSectionWidth={100}
      />
    </Center>
  )
}

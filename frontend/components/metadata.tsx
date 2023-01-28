import { createStyles, Group, Text } from '@mantine/core'
import { NodeWithSiblings } from 'backend/routes'

const useStyles = createStyles(theme => ({
  header: {
    fontSize: 20,
    color: theme.white,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 8,
  },
}))
export default function Metadata({ node }: { node: NodeWithSiblings }) {
  const { classes } = useStyles()

  return (
    <Text<'a'> href={node.uri} component="a" className={classes.header}>
      {node.title}
    </Text>
  )
}

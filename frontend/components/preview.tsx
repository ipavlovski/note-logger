import { Skeleton } from '@mantine/core'

export default function Preview({ height }: {height: string | number}) {
  return (
    <Skeleton animate={false} height={height} my={14} />
  )
}
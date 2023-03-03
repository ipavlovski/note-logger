import { Skeleton } from '@mantine/core'

export default function Preview({ height, width }: {height: number, width: number}) {
  return (
    <Skeleton animate={false} height={height} width={width}/>
  )
}
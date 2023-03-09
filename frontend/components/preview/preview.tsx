import { AspectRatio, Skeleton } from '@mantine/core'
import PDF from 'components/preview/pdf'
import { SERVER_URL } from 'components/app'

export default function Preview({ height }: {height: string | number}) {


  return (
    <PDF
      uri={`${SERVER_URL}/debugging-zine.pdf`}
      uris={[`${SERVER_URL}/debugging-zine.pdf?p=11`]}
    />
  )
}
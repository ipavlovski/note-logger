import { Grid, Skeleton, Image, Divider } from '@mantine/core'
import type { Image as PrismaImage } from '@prisma/client'

import { useRef, useState } from 'react'
import { Button, Modal, Group } from '@mantine/core'
import { Carousel, useAnimationOffsetEffect, Embla } from '@mantine/carousel'

const url = 'https://localhost:3003'

export default function Gallery({ images }: { images: PrismaImage[] }) {
  const [initSlide, setInitSlide] = useState(0)
  const [opened, setOpened] = useState(false)

  // transition duration sort of came as a bundle with all the embla stuff
  // can't get to transition properly, since there are some embla/mantine animation bugs going on
  const transitionDuration = 0
  const [embla, setEmbla] = useState<Embla | null>(null)

  // fixes a weird offset thing going on...
  useAnimationOffsetEffect(embla, transitionDuration)

  const items = images.map((image, ind) => {
    const cols = image.height <= image.width ? 3 : 2
    return (
      <Grid.Col key={image.id} xs={cols}>
        <Image
          onClick={() => {
            setInitSlide(ind)
            setOpened(true)
          }}
          style={{ cursor: 'pointer' }}
          radius={'md'}
          height={140}
          src={`${url}/${image.path}`}
          alt={image.source ?? ''}
        />
      </Grid.Col>
    )
  })

  const slides = images.map((image) => {
    return (
      <Carousel.Slide key={image.id}>
        <Image
          src={`${url}/${image.path}`}
          style={{
            objectFit: 'contain',
            marginLeft: 'auto',
            marginRight: 'auto',
            maxWidth: image.width,
          }}
        />
      </Carousel.Slide>
    )
  })


  return (
    <div>
      <Grid gutter={'xs'}>{items}</Grid>
      <Divider m="md" variant="dashed" />

      <Modal
        centered
        opened={opened}
        size="80vw"
        padding={6}
        radius={'md'}
        transitionDuration={transitionDuration}
        withCloseButton={false}
        onClose={() => setOpened(false)}
        // sx={{ display: 'flex', alignItems: 'start' }}
        overlayBlur={1}
      >
        <Carousel
          mx="auto"
          withIndicators
          // sx={{ flex: 1 }}
          draggable={false}
          initialSlide={initSlide}
          getEmblaApi={setEmbla}

        >
          {slides}
        </Carousel>
      </Modal>
    </div>
  )
}

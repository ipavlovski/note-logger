import { Carousel, Embla, useAnimationOffsetEffect } from '@mantine/carousel'
import { Divider, Grid, Image, Modal } from '@mantine/core'
import { useState } from 'react'
import { ElementContent } from 'react-markdown/lib/ast-to-react'


function extractNodeImages(nodes: ElementContent[]) {
  const images: { src: string, alt: string}[] = []
  const root = nodes[0]
  root.type == 'element' &&
    root.children.length > 0 &&
    root.children.forEach((child) => {
      child.type == 'element' &&
      child.tagName == 'img' &&
      child.properties?.src != null &&
      images.push({ src: `${child.properties?.src}`, alt: `${child.properties?.alt ?? ''}` })
    })
  return images
}


/**
 * ```
 * :::gallery
 * ![some desc text](https://localhost:3002/1678374705703.png)
 * ![](https://localhost:3002/1678374715256.png)
 * :::
 * ```
 */
export default function GalleryDirective({ nodes }: {nodes: ElementContent[]}) {

  const [initSlide, setInitSlide] = useState(0)
  const [opened, setOpened] = useState(false)

  // transition duration sort of came as a bundle with all the embla stuff
  // can't get to transition properly, since there are some embla/mantine animation bugs going on
  const transitionDuration = 0
  const [embla, setEmbla] = useState<Embla | null>(null)

  // fixes a weird offset thing going on...
  useAnimationOffsetEffect(embla, transitionDuration)

  // get only gallery images
  // const images = input.filter(({ type }) => type == 'gallery')
  const images = extractNodeImages(nodes)
  if (images.length == 0) return <div></div>

  const items = images.map((image, ind) => {
    // const cols = image.height <= image.width ? 3 : 2
    const cols = 3

    return (
      <Grid.Col key={ind} xs={cols}>
        <Image
          onClick={() => {
            setInitSlide(ind)
            setOpened(true)
          }}
          style={{ cursor: 'pointer' }}
          radius={'md'}
          height={140}
          src={image.src}
          alt={image.alt}
        />
      </Grid.Col>
    )
  })

  const slides = images.map((image, ind) => {
    return (
      <Carousel.Slide key={ind}>
        <Image
          src={image.src}
          style={{
            objectFit: 'contain',
            marginLeft: 'auto',
            marginRight: 'auto',
            // maxWidth: image.width,
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
        withCloseButton={false}
        onClose={() => setOpened(false)}
        // transitionDuration={transitionDuration}
        // sx={{ display: 'flex', alignItems: 'start' }}
        // overlayBlur={1}
      >

        <Carousel
          mx="auto"
          withIndicators
          // sx={{ flex: 1 }}
          draggable={false}
          initialSlide={initSlide}
          getEmblaApi={setEmbla}>
          {slides}
        </Carousel>
      </Modal>
    </div>
  )
}

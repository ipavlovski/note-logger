import { useHotkeys } from '@mantine/hooks'

import { useQueryCache } from 'frontend/apis/queries'
import { useMillerStore } from 'frontend/apis/stores'
import { getSelectionCache } from 'frontend/apis/utils'


export const useArrowShortcuts = () => {
  const { firstId, secondId, thirdId } = useMillerStore((state) => state.selection)
  const { selectFirst, selectSecond, selectThird } = useMillerStore((state) => state.actions)
  const queryCache = useQueryCache()

  const getPrevIndex = <T,>(arr: Array<T & { id: number }> | undefined, id: number | null) => {
    if (id == null || arr == null) return null
    const ind = arr.findIndex((elt) => elt.id == id)
    return ind != null && ind > 0 ? ind - 1 : null
  }

  const getNextIndex = <T,>(arr: Array<T & { id: number }> | undefined, id: number | null) => {
    if (id == null || arr == null) return null
    const ind = arr.findIndex((elt) => elt.id == id)
    return ind != null && ind != -1 && ind + 1 < arr.length ? ind + 1 : null
  }

  const activeColumn = firstId && secondId && thirdId ? 'third' :
    firstId && secondId ? 'second' :
      'first'

  useHotkeys([
    ['ArrowLeft', () => {
      if (activeColumn == 'third') secondId != null && selectSecond(secondId)
      if (activeColumn == 'second') firstId != null && selectFirst(firstId)
    }],

    ['ArrowRight',() => {

      if (activeColumn == 'first') {
        const cachedFirstId = getSelectionCache( { type: '1-2', key: firstId })

        if (cachedFirstId == null) {
          const videos = firstId && queryCache.getVideos(channelId)
          if (videos && videos.length > 0) setVideo(videos[0].id)
        }
        if (cachedFirstId != null) setVideo(cachedVideo.value)
      }

      if (activeColumn == 'second') {
        const cachedChapter = getSelectionCache( { type: '2-3', key: videoId })

        if (cachedChapter == null) {
          const chapters = videoId && queryCache.getChapters(videoId)
          if (chapters && chapters.length > 0) setChapter(chapters[0].id)
        }
        if (cachedChapter != null) setChapter(cachedChapter.value)
      }
    }],

    ['ArrowUp',() => {

      if (activeColumn == 'first') {
        const channels = queryCache.getChannels()
        const ind = getPrevIndex(channels, channelId)
        ind != null && channels != null && setChannel(channels[ind].id)
      }

      if (activeColumn == 'second') {
        const videos = channelId == null ? undefined : queryCache.getVideos(channelId)
        const ind = getPrevIndex(videos, videoId)
        ind != null && videos != null && setVideo(videos[ind].id)
      }

      if (activeColumn == 'third') {
        const chapters = videoId == null ? undefined : queryCache.getChapters(videoId)
        const ind = getPrevIndex(chapters, chapterId)
        ind != null && chapters != null && setChapter(chapters[ind].id)

      }
    }],

    ['ArrowDown',() => {

      if (activeColumn == 'first') {
        const channels = queryCache.getChannels()
        const ind = getNextIndex(channels, channelId)
        ind != null && channels != null && setChannel(channels[ind].id)
      }

      if (activeColumn == 'second') {
        const videos = channelId == null ? undefined : queryCache.getVideos(channelId)
        const ind = getNextIndex(videos, videoId)
        ind != null && videos != null && setVideo(videos[ind].id)
      }

      if (activeColumn == 'third') {
        const chapters = videoId == null ? undefined : queryCache.getChapters(videoId)
        const ind = getNextIndex(chapters, chapterId)
        ind != null && chapters != null && setChapter(chapters[ind].id)
      }
    }],
  ])
}

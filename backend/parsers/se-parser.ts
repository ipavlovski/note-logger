import { allStackExchangeSites, stackExchangeQuestion } from 'backend/api/se-api'
import { Parser } from 'backend/routes/node'
import { updateDomainIcon, updateMetadata } from 'backend/util'
import { URL } from 'url'


const knownSites = [
  { key: 'stackoverflow.com', value: 'stackoverflow' },
  { key: 'serverfault.com', value: 'serverfault' },
  { key: 'superuser.com', value: 'superuser' },
  { key: 'askubuntu.com', value: 'askubuntu' },
  { key: 'gis.stackexchange.com', value: 'gis' },
  { key: 'blender.stackexchange.com', value: 'blender' },
  { key: 'opensource.stackexchange.com', value: 'opensource' },
  { key: 'stats.stackexchange.com', value: 'stats' },
  { key: 'aviation.stackexchange.com', value: 'aviation' },
  { key: 'scifi.stackexchange.com', value: 'scifi' },
  { key: 'outdoors.stackexchange.com', value: 'outdoors' },
  { key: 'electronics.stackexchange.com', value: 'electronics' },
  { key: 'physics.stackexchange.com', value: 'physics' },
  { key: 'apple.stackexchange.com', value: 'apple' },
  { key: 'unix.stackexchange.com', value: 'unix' },
]

function commonMatcher(uri: string) {
  const url = new URL(uri)
  const match = knownSites.find(v => url.host.endsWith(v.key))
  return match != null && url.pathname.split('/').filter(Boolean)[1] != null
}

async function commonUpdater(nodeId: number, uri: string) {
  const url = new URL(uri)
  const match = knownSites.find(v => url.host.endsWith(v.key))
  const questionId = url.pathname.split('/').filter(Boolean)[1]
  const seData = await stackExchangeQuestion(questionId, match!.value)


  await updateMetadata(nodeId, [
    { key: 'title', type: 'string', value: seData.title},
    { key: 'created_at', type: 'date', value: seData.createdAt.toISOString()},
    { key: 'question_id', type: 'number', value: seData.questionId.toString()},
  ])
  await updateDomainIcon(nodeId, uri)


}

function uncommonMatcher(uri: string) {
  const url = new URL(uri)

  return url.hostname.endsWith('stackexchange.com')
}

async function uncommonUpdater(nodeId: number, uri: string) {
  const url = new URL(uri)

  const allSites = await allStackExchangeSites()
  const match = allSites.find(site => site.url == url.origin)
  const questionId = url.pathname.split('/').filter(Boolean)[1]
  const seData = await stackExchangeQuestion(questionId, match!.apiParam)

  await updateMetadata(nodeId, [
    { key: 'title', type: 'string', value: seData.title},
    { key: 'created_at', type: 'date', value: seData.createdAt.toISOString()},
    { key: 'question_id', type: 'number', value: seData.questionId.toString()},
  ])
  await updateDomainIcon(nodeId, uri)
}

export const seCommonParser: Parser = {
  name: 'common-se-parser',
  matcher: commonMatcher,
  updater: commonUpdater,
}

export const seUncommonParser: Parser = {
  name: 'uncommon-se-parser',
  matcher: uncommonMatcher,
  updater: uncommonUpdater,
}

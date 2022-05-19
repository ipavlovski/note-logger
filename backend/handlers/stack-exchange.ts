import { URL } from 'url'
import fetch from 'node-fetch'

async function allStackExchangeSites() {
  const url = 'https://api.stackexchange.com/2.3/sites?pagesize=400'
  return await fetch(url)
    .then(v => v.json())
    .then(v => v.items)
}

async function stackExchangeQuestion(id: string, site: string) {
  const link = `https://api.stackexchange.com/2.3/questions/${id}?site=${site}`
  return await fetch(link)
    .then(v => v.json())
    .then(v => v?.items[0])
}

async function stackExchangeFilter(url: URL) {
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

  const match = knownSites.find(v => url.host.endsWith(v.key))
  if (match) {
    const questionId = url.pathname.split('/').filter(Boolean)[1]
    var question = await stackExchangeQuestion(questionId, match.value)

    const output = {
      title: question.title,
      uri: `${question.id}`,
      category: ['stack-exchange', 'stack-site', 'question'],
    }

    return output
  }

  return null
}

export { stackExchangeFilter }

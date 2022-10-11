import { extractLightTitle, googleFaviconCache } from 'backend/api/domain-api'
import { Parser } from 'backend/routes/node'
import { fetchImageBuffer, saveAsIcon, updateDomainIcon, updateMetadata } from 'backend/util'


function domainMatcher(uri: string) {
  const url = new URL(uri)
  return url.protocol == 'https:' || url.protocol == 'http:'
}

async function domainUpdater(nodeId: number, uri: string) {
  const title = await extractLightTitle(uri)

  console.log('Updating node icon')
  await updateDomainIcon(nodeId, uri)

  console.log('Updating node metadata')
  await updateMetadata(nodeId, [{ key: 'title', type: 'string', value: title}])
}

export const domainParser: Parser = {
  name: 'domain-parser',
  matcher: domainMatcher,
  updater: domainUpdater,
}

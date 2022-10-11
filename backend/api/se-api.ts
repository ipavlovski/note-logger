import fetch from 'node-fetch'

interface StackExchangeSite {
  name: string
  url: string
  apiParam: string
}
export async function allStackExchangeSites() {
  const url = 'https://api.stackexchange.com/2.3/sites?pagesize=400'
  const sites = await fetch(url)
    .then(v => v.json())
    .then(v => v.items)

  return sites.map(
    (site: any) =>
      ({
        name: site.name,
        url: site.site_url,
        apiParam: site.api_site_parameter,
      } as StackExchangeSite)
  ) as StackExchangeSite[]
}

interface StackExchangeData {
  title: string
  questionId: number
  createdAt: Date
}

export async function stackExchangeQuestion(id: string, site: string): Promise<StackExchangeData> {
  const link = `https://api.stackexchange.com/2.3/questions/${id}?site=${site}`
  const question = await fetch(link)
    .then(v => v.json())
    .then(v => v?.items[0])

  if (!question) throw new Error('Issue fetching stack exchange daata')

  return {
    title: question.title,
    questionId: question.question_id,
    createdAt: new Date(question.creation_date * 1000),
  } as StackExchangeData
}

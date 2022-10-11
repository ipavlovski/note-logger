import fetch from 'node-fetch'

interface RedditPostData {
  title: string
  description: string
  subreddit: string
  createdAt: string
}

export async function getRedditPostData(uri: string) {
  const url = `${uri.replace(/\/$/, '')}.json?raw_json=1`
  const results = await fetch(url).then(v => v.json())

  return {
    title: results[0].data.children[0].data.title,
    description: results[0].data.children[0].data.selftext,
    subreddit: results[0].data.children[0].data.subreddit_name_prefixed,
    createdAt: results[0].data.children[0].data.created_utc,
  } as RedditPostData
}

interface SubredditData {
  title: string
  description: string
  subreddit: string
  createdAt: string
  icon: string
}
export async function getSubredditData(subreddit: string) {
  const url = `https://www.reddit.com/${subreddit}/about.json?raw_json=1`
  const results = await fetch(url).then(v => v.json())

  return {
    title: results.data.display_name,
    description: results.data.public_description,
    subreddit: results.data.display_name_prefixed,
    createdAt: results.data.created_utc,
    icon: results.data.community_icon,
  } as SubredditData
}

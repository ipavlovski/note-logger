import fetch from 'node-fetch'
import { URL } from 'url'

async function handleSubreddit(url: URL) {
  // this ia a subreddit
  var href = url.href.replace(/\/$/, '')
  var subredditUrl = `${href}/about.json?raw_json=1`
  var { data } = await fetch(subredditUrl).then(v => v.json())

  // data.created_utc
  const output = {
    title: data.display_name,
    uri: data.title,
    icon: data.icon_img,
    image: data.banner_img,
    category: ['reddit', 'subreddit'],
  }

  return output
}

async function handleRedditPost(url: URL) {
  var href = url.href.replace(/\/$/, '')
  var subredditUrl = `${href}/about.json?raw_json=1`
  var results = await fetch(subredditUrl).then(v => v.json())
  var data = results[0].data.children[0].data

  const output = {
    title: data.display_name,
    uri: data.title,
    icon: data.icon_img,
    image: data.banner_img,
    category: ['reddit', 'subreddit', 'post'],
  }

  return output
}

// var url6 = 'https://www.reddit.com/r/drones/about.json?raw_json=1'
// var url6 = 'https://www.reddit.com/r/Homebuilding/about.json?raw_json=1'
// var url6 = 'https://www.reddit.com/r/Homebuilding/comments/uqsvbs/is_it_possible_to_have_a_truly_quiet_house.json?raw_json=1'
async function redditFilter(url: URL) {
  if (url.origin != 'https://www.reddit.com') return null

  const splitUrl = url.pathname.split('/').filter(Boolean)

  if (splitUrl.length == 2) {
    return await handleSubreddit(url)
  } else if (splitUrl.length == 5) {
    return await handleRedditPost(url)
  } else {
    return null
  }
}

export { redditFilter }

import { readFile } from 'node:fs/promises'
import { Category, PrismaClient, Tag } from '@prisma/client'

const prisma = new PrismaClient()

await prisma.category.create({ data: { name: 'default', id: 0 } })

const data = await readFile('prisma/text.md', { encoding: 'utf8' })
const randomMds = data.split('-------------------------------------------').map((v) => v.trim())
const randomTitles = [
  'Lorem, ipsum dolor sit amet consectetur adipisicing.',
  'Maiores eius ipsa deserunt, hic nostrum voluptate?',
  'Quo delectus ducimus ipsa doloribus quae quis.',
  'Ipsam, blanditiis nihil architecto repudiandae aut rem!',
  'Dicta neque molestiae sunt odio! Deleniti, praesentium!',
  'Distinctio aliquid et, est hic maiores corporis.',
  'Ratione quaerat perspiciatis natus ad maxime illum!',
  'Aliquam quo ab numquam magnam perferendis! Deserunt.',
  'Obcaecati aspernatur tempore, aliquid alias ratione dolore?',
  'Unde animi, sit blanditiis illo eaque obcaecati.',
  'Iusto sequi odio magnam voluptatem officia. Consequuntur!',
  'Incidunt corrupti adipisci aspernatur velit iure assumenda?',
  'Iure, id voluptatem? Iste, distinctio! Accusantium, natus?',
  'Iusto vero ad, nesciunt tempora quaerat quisquam.',
  'Totam veritatis enim fuga non, adipisci ducimus!',
  'Animi, excepturi. Quidem aspernatur deserunt ut non.',
  'Ea temporibus, cupiditate a nostrum dolor officia.',
  'Libero cumque tempore nobis. Numquam, totam saepe?',
  'Architecto, tempora necessitatibus? Officiis, quis atque. Ab.',
  'Incidunt voluptate optio ex vel illum sit?',
  'Nisi sed cumque voluptatum omnis sit officia?',
  'Fuga quo excepturi nam, illum ullam dicta.',
  'Quis, non. Perferendis expedita quos quas vero?',
  'Magnam temporibus dolorem expedita voluptatibus, sint natus!',
  'Tenetur quae modi qui fugiat accusantium voluptas.',
  'Itaque quisquam atque reiciendis rem porro ea.',
  'Adipisci in amet ea ab, esse eligendi!',
  'Labore velit libero vel veritatis? Quisquam, id.',
  'Repellat, ad? Ad non qui sunt aliquam.',
  'Libero culpa minus quas nesciunt quaerat maxime!',
]

function getRandomTitle() {
  const randomInd = randomIntFromInterval(0, 29)
  return randomTitles[randomInd]
}

function getRandomMd() {
  const randomInd = randomIntFromInterval(0, 29)
  return randomMds[randomInd]
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}


async function getOrCreateCategory(chain: string[]) {
  let pid = 0
  let match: Category | undefined
  for (const name of chain) {
    match = await prisma.category.findFirst({ where: { name, pid } }) ||
     await prisma.category.create({ data: { name, pid } })
    pid = match.id
  }
  if (! match) throw new Error('Unable to create match')
  return match
}

async function getOrCreateTags(tags: string[]) {
  const results: Tag[] = []
  for (const tag of tags) {
    const match = await prisma.tag.findFirst({ where: { name: tag } }) ||
      await prisma.tag.create({ data: { name: tag } })
    results.push(match)
  }
  return results
}

async function createMockEntry(categoryId: number | undefined, tags: {id: number}[]) {
  await prisma.entry.create({ data: {
    markdown: getRandomMd(),
    categoryId: categoryId,
    title: randomIntFromInterval(0, 3) ? getRandomTitle() : undefined,
    createdAt: randomDate(new Date(2023, 1, 3), new Date(2023, 1, 27)),
    tags: { connect: tags }
  } })
}

async function createMockData(categories: string[][], tags: {tags: string[], levels: string[]}) {
  for (let i = 0; i < categories.length; i++) {
    const chain = categories[i]
    const matchedCategory = await getOrCreateCategory(chain)
    const matchedTags = await getOrCreateTags([...tags.tags, tags.levels[i]])
    for (let j = 1; j <= randomIntFromInterval(0, 3); j++) {
      await createMockEntry(matchedCategory.id, matchedTags.map((v) => ({ id: v.id })))
    }
  }
}


const youtubeCarsTags = { tags: ['youtube', 'cars'], levels: ['channel', 'video', 'chapter'] }
const youtubeCars = [
  ['chrisfix'],
  ['chrisfix', 'How to Replace an Alternator'],
  ['chrisfix', 'How to Replace an Alternator', 'windings'],
  ['chrisfix', 'How to Replace an Alternator', 'coils'],
  ['chrisfix', 'How to Start a Car Thats Been Sitting for Years'],
  ['chrisfix', 'How to Fix a Chipped or Cracked Windshield (Like Brand New)'],
  ['chrisfix', 'How to Fix a Chipped or Cracked Windshield (Like Brand New)', 'repair start'],
  ['chrisfix', 'How to Fix a Chipped or Cracked Windshield (Like Brand New)', 'repair end'],
  ['speekar99'],
  ['speekar99', 'How a Fuel Pump Works'],
  ['speekar99', 'How a Fuel Pump Works', 'testing'],
  ['speekar99', 'How a Fuel Pump Works', 'dc motor'],
  ['speekar99', 'How a Fuel Pump Works', 'spring'],
  ['speekar99', 'How a Fuel Pump Works', 'fuel filter'],
  ['speekar99'],
  ['speekar99', 'Why Honda V6 Engines Havent Changed For 25 Years'],
  ['speekar99', 'How Automotive Suspension Systems Work'],
  ['speekar99', 'How Automotive Suspension Systems Work', 'fans'],
  ['speekar99', 'How Automotive Suspension Systems Work', 'coolant'],
]
await createMockData(youtubeCars, youtubeCarsTags)


const youtubeCodeTags = { tags: ['youtube', 'code'], levels: ['channel', 'video', 'chapter'] }
const youtubeCode = [
  ['fireship'],
  ['fireship', 'Unreal in 100 Seconds'],
  ['fireship', 'JavaScript for the Haters'],
  ['fireship', '7 Things No Programmer Ever Wants to Hear'],
  ['fireship', '7 Things No Programmer Ever Wants to Hear', 'Zero-day'],
  ['fireship', '7 Things No Programmer Ever Wants to Hear', 'Vulnerable packages'],
  ['fireship', '7 Things No Programmer Ever Wants to Hear', 'XSS'],
  ['fireship', '7 Things No Programmer Ever Wants to Hear', 'SQL Injection'],
  ['fireship', '7 Things No Programmer Ever Wants to Hear', 'Credential Leaks'],
  ['fireship', '7 Things No Programmer Ever Wants to Hear', 'Principle of Least Privilege'],
  ['fireship', '7 Things No Programmer Ever Wants to Hear', 'DDoS'],
  ['jack-herrington',],
  ['jack-herrington', 'Signals For Solid, Qwik And React'],
  ['jack-herrington', 'Signals For Solid, Qwik And React', 'Qwik Implementation'],
  ['jack-herrington', 'Signals For Solid, Qwik And React', 'Qwik take on Qwik'],
  ['jack-herrington', 'Signals For Solid, Qwik And React', 'What is Fine Grained Updating?'],
  ['jack-herrington', 'Signals For Solid, Qwik And React', 'hacking "Fine Grained" Into React'],
  ['jack-herrington', 'Astro 2.0 is Revolutionary! Again!'],
]
await createMockData(youtubeCode, youtubeCodeTags)


const stackTags = { tags: ['stackexchange', 'code'], levels: ['stacksite', 'question', 'answer'] }
const stackExchange = [
  ['askubuntu'],
  ['askubuntu', 'Mouse pointer disappears in Ubuntu 16.04'],
  ['askubuntu', 'How can I copy a file from one partition to another?'],
  ['askubuntu', 'How can I copy a file from one partition to another?', 'ddutil'],
  ['askubuntu', 'How can I copy a file from one partition to another?', 'dcutil'],
  ['askubuntu', 'Lot of dpkg package missing, but I cant reinstall them'],

  ['stackoverflow'],
  ['stackoverflow', 'Generate random number between two numbers in JavaScript'],
  ['stackoverflow', 'Generating random whole numbers in JavaScript in a specific range'],
  ['stackoverflow', 'How do I create a GUID / UUID?'],
  ['stackoverflow', 'How do I create a GUID / UUID?', 'using UUID'],
  ['stackoverflow', 'How do I create a GUID / UUID?', 'using RFC4122'],
]
await createMockData(stackExchange, stackTags)


const redditTags = { tags: ['reddit'], levels: ['subreedit', 'post', 'comment'] }
const reddit = [
  ['r/SCCM'],
  ['r/SCCM', 'TIP: Uninstall Autodesk Products'],

  ['r/VFIO'],
  ['r/VFIO', 'Virtio-fs is amazing! (plus how I set it up)'],
  ['r/VFIO', 'Virtio-fs is amazing! (plus how I set it up)', 'github based instrucitons'],
  ['r/VFIO', 'Virtio-fs is amazing! (plus how I set it up)', 'other instrucitons'],
]
await createMockData(reddit, redditTags)


const moreTags = ['bash', 'shell', 'code', 'youtube', 'typescript', 'javascript', 'react', 'linux']
await getOrCreateTags(moreTags)

const md1 = `A paragraph with *emphasis* and **strong importance**.

> A block quote with ~strikethrough~ and a URL: https://reactjs.org.

* Lists
* [ ] todo
* [x] done

A table:

| a | b |
| - | - |

## GitHub flavored markdown (GFM)

For GFM, you can *also* use a plugin:
[lol](https://github.com/remarkjs/react-markdown#use).
It adds support for GitHub-specific extensions to the language:
tables, strikethrough, tasklists, and literal URLs.

These features **do not work by default**.
👆 Use the toggle above to add the plugin.

| Feature    | Support              |
| ---------: | :------------------- |
| CommonMark | 100%                 |
| GFM        | 100% w/ remark-gfm |

~~strikethrough~~

* [ ] task list
* [x] checked item

https://example.com
`

await prisma.entry.create({
  data: {
    markdown: md1,
    tags: { connect: [{ name: 'shell' }, { name: 'code' }] },
    createdAt: randomDate(new Date(2023, 1, 3), new Date(2023, 1, 27)),
  },
})

const md2 = `Here is some typescript-react code:

~~~tsx
console.log('It works!')

return <h1>lol</h1>
~~~
`

await prisma.entry.create({
  data: {
    markdown: md2,
    tags: { connect: [{ name: 'react' }, { name: 'typescript' }, { name: 'code' }] },
    createdAt: randomDate(new Date(2023, 1, 3), new Date(2023, 1, 27))
  },
})

await prisma.entry.create({
  data: {
    markdown: 'Testing 1 2 3',
    createdAt: randomDate(new Date(2023, 1, 3), new Date(2023, 1, 27)),
  },
})

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const tags = ['bash', 'shell', 'code', 'youtube', 'typescript', 'javascript', 'react', 'linux']
for (const tag of tags) await prisma.tag.create({ data: { name: tag } })

await prisma.category.create({ data: { name: 'default', id: 0 } })

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
    tags: { connect: [{ name: 'shell' }, { name: 'code' }] }
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
    tags: { connect: [{ name: 'react' }, { name: 'typescript' }, { name: 'code' }] }
  },
})

await prisma.entry.create({
  data: {
    markdown: 'Testing 1 2 3'
  },
})



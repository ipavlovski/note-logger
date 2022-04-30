import React, { ClipboardEvent, useRef, useState, useEffect } from 'react'

import './index.css'

import { VideoNode } from 'common/types'
import { YouTube } from 'frontend/components/Preview'
import { TreeNodes } from 'frontend/components/Nodes'
import { CustomButton, MyComponent } from 'frontend/components/Omnibar'
import { Leafs } from 'frontend/components/Leafs'

const initmd = `
Here is some JavaScript code:

~~~js
console.log('It works!')
~~~

## hellow world 2
A paragraph with *emphasis* and **strong importance**.

> A block quote with ~strikethrough~ and a URL: https://reactjs.org.

* Lists
* [ ] todo
* [x] done

A table:

| a | b |
| - | - |
|data|df sf|
`

const videoNodes: VideoNode[] = [
  {
    videoTitle: 'some vid1',
    videoId: 'M7lc1UVf-VE',
    segments: [
      { seconds: 100, title: 'some stuff 1' },
      { seconds: 200, title: 'some stuff 2' },
      { seconds: 1300, title: 'some stuff 3' },
    ],
  },
  {
    videoTitle: 'some vid2',
    videoId: 'XxVg_s8xAms',
    segments: [
      { seconds: 150, title: 'other stuff 1' },
      { seconds: 250, title: 'other stuff 2' },
      { seconds: 350, title: 'other stuff 3' },
    ],
  },
]

function App() {
  return (
    <div>
      <YouTube videoNode={videoNodes[0]} />
      <TreeNodes videoNodes={videoNodes} />
      <MyComponent />
      <CustomButton />
      <Leafs initmd={initmd} />
    </div>
  )
}

export default App

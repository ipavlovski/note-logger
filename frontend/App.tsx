import React, { ClipboardEvent, useRef, useState, useEffect } from 'react'

import './index.css'

import Omnibar from 'frontend/components/Omnibar'
import Nodes from 'frontend/components/Nodes'
import Preview from 'frontend/components/Preview'
import Leafs from 'frontend/components/Leafs'

function App() {
  return <>
    <Preview />
    <Omnibar />
    <Nodes videoNodes={[]} />
    <Leafs initmd={''} />
  </>
}

export default App

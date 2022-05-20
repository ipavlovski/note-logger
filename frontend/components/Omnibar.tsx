import { useState } from 'react'
import Select, { StylesConfig } from 'react-select'

export default function Omnibar() {


  const dostuff = () => {
    console.log('uh oh!!!')
  }

  return (
    <div>
      <h2>Omnibar:</h2>
      {/* <Select options={options} styles={customStyles} /> */}
      <Select />
      <button  onClick={dostuff}> click me</button>
      
    </div>
  )
}


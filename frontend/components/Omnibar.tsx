import { useState } from 'react'
import Select, { StylesConfig } from 'react-select'

export default function Omnibar() {
  // const options = [
  //   { value: 'chocolate', label: 'Chocolate' },
  //   { value: 'strawberry', label: 'Strawberry 2' },
  //   { value: 'vanilla', label: 'Vanilla' },
  //   { value: 'berry', label: 'Berry' },
  // ]

  // const customStyles: StylesConfig = {
  //   menu: (provided: any, state: any) => ({
  //     ...provided,
  //     borderBottom: '4px dotted pink',
  //     color: state.selectProps.menuColor,
  //     padding: 20,
  //   }),
  // }

  const options = [
    { value: 'a', label: 'AAAA'},
    { value: 'b', label: 'BBB'}
  ]

  const styles: StylesConfig = {
    
  }

  return (
    <div>
      <h2>Omnibar:</h2>
      {/* <Select options={options} styles={customStyles} /> */}
      <Select options={options}/>
    </div>
  )
}


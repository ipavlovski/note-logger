import { useState } from 'react'
import Select, { StylesConfig } from 'react-select'

function MyComponent() {
  const options = [
    { value: 'chocolate', label: 'Chocolate' },
    { value: 'strawberry', label: 'Strawberry' },
    { value: 'vanilla', label: 'Vanilla' },
    { value: 'berry', label: 'Berry' },
  ]

  const customStyles: StylesConfig = {
    menu: (provided: any, state: any) => ({
      ...provided,
      borderBottom: '4px dotted pink',
      color: state.selectProps.menuColor,
      padding: 20,
    }),
  }

  return (
    <div>
      <h2>Basic Styled</h2>
      <Select options={options} styles={customStyles} />
    </div>
  )
}

function CustomButton() {
    const [msg, setButtonText] = useState('test...')
  
    const fetchData = () => {
      const text = fetch('https://homelab:3002/select')
        .then(v => v.text())
        .then(t => {
          console.log('fetched text is: ', t)
          setButtonText(t)
        })
    }
  
    return (
      <>
        <button onClick={fetchData}>{msg}</button>
      </>
    )
  }

export { MyComponent, CustomButton }

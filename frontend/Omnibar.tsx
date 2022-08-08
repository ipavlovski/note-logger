import { ClipboardEvent, KeyboardEventHandler, useContext, useEffect, useState } from 'react'
import { ActionMeta, OnChangeValue, StylesConfig } from 'react-select'
import CreatableSelect from 'react-select/creatable'
import chroma from 'chroma-js'
import { Context } from 'frontend/App'

interface Option {
  readonly label: string
  readonly value: string
  readonly color: string
}

export default function Omnibar() {
  const [imgURL, setImgURL] = useState('https://picsum.photos/420/320')
  const [msg, setMsg] = useState('this is a message...')

  const { state, dispatch } = useContext<Context>(Context)

  useEffect(() => {
    if (state.selectedNodes.length > 0) {
      const oldValues = value.filter(v => v.value != 'selected')
      const newValue: Option = {
        label: `selected: ${state.selectedNodes.length}`,
        value: 'selected',
        color: 'black',
      }
      setValue(oldValues.concat(newValue))
    } else {
      const oldValues = value.filter(v => v.value != 'selected')
      setValue(oldValues)
    }
  }, [state.selectedNodes])

  const handleClipboardEvent = (e: ClipboardEvent<HTMLInputElement>) => {
    // @ts-ignore
    const descriptor: PermissionDescriptor = { name: 'clipboard-read' }

    navigator.permissions.query(descriptor).then(result => {
      // If permission to read the clipboard is granted or if the user will
      // be prompted to allow it, we proceed.

      if (result.state == 'granted' || result.state == 'prompt') {
        navigator.clipboard.read().then(allData => {
          const data = allData[0]
          if (data.types.includes('text/plain')) {
            data.getType('text/plain').then(async blob => {
              const txt = await blob.text()

              const res = await fetch('https://localhost:3002/url', {
                method: 'POST',
                body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=m68FDmU0wGw' }),
                headers: { 'Content-Type': 'application/json' },
              })

              const results = await res.json()
              console.log(results)

              const url2 = `data:image/webp;base64,${results.icon.file}`

              setImgURL(url2)
              setMsg(results.title)
            })
          } else if (data.types.includes('image/png')) {
            data.getType('image/png').then(async blob => {
              const url = URL.createObjectURL(blob)

              const formData = new FormData()
              formData.append('some_text', 'tes')
              formData.append('avatar', blob, 'lolpath')

              const res = await fetch('https://localhost:3002/multi', {
                method: 'POST',
                body: formData,
              })

              const result = await res.json()

              const mimeType = 'image/png'
              const url2 = `data:${mimeType};base64,${result.tmp}`

              setImgURL(url2)
            })
          } else {
            console.log('Unknown buffer contents')
          }
        })
      }
    })
  }

  const [value, setValue] = useState([{ label: 'lol', value: 'lol1', color: chroma.random().hex() }])
  const [inputValue, setInputValue] = useState('')

  // this handles different default (clear/remove) actions
  // new 'modified' value is passed through it, but it needs to be 'handled'
  const handleChange = (value: OnChangeValue<Option, true>, actionMeta: ActionMeta<Option>) => {
    console.log(`action: ${actionMeta.action}`)
    console.dir(actionMeta)
    if ((actionMeta.action == 'pop-value' || actionMeta.action == 'remove-value') 
    && actionMeta.removedValue.value == 'selected') {
      state.selectedNodes.forEach(v => {
        dispatch({ type: 'DESELECT_NODE', payload: { id: v.id } })
      })
    }
    setValue([...value])
  }

  // handle changes to the 'total input' - get the full current value
  const handleInputChange = (inputValue: string) => {
    setInputValue(inputValue)
  }

  // handle changes of the individual keys
  // able to detect each key and process it
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = event => {
    // if no input, then prevent enter/tab from doing anything
    if (!inputValue) return

    // use Enter and Tab as 'confirm' keys
    switch (event.key) {
      case 'Enter':
      case 'Tab':
        // don't do anything if the the label already exists
        if (value.find(v => v.label == inputValue)) return
        // reset the current input value
        setInputValue('')
        // and set the new value
        setValue([...value, { label: inputValue, value: inputValue, color: chroma.random().hex() }])
        event.preventDefault()
    }
  }

  // change components of the react-select
  const components = { DropdownIndicator: null }

  const colourStyles: StylesConfig<Option, true> = {
    control: styles => ({
      ...styles,
      borderRadius: 50,
      height: '1rem',
      backgroundColor: 'white',
    }),

    option: (styles, { data, isDisabled, isFocused, isSelected }) => {
      const color = chroma(data.color)
      // const color = chroma.random()
      // const color = chroma('#fefefe')
      return {
        ...styles,
        backgroundColor: isDisabled
          ? undefined
          : isSelected
          ? data.color
          : isFocused
          ? color.alpha(0.1).css()
          : undefined,
        color: isDisabled
          ? '#ccc'
          : isSelected
          ? chroma.contrast(color, 'white') > 2
            ? 'white'
            : 'black'
          : data.color,
        cursor: isDisabled ? 'not-allowed' : 'default',

        ':active': {
          ...styles[':active'],
          backgroundColor: !isDisabled
            ? isSelected
              ? data.color
              : color.alpha(0.1).css()
            : undefined,
        },
      }
    },

    multiValue: (styles, { data }) => {
      const color = chroma(data.color)
      return {
        ...styles,
        borderRadius: 50,
        backgroundColor: color.alpha(0.4).css(),
      }
    },

    multiValueLabel: (styles, { data }) => ({
      ...styles,
      color: data.color,

      ':hover': {
        backgroundColor: data.color,
        borderTopLeftRadius: 50,
        borderBottomLeftRadius: 50,
        color: 'white',
      },
    }),

    multiValueRemove: (styles, { data }) => ({
      ...styles,
      color: data.color,
      ':hover': {
        backgroundColor: data.color,
        color: 'white',
      },
    }),
  }

  return (
    <div onPasteCapture={handleClipboardEvent} style={{ gridArea: 'omnibar' }}>
      <CreatableSelect
        isClearable
        isMulti
        components={components}
        value={value}
        inputValue={inputValue}
        menuIsOpen={false}
        placeholder="Type something and press enter..."
        onChange={handleChange}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
        styles={colourStyles}
        
      />
      {/* <p>{msg}</p> */}
      {/* <img src={imgURL} /> */}
    </div>
  )
}

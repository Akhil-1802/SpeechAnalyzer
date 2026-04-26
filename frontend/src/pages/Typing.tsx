import axios from 'axios';
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'

function Typing() {
  const {topic } = useParams();
  const [text, setText] = useState<string >("")
  const handleSubmit = async() =>{
    try {
      const response = await axios.post('http://localhost:3000/topic',{topic})
      console.log(response)
    } catch (error) {
      console.log(error)
    }
    console.log(text)
    console.log(topic)
    setText("")
  }
  return (

    <div>
      <input type="text" placeholder='Enter your text' value={text} onChange={(e  )=>setText(e.target.value)} />
        <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}

export default Typing
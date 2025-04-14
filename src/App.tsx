import { useState } from 'react'
import Whisper from 'whisper.cpp'
import './App.css'

const whisper = Whisper()

function App() {
  const [audio, setAudio] = useState<Float32Array | null>(null)
  const [language, setLanguage] = useState<string>('zh')

  return (
    <>
      <form>
        <div>
          <label htmlFor="model">Model:</label>
          <input
            type="file"
            name="model"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                whisper.loadLocalModel(file)
              }
            }}
          />
        </div>
        <div>
          <label htmlFor="audio">Audio:</label>
          <input
            type="file"
            name="audio"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                whisper.loadAudio(file).then((audio) => {
                  setAudio(audio)
                })
              }
            }}
          />
        </div>
        <div>
          <label htmlFor="language">Language:</label>
          <input
            type="text"
            name="language"
            value="zh"
            onChange={(event) => {
              setLanguage(event.target.value)
            }}
          />
        </div>
        <div>
          <button
            onClick={(event) => {
              event.preventDefault()
              if (audio) {
                whisper.process(audio, language, 8)
              }
            }}
          >
            Submit
          </button>
        </div>
      </form>
    </>
  )
}

export default App

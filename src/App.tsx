import { useState } from 'react'
import Whisper from 'whisper.cpp'
import './App.css'

const whisper = Whisper()

function App() {
  const [model, setModel] = useState<string>('')
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
          <button
            onClick={(event) => {
              event.preventDefault()
              setModel('base-q5_1')
              whisper
                .loadRemoteModel('base-q5_1', {
                  url: '/ggml-base-q5_1.bin',
                  onProgress: (progress) => {
                    console.log('Progress:', progress)
                  },
                })
                .then(() => {
                  console.log('Model loaded')
                })
            }}
          >
            load base
          </button>
          <button
            onClick={(event) => {
              event.preventDefault()
              setModel('small-q5_1')
              whisper
                .loadRemoteModel('small-q5_1', {
                  url: '/ggml-small-q5_1.bin',
                  onProgress: (progress) => {
                    console.log('Progress:', progress)
                  },
                })
                .then(() => {
                  console.log('Model loaded')
                })
            }}
          >
            load small
          </button>
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
            value={language}
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
                whisper.process(audio, {
                  model,
                  language,
                  nthreads: 8,
                })
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

import Whisper from 'whisper.cpp'
import {
  Button,
  Card,
  CardBody,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from '@heroui/react'
import './App.css'
import reactLogo from './assets/react.svg'
import { transcribe } from './services/TranscriptService'

const whisper = Whisper()

function App() {
  return (
    <>
      <Navbar>
        <NavbarBrand>
          <img src={reactLogo} className="logo" alt="Vite logo" />
          <p className="font-bold text-inherit">Transcript</p>
        </NavbarBrand>
        <NavbarContent className="flex gap-4" justify="start">
          <NavbarItem>
            <Link color="foreground" href="#">
              Home
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="#">
              Meeting
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="#">
              Interview
            </Link>
          </NavbarItem>
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button as={Link} color="primary" href="#" variant="flat">
              Settings
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      <div className="md:container">
        <h1>Audio to Text Converter</h1>
        <p>Upload an audio file and convert it to text in seconds.</p>
        <Card shadow="none" fullWidth>
          <CardBody>
            <Button className="relative" size="lg">
              Upload Your File
              <input
                className="absolute inset-0 opacity-0 cursor-pointer"
                type="file"
                onChange={async (event) => {
                  try {
                    const file = event.target.files?.[0]
                    if (file) {
                      await transcribe(file)
                      // const audio = await whisper.loadAudio(file)
                      // await whisper.loadRemoteModel('small-q5_1', {
                      //   url: '/ggml-small-q5_1.bin',
                      //   onProgress: (progress) => {
                      //     console.log('Progress:', progress)
                      //   },
                      // })
                      // const result = await whisper.process(audio, {
                      //   model: 'small-q5_1',
                      //   language: 'auto',
                      //   nthreads: 8,
                      // })
                      // console.log(result)
                    }
                  } catch (error) {
                    console.log(error)
                  }
                }}
              />
            </Button>
            <p>supports media files of any duration.</p>
          </CardBody>
        </Card>
      </div>
    </>
  )
}

export default App

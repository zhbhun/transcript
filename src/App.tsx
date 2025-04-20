import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from '@heroui/react'
import BackgroundPaths from './components/BackgroundPaths'
import TranscriptList from './components/TranscriptList'
import { useTranscriptStore } from './stores'
import assets_logo from './assets/logo.svg'
import assets_upload from './assets/upload.svg'
import './App.css'
import { useShallow } from 'zustand/shallow'
import { useEffect } from 'react'

export default function App() {
  const [records, initiate, transcribe] = useTranscriptStore(
    useShallow((state) => [state.records, state.initiate, state.transcribe])
  )
  useEffect(() => {
    initiate()
  }, [initiate])
  return (
    <div className="bg-neutral-100 dark:bg-neutral-950">
      <Navbar isBordered maxWidth="full">
        <NavbarBrand>
          <img
            src={assets_logo}
            className="w-8 h-8 transition-transform hover:rotate-180"
            alt="Transcript logo"
          />
          <p className="ml-2 font-bold text-inherit">Transcript</p>
        </NavbarBrand>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button
              as={Link}
              href="#"
              variant="light"
              startContent={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              }
            >
              Settings
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      <BackgroundPaths
        className="-mt-16"
        title="Transcript"
        subtitle="Upload an audio file and convert it to text"
      >
        <Card
          className="relative mt-[10vh] w-full min-h-[32vh] border-2 border-dashed p-8 sm:w-5/6 md:w-4/6 lg:w-3/6 xl:w-2/6 group hover:border-primary transition-colors duration-300 dark:hover:border-primary-500"
          disableRipple
          fullWidth
          isHoverable
          isPressable
          shadow="none"
        >
          <CardBody className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="relative">
              <img
                className="block mx-auto w-12 h-12"
                src={assets_upload}
                alt="Upload Icon"
              />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              选择音频文件
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              拖放或点击浏览
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              支持 MP3、WAV、M4A 和其他常见音频格式
            </div>
          </CardBody>
          <input
            className="absolute inset-0 opacity-0 cursor-pointer"
            type="file"
            accept="audio/*"
            onChange={async (event) => {
              try {
                const file = event.target.files?.[0]
                if (file) {
                  transcribe(file)
                }
              } catch (error) {
                console.log(error)
              }
            }}
          />
        </Card>
      </BackgroundPaths>
      {records.length > 0 ? (
        <div className="container -mt-[10vh] mx-auto px-4 py-8">
          <Card shadow="none">
            <CardHeader className="p-4">
              <h2 className="text-2xl font-semibold">
                {`${records.filter((r) => r.status === 2).length} / ${
                  records.length
                } audios processed`}
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="p-0">
              <TranscriptList records={records} onViewDetails={() => {}} />
            </CardBody>
          </Card>
        </div>
      ) : null}
    </div>
  )
}

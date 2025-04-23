import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardBody, CardHeader, Divider } from '@heroui/react'
import ArrowUpTrayIcon from '@heroicons/react/24/outline/ArrowUpTrayIcon'
import { useShallow } from 'zustand/shallow'
import BackgroundPaths from '@/components/BackgroundPaths'
import TranscriptList from '@/components/TranscriptList'
import { useTranscriptStore } from '@/stores'

export default function Home() {
  const navigate = useNavigate()
  const [records, initiate, transcribe] = useTranscriptStore(
    useShallow((state) => [state.records, state.initiate, state.transcribe])
  )
  useEffect(() => {
    initiate()
  }, [initiate])
  return (
    <>
      <BackgroundPaths
        className="-mt-16"
        title="Transcript"
        subtitle="Upload an audio file and convert it to text"
      >
        <Card
          className="relative mt-[10vh] w-full min-h-[32vh] border-2 border-dashed p-8 sm:w-5/6 md:w-4/6 xl:w-3/6 group hover:border-primary transition-colors duration-300 dark:hover:border-primary-500"
          disableRipple
          fullWidth
          isHoverable
          isPressable
          shadow="none"
        >
          <CardBody className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="relative">
              <ArrowUpTrayIcon className="w-12 h-12" />
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
              <TranscriptList
                records={records}
                onClick={(record) => {
                  navigate(`/transcript/${record.id}`)
                }}
              />
            </CardBody>
          </Card>
        </div>
      ) : null}
    </>
  )
}

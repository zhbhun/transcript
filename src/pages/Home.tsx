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
        <div className="container">
          <Card
            className="relative mt-[10vh] w-full min-h-[32vh] border-2 border-dashed p-8 transition-colors duration-300 group hover:border-primary dark:hover:border-primary-500"
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
        </div>
      </BackgroundPaths>
      <div className="relative z-0 -mt-[10vh] mb-48">
        {records.length > 0 ? (
          <div className="container mx-auto mb-48">
            <Card shadow="none" fullWidth>
              <CardHeader className="p-4">
                <h2 className="text-2xl font-semibold">
                  {`${records.filter((r) => r.status === 2).length} / ${
                    records.length
                  } audios processed`}
                </h2>
              </CardHeader>
              <Divider />
              <CardBody className="min-h-[40vh] p-0">
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

        {/* Feature Section */}
        <div className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-24">
              Transcript 核心特性
            </h2>
            <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-sm p-8 md:p-12 max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                {/* Feature 1 */}
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-10 h-10 text-primary"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6l4 2"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">免费且开源</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      完全免费，源代码开放，随时可用，无需注册。
                    </p>
                  </div>
                </div>
                {/* Feature 2 */}
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-10 h-10 text-primary"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 15v2m0 0a4 4 0 100-8 4 4 0 000 8zm0 0v2m0-2a4 4 0 110-8 4 4 0 010 8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      本地运行，隐私安全
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      所有音频和转录数据仅在本地处理，保障您的隐私安全。
                    </p>
                  </div>
                </div>
                {/* Feature 3 */}
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-10 h-10 text-primary"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6m-6 0a2 2 0 01-2-2v-2a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2m-6 0v2a2 2 0 002 2h2a2 2 0 002-2v-2"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      多格式音频支持
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      支持 MP3、WAV、M4A 等多种常见音频格式。
                    </p>
                  </div>
                </div>
                {/* Feature 4 */}
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-10 h-10 text-primary"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      批量上传与转录
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      可一次上传多个音频文件，批量转录高效便捷。
                    </p>
                  </div>
                </div>
                {/* Feature 5 */}
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-10 h-10 text-primary"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">转录结果导出</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      支持将转录文本导出为 TXT 等格式，方便后续使用。
                    </p>
                  </div>
                </div>
                {/* Feature 6 */}
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-10 h-10 text-primary"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">简洁易用界面</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      界面简洁直观，操作流畅，适合所有用户。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="w-full py-8 dark:bg-neutral-950 border-t border-gray-100 dark:border-neutral-800 mt-0">
        <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          © 2024 Transcript · 免费开源 · 本地隐私安全
        </div>
      </footer>
    </>
  )
}

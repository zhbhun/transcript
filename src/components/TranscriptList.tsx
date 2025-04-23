import { Card, CardBody, CircularProgress } from '@heroui/react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { TranscriptRecord } from '../types'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function getExtensionStyle(extension: string): {
  border: string
  text: string
} {
  const ext = extension.toLowerCase()
  switch (ext) {
    case 'mp3':
    case 'wav':
    case 'm4a':
    case 'aac':
    case 'ogg':
      return {
        border: 'border-indigo-400/30 dark:border-indigo-400/20',
        text: 'text-indigo-600 dark:text-indigo-400',
      }
    case 'mp4':
    case 'mov':
    case 'avi':
    case 'mkv':
      return {
        border: 'border-blue-400/30 dark:border-blue-400/20',
        text: 'text-blue-600 dark:text-blue-400',
      }
    case 'txt':
    case 'doc':
    case 'docx':
    case 'pdf':
      return {
        border: 'border-rose-400/30 dark:border-rose-400/20',
        text: 'text-rose-600 dark:text-rose-400',
      }
    default:
      return {
        border: 'border-slate-300 dark:border-slate-600/40',
        text: 'text-slate-600 dark:text-slate-400',
      }
  }
}

function getStatusRingColor(status: TranscriptRecord['status']): string {
  switch (status) {
    case 0: // waiting
      return 'ring-yellow-700/80 dark:ring-yellow-400/80'
    case 1: // processing
      return 'ring-blue-700/80 dark:ring-blue-400/80'
    case 2: // completed
      return 'ring-green-700/80 dark:ring-green-400/80'
    case 3: // error
      return 'ring-red-700/80 dark:ring-red-400/80'
    case 4: // cancelled
      return 'ring-gray-400/80 dark:ring-gray-700/80'
    default:
      return 'ring-gray-300/80 dark:ring-gray-600/80'
  }
}

interface TranscriptListProps {
  records: (TranscriptRecord & { progress: number })[]
  onClick?: (record: TranscriptRecord) => void
}

export default function TranscriptList({
  records,
  onClick,
}: TranscriptListProps) {
  return (
    <div role="list" className="divide-y divide-gray-100 dark:divide-gray-800">
      {records.map((record) => {
        const extension = record.format
        const extensionStyle = getExtensionStyle(extension)
        return (
          <Card
            key={record.id}
            className="relative cursor-pointer"
            disableRipple
            fullWidth
            shadow="none"
            radius="none"
            isHoverable
            isPressable
            onPress={() => onClick?.(record)}
          >
            <CardBody className="flex flex-row items-center gap-x-6 py-5 px-4 sm:px-6">
              {/* Column 1: File Extension with Status Ring */}
              <div className="relative flex-none">
                <div
                  className={`
                w-12 h-12 
                rounded-full
                flex items-center justify-center 
                bg-gray-50 dark:bg-gray-800/50
                ${getStatusRingColor(record.status)}
                ${record.status === 1 ? 'ring-0' : 'ring-4'}
              `}
                >
                  <span
                    className={`
                  font-mono font-medium uppercase
                  ${extensionStyle.text}
                  ${extension.length >= 4 ? 'text-[13px]' : 'text-[15px]'}
                  tracking-tight
                  transform -translate-y-[1px]
                `}
                  >
                    {extension}
                  </span>
                </div>
                {record.status === 1 && (
                  <CircularProgress
                    className="absolute top-0 left-0 scale-[1.2]"
                    aria-label="Loading..."
                    color="primary"
                    size="lg"
                    value={record.progress * 100}
                  />
                )}
              </div>

              {/* Column 2: File Information */}
              <div className="flex-auto min-w-0">
                <p className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 truncate">
                  {record.name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  <p>{formatFileSize(record.size)}</p>
                  <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                    <circle cx={1} cy={1} r={1} />
                  </svg>
                  <p>{formatDuration(record.duration)}</p>
                  <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                    <circle cx={1} cy={1} r={1} />
                  </svg>
                  <p>
                    {formatDistanceToNow(record.createdAt, {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </p>
                </div>
              </div>

              {/* Column 3: Action Icon */}
              <ChevronRightIcon
                className="h-5 w-5 flex-none text-gray-400"
                aria-hidden="true"
              />
            </CardBody>
          </Card>
        )
      })}
    </div>
  )
}

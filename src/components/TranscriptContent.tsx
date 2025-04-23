import { Card, CardBody, CardHeader } from '@heroui/react'
import { formatSecond } from '@/utils'
import { TranscriptRecord } from '@/types'

export default function TranscriptContent({
  time,
  transcript,
}: {
  time: number
  transcript: TranscriptRecord
}) {
  const activeIndex = transcript.content.findIndex(
    (segment) => time >= segment.start && time <= segment.end
  )

  return (
    <Card className="max-w-3xl mx-auto mb-24" shadow="sm">
      <CardHeader>
        <h1 className="flex-1 py-4 text-2xl text-center font-semibold">
          {transcript.name}
        </h1>
      </CardHeader>
      <CardBody className="p-6 pt-3">
        <div className="space-y-6">
          {transcript.content.map((segment, index) => (
            <div
              key={index}
              className={`transition-colors ${
                index === activeIndex
                  ? 'bg-gray-100 dark:bg-gray-800 rounded-md p-3 -mx-3'
                  : ''
              }`}
            >
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {formatSecond(segment.start)} - {formatSecond(segment.end)}
              </h3>
              <p className="text-sm leading-relaxed">{segment.text}</p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

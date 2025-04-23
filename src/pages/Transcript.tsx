import { useParams } from 'react-router-dom'
import TranscriptPlayer from '@/components/TranscriptPlayer'
import { useEffect, useState } from 'react'
import { loadTranscriptRecord } from '@/services'
import { TranscriptRecord } from '@/types'

export default function Transcript() {
  const { id } = useParams()
  const [transcript, setTranscript] = useState<TranscriptRecord | null>(null)
  useEffect(() => {
    if (id) {
      loadTranscriptRecord(id).then(setTranscript)
    }
  }, [id])
  if (!transcript) {
    return null
  }
  return (
    <div className="-mt-16 min-h-screen pt-24 ">
      <TranscriptPlayer transcript={transcript} />
    </div>
  )
}

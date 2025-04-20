import { WhisperSegement } from 'whisper.cpp'

/**
 * - 0: pending
 * - 1: processing
 * - 2: completed
 * - 3: error
 * - 4: cancelled
 */
export type TranscriptStatus = 0 | 1 | 2 | 3 | 4

export interface TranscriptRecord {
  id: string
  name: string
  format: string
  size: number
  length: number
  duration: number
  sampleRate: number
  numberOfChannels: number
  content: WhisperSegement[]
  status: TranscriptStatus
  createdAt: number
  updatedAt: number
}

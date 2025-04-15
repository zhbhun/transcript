import { WhisperSegement } from 'whisper.cpp'

/**
 * - 0: pending
 * - 1: processing
 * - 2: completed
 * - 3: error
 * - 4: cancelled
 */
export type TranscriptStatus = 0 | 1

export interface TranscriptRecord {
  id: string
  name: string
  content: WhisperSegement[]
  status: TranscriptStatus
  createdAt: number
  updatedAt: number
}

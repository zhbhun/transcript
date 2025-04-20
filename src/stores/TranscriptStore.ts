import { create } from 'zustand'
import { TranscriptRecord } from '../types'
import {
  createTranscriptRecord,
  loadTranscriptRecordList,
  processTranscriptRecord,
} from '../services'

export interface TranscriptStore {
  records: (TranscriptRecord & { progress: number })[]
  initiate: () => Promise<void>
  transcribe(file: File): Promise<TranscriptRecord>
}

export const useTranscriptStore = create<TranscriptStore>((set, get) => ({
  records: [],
  async initiate() {
    if (get().records.length > 0) {
      return
    }
    const records = await loadTranscriptRecordList()
    set({ records: records.map((item) => ({ ...item, progress: 0 })) })
    transcriptByQueue()
  },
  async transcribe(file: File) {
    const record = await createTranscriptRecord(file)
    set((prevState) => ({
      records: [{ ...record, progress: 0 }, ...prevState.records],
    }))
    transcriptByQueue()
    return record
  },
}))

function transcriptByQueue() {
  const records = useTranscriptStore.getState().records
  if (records.some((record) => record.status === 1)) {
    return
  }
  let target: TranscriptRecord | undefined
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].status === 0) {
      target = records[i]
      break
    }
  }
  if (!target) {
    return
  }
  useTranscriptStore.setState((prevState) => ({
    records: prevState.records.map((item) =>
      item.id === target.id ? { ...item, status: 1 } : item
    ),
  }))
  processTranscriptRecord(target, (progress) => {
    useTranscriptStore.setState((prevState) => ({
      records: prevState.records.map((item) =>
        item.id === target.id ? { ...item, progress } : item
      ),
    }))
  })
    .then((record) => {
      useTranscriptStore.setState((prevState) => ({
        records: prevState.records.map((item) =>
          item.id === target.id ? { ...item, ...record } : item
        ),
      }))
      transcriptByQueue()
    })
    .catch(() => {
      useTranscriptStore.setState((prevState) => ({
        records: prevState.records.map((item) =>
          item.id === target.id ? { ...item, status: 3 } : item
        ),
      }))
    })
}

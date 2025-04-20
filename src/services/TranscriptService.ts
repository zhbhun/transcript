import { TranscriptRecord } from '../types'
import { createAudioFile, decodeAudioFile, loadAudioFile } from './AudioService'
import { createRecordStore } from './DatabaseService'
import { transcribe } from './WhisperService'

export async function saveTranscriptRecord(
  record: TranscriptRecord
): Promise<void> {
  const store = await createRecordStore('readwrite')
  return new Promise((resolve, reject) => {
    const rq = store.put(record, record.id)
    rq.onsuccess = () => {
      resolve()
    }
    rq.onerror = (error) => {
      reject(error)
    }
  })
}

export async function createTranscriptRecord(
  file: File
): Promise<TranscriptRecord> {
  const { length, duration, sampleRate, numberOfChannels } =
    await decodeAudioFile(file)
  const id = await createAudioFile(file)
  const now = Date.now()
  const record: TranscriptRecord = {
    id,
    name: file.name,
    format: file.name.split('.').pop() || file.type.replace('audio/', ''),
    size: file.size,
    length,
    duration,
    sampleRate,
    numberOfChannels,
    content: [],
    status: 0,
    createdAt: now,
    updatedAt: now,
  }
  await saveTranscriptRecord(record)
  return record
}

export async function loadTranscriptRecord(
  id: string
): Promise<TranscriptRecord | null> {
  const store = await createRecordStore('readonly')
  return new Promise((resolve, reject) => {
    const rq = store.get(id)
    rq.onsuccess = () => {
      resolve(rq.result || null)
    }
    rq.onerror = (error) => {
      reject(error)
    }
  })
}

export async function loadTranscriptRecordList(): Promise<TranscriptRecord[]> {
  const store = await createRecordStore('readonly')
  return new Promise((resolve, reject) => {
    const rq = store.getAll()
    rq.onsuccess = () => {
      resolve(
        ((rq.result as TranscriptRecord[]) || []).sort(
          (a, b) => a.createdAt - b.createdAt
        )
      )
    }
    rq.onerror = (error) => {
      reject(error)
    }
  })
}

export async function processTranscriptRecord(
  record: TranscriptRecord,
  onProgress?: (progress: number) => void
): Promise<TranscriptRecord> {
  let result = record
  let interval: ReturnType<typeof setInterval> | null = null
  try {
    const file = await loadAudioFile(record.id)
    if (file) {
      result = {
        ...record,
        content: await transcribe(file, (progress) => {
          onProgress?.(progress / 2)
          if (progress >= 1 && !interval) {
            const begin = Date.now()
            interval = setInterval(() => {
              const progress = (Date.now() - begin) / (record.duration * 1000)
              onProgress?.(Math.min(0.5 + progress / 2, 1))
              if (progress >= 1) {
                clearInterval(interval!)
                interval = null
              }
            }, 1000)
          }
        }),
        status: 2,
      }
    } else {
      result = {
        ...record,
        status: 3,
      }
    }
  } catch (error) {
    console.log(error)
    result = {
      ...record,
      status: 3,
    }
    if (interval) {
      clearInterval(interval)
      interval = null
    }
  }
  await saveTranscriptRecord(result)
  return result
}

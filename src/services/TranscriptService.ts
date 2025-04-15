import { v4 as uuidv4 } from 'uuid'
import { TranscriptRecord } from '../types'

const dbName = 'transcript'
const dbVersion = 1
const audioStoreName = 'audios'
const recordStoreName = 'records'

export function createAudioFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(audioStoreName)) {
        db.createObjectStore(audioStoreName)
      }
      if (!db.objectStoreNames.contains(recordStoreName)) {
        db.createObjectStore(recordStoreName)
      }
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const transaction = db.transaction(audioStoreName, 'readwrite')
      const store = transaction.objectStore(audioStoreName)

      const id = uuidv4()
      const addRequest = store.put(file, id)
      addRequest.onsuccess = () => {
        resolve(id)
      }
      addRequest.onerror = (error) => {
        reject(error)
      }
    }

    request.onerror = (error) => {
      reject(error)
    }
  })
}

export function loadAudioFile(id: string): Promise<File | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(audioStoreName)) {
        db.createObjectStore(audioStoreName)
      }
      if (!db.objectStoreNames.contains(recordStoreName)) {
        db.createObjectStore(recordStoreName)
      }
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const transaction = db.transaction(audioStoreName, 'readonly')
      const store = transaction.objectStore(audioStoreName)
      const rq = store.get(id)
      rq.onsuccess = () => {
        resolve(rq.result || null)
      }
      rq.onerror = (error) => {
        reject(error)
      }
    }

    request.onerror = (error) => {
      reject(error)
    }
  })
}

export function saveTranscriptRecord(record: TranscriptRecord): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(audioStoreName)) {
        db.createObjectStore(audioStoreName)
      }
      if (!db.objectStoreNames.contains(recordStoreName)) {
        db.createObjectStore(recordStoreName)
      }
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const transaction = db.transaction(recordStoreName, 'readwrite')
      const store = transaction.objectStore(recordStoreName)

      const rq = store.put(record, record.id)
      rq.onsuccess = () => {
        resolve()
      }
      rq.onerror = (error) => {
        reject(error)
      }
    }

    request.onerror = (error) => {
      reject(error)
    }
  })
}

export function loadTranscriptRecord(
  id: string
): Promise<TranscriptRecord | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(audioStoreName)) {
        db.createObjectStore(audioStoreName)
      }
      if (!db.objectStoreNames.contains(recordStoreName)) {
        db.createObjectStore(recordStoreName)
      }
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const transaction = db.transaction(recordStoreName, 'readonly')
      const store = transaction.objectStore(recordStoreName)

      const rq = store.get(id)
      rq.onsuccess = () => {
        resolve(rq.result || null)
      }
      rq.onerror = (error) => {
        reject(error)
      }
    }

    request.onerror = (error) => {
      reject(error)
    }
  })
}

export async function transcribe(file: File): Promise<TranscriptRecord> {
  const id = await createAudioFile(file)
  const now = Date.now()
  const record: TranscriptRecord = {
    id,
    name: file.name,
    content: [],
    status: 0,
    createdAt: now,
    updatedAt: now,
  }
  await saveTranscriptRecord(record)
  return record
}

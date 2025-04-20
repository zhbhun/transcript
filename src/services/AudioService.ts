import { v4 as uuidv4 } from 'uuid'
import { createAudioStore } from './DatabaseService'
import { whisper } from './WhisperService'

export async function createAudioFile(file: File): Promise<string> {
  const store = await createAudioStore('readwrite')
  return new Promise((resolve, reject) => {
    const id = uuidv4()
    const addRequest = store.put(file, id)
    addRequest.onsuccess = () => {
      resolve(id)
    }
    addRequest.onerror = (error) => {
      reject(error)
    }
  })
}

export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  return whisper.decodeAudio(file)
}

export async function loadAudioFile(id: string): Promise<File | null> {
  const store = await createAudioStore('readonly')
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

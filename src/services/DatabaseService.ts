const dbName = 'transcript'
const dbVersion = 1

export const transcriptAudioStoreName = 'audios'
export const transcriptRecordStoreName = 'records'

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(transcriptAudioStoreName)) {
        db.createObjectStore(transcriptAudioStoreName)
      }
      if (!db.objectStoreNames.contains(transcriptRecordStoreName)) {
        db.createObjectStore(transcriptRecordStoreName)
      }
    }

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result)
    }

    request.onerror = (error) => {
      reject(error)
    }
  })
}

export async function createAudioTransaction(
  mode: IDBTransactionMode
): Promise<IDBTransaction> {
  const db = await openDatabase()
  return db.transaction(transcriptAudioStoreName, mode)
}

export async function createAudioStore(
  mode: IDBTransactionMode
): Promise<IDBObjectStore> {
  const transaction = await createAudioTransaction(mode)
  return transaction.objectStore(transcriptAudioStoreName)
}

export async function createRecordTransaction(
  mode: IDBTransactionMode
): Promise<IDBTransaction> {
  const db = await openDatabase()
  return db.transaction(transcriptRecordStoreName, mode)
}

export async function createRecordStore(
  mode: IDBTransactionMode
): Promise<IDBObjectStore> {
  const transaction = await createRecordTransaction(mode)
  return transaction.objectStore(transcriptRecordStoreName)
}

import Whisper, { WhisperSegement } from 'whisper.cpp'
import { splitAudioBuffer } from '@/utils'

export const whisper = Whisper()

export async function transcribe(
  file: File,
  onDownloadProgress?: (progress: number) => void
): Promise<WhisperSegement[]> {
  const audioBuffer = await whisper.decodeAudio(file)
  const audioBuffers = splitAudioBuffer(audioBuffer)
  await whisper.loadRemoteModel('small-q5_1', {
    url: '/ggml-small-q5_1.bin',
    onProgress: onDownloadProgress,
  })
  onDownloadProgress?.(1)
  const result: WhisperSegement[] = []
  let lastTime = 0
  for (let index = 0; index < audioBuffers.length; index++) {
    const audioSegments = await whisper.process(audioBuffers[index], {
      model: 'small-q5_1',
      language: 'auto',
      nthreads: Math.max(Math.floor((navigator.hardwareConcurrency ?? 4) / 4), 1),
    })
    audioSegments.forEach((segment) => {
      segment.start += lastTime
      segment.end += lastTime
    })
    result.push(...audioSegments)
    lastTime = result[result.length - 1]?.end ?? lastTime
  }
  return result
}

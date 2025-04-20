import Whisper, { WhisperSegement } from 'whisper.cpp'

export const whisper = Whisper()

export async function transcribe(
  file: File,
  onDownloadProgress?: (progress: number) => void
): Promise<WhisperSegement[]> {
  const { data: audio } = await whisper.loadAudio(file)
  await whisper.loadRemoteModel('small-q5_1', {
    url: '/ggml-small-q5_1.bin',
    onProgress: onDownloadProgress,
  })
  onDownloadProgress?.(1)
  const result = await whisper.process(audio, {
    model: 'small-q5_1',
    language: 'auto',
    nthreads: navigator.hardwareConcurrency ?? 4,
  })
  return result
}

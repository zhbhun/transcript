export type WhisperModel =
  | 'tiny'
  | 'tiny.en'
  | 'tiny-q5_1'
  | 'tiny-en-q5_1'
  | 'base'
  | 'base.en'
  | 'base-q5_1'
  | 'base-en-q5_1'
  | 'small.en'
  | 'small-q5_1'
  | 'small-en-q5_1'
  | 'medium-q5_0'
  | 'medium-en-q5_0'
  | 'large-q5_0'

export interface WhisperSegement {
  start: number
  end: number
  text: string
}

interface WhisperInstance {
  /**
   * Processes the audio data with the given parameters.
   * @param audio The audio data as a Float32Array.
   * @param language The language code for processing.
   * @param nthreads The number of threads to use.
   */
  process(
    audio: Float32Array,
    options?: {
      model?: string
      language?: string
      nthreads?: number
      translate?: boolean
    }
  ): Promise<WhisperSegement[]>

  /**
   * Clears the cache, deleting all stored models.
   */
  clearCache(): Promise<void>

  /**
   * Decode an audio file.
   * @param file The audio file.
   */
  decodeAudio(file: File): Promise<AudioBuffer>

  /**
   * Loads an audio file.
   * @param file The audio file.
   */
  loadAudio(file: File): Promise<{
    data: Float32Array
    length: number
    duration: number
    sampleRate: number
    numberOfChannels: number
  }>

  /**
   * Loads a local model file.
   * @param file The file object containing the model.
   * @param fname The name to store the model as.
   */

  loadLocalModel(file: File, fname?: string): void

  /**
   * Loads a remote model file.
   * @param name The name of the remote model.
   * @param cbProgress Callback for progress updates (0 to 1).
   * @param cbReady Callback when the model is ready.
   * @param cbCancel Callback when the operation is canceled.
   * @param cbPrint Callback for logging messages.
   */
  loadRemoteModel(
    name: WhisperModel,
    options?: {
      url?: string
      onProgress?: (progress: number) => void
    }
  ): Promise<void>
}

/**
 * Initializes the Whisper module.
 * @param params Configuration parameters for the module.
 * @returns An instance of the Whisper module.
 */
export default function whisper(): WhisperInstance

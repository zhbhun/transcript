interface WhisperInstance {
  /**
   * Processes the audio data with the given parameters.
   * @param audio The audio data as a Float32Array.
   * @param language The language code for processing.
   * @param nthreads The number of threads to use.
   */
  process(audio: Float32Array, language: string, nthreads: number): void

  /**
   * Clears the cache, deleting all stored models.
   */
  clearCache(): Promise<void>

  /**
   * Loads an audio file from an input event.
   * @param file The audio file.
   */
  loadAudio(file: File): Promise<Float32Array>

  /**
   * Loads a local model file.
   * @param file The file object containing the model.
   * @param fname The name to store the model as.
   */
  loadLocalModel(file: File, fname?: string): void

  /**
   * Loads a remote model file.
   * @param url The URL of the remote model.
   * @param dst The destination filename for the model.
   * @param size_mb The size of the model in megabytes.
   * @param cbProgress Callback for progress updates (0 to 1).
   * @param cbReady Callback when the model is ready.
   * @param cbCancel Callback when the operation is canceled.
   * @param cbPrint Callback for logging messages.
   */
  loadRemoteModel(
    url: string,
    dst: string,
    size_mb: number,
    cbProgress: (progress: number) => void,
    cbReady: (dst: string, data: Uint8Array) => void,
    cbCancel: () => void,
    cbPrint: (message: string) => void
  ): void
}

/**
 * Initializes the Whisper module.
 * @param params Configuration parameters for the module.
 * @returns An instance of the Whisper module.
 */
export default function whisper(): WhisperInstance

const dbName = 'whisper.cpp'
const dbVersion = 1
const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB

const AudioContext = window.AudioContext || window.webkitAudioContext
const OfflineAudioContext =
  window.OfflineAudioContext || window.webkitOfflineAudioContext
const kMaxAudio_s = 30 * 60
// const kMaxRecording_s = 2 * 60
const kSampleRate = 16000
const models = {
  tiny: 'https://whisper.ggerganov.com/ggml-model-whisper-tiny.bin',
  'tiny.en': 'https://whisper.ggerganov.com/ggml-model-whisper-tiny.en.bin',
  'tiny-q5_1': 'https://whisper.ggerganov.com/ggml-model-whisper-tiny-q5_1.bin',
  'tiny-en-q5_1':
    'https://whisper.ggerganov.com/ggml-model-whisper-tiny.en-q5_1.bin',
  base: 'https://whisper.ggerganov.com/ggml-model-whisper-base.bin',
  'base.en': 'https://whisper.ggerganov.com/ggml-model-whisper-base.en.bin',
  'base-q5_1': 'https://whisper.ggerganov.com/ggml-model-whisper-base-q5_1.bin',
  'base-en-q5_1':
    'https://whisper.ggerganov.com/ggml-model-whisper-base.en-q5_1.bin',
  small: 'https://whisper.ggerganov.com/ggml-model-whisper-small.bin',
  'small.en': 'https://whisper.ggerganov.com/ggml-model-whisper-small.en.bin',
  'small-q5_1':
    'https://whisper.ggerganov.com/ggml-model-whisper-small-q5_1.bin',
  'small-en-q5_1':
    'https://whisper.ggerganov.com/ggml-model-whisper-small.en-q5_1.bin',
  'medium-q5_0':
    'https://whisper.ggerganov.com/ggml-model-whisper-medium-q5_0.bin',
  'medium-en-q5_0':
    'https://whisper.ggerganov.com/ggml-model-whisper-medium.en-q5_0.bin',
  'large-q5_0':
    'https://whisper.ggerganov.com/ggml-model-whisper-large-q5_0.bin',
}
const modelSizes = {
  tiny: 75,
  'tiny.en': 75,
  'tiny-q5_1': 31,
  'tiny-en-q5_1': 31,
  base: 142,
  'base-q5_1': 57,
  'base-en-q5_1': 57,
  'base.en': 142,
  small: 466,
  'small.en': 466,
  'small-q5_1': 182,
  'small-en-q5_1': 182,
  'medium-q5_0': 515,
  'medium-en-q5_0': 515,
  'large-q5_0': 1030,
}

// fetch a remote file from remote URL using the Fetch API
async function fetchRemote(url, onProgress) {
  console.log('fetchRemote: downloading with fetch()...')

  const response = await fetch(url, {
    method: 'GET',
  })

  if (!response.ok) {
    console.log('fetchRemote: failed to fetch ' + url)
    return
  }

  const contentLength = response.headers.get('content-length')
  const total = parseInt(contentLength, 10)
  const reader = response.body.getReader()

  var chunks = []
  var receivedLength = 0
  var progressLast = -1

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    chunks.push(value)
    receivedLength += value.length

    if (contentLength) {
      onProgress?.(receivedLength / total)

      var progressCur = Math.round((receivedLength / total) * 10)
      if (progressCur != progressLast) {
        console.log('fetchRemote: fetching ' + 10 * progressCur + '% ...')
        progressLast = progressCur
      }
    }
  }

  var position = 0
  var chunksAll = new Uint8Array(receivedLength)

  for (var chunk of chunks) {
    chunksAll.set(chunk, position)
    position += chunk.length
  }

  return chunksAll
}

function parseTimeToSeconds(timeStr) {
  const match = timeStr.match(/(\d+):(\d+):(\d+)\.(\d+)/)
  if (!match) throw new Error('Invalid time format: ' + timeStr)

  const [, hh, mm, ss, ms] = match.map(Number)
  return hh * 3600 + mm * 60 + ss + ms / 1000
}

function parseSegment(line) {
  const regex =
    /^\[(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})\]\s*(.+)$/
  const match = line.match(regex)
  if (!match) return null

  const [, startStr, endStr, text] = match
  return {
    start: parseTimeToSeconds(startStr),
    end: parseTimeToSeconds(endStr),
    text: text.trim(),
  }
}

export default function Whisper() {
  const segments = []
  let onProcessed = null
  const Module = Object.assign(window.Module, {
    log: (...args) => {
      const message = args[0]
      if (message && /^\[\d\d:\d\d.+/.test(message)) {
        const segment = parseSegment(message)
        segments.push(segment)
      } else if (segments.length > 0) {
        onProcessed?.(segments)
      }
      console.log(...args)
    },
    setStatus: function (text) {
      console.log('js: ' + text)
    },
    monitorRunDependencies: function (left) {},
  })

  function storeFS(fname, buf) {
    // write to WASM file using FS_createDataFile
    // if the file exists, delete it
    try {
      Module.FS_unlink(fname)
    } catch (e) {
      // ignore
    }

    Module.FS_createDataFile('/', fname, buf, true, true)

    console.log('storeFS: stored model: ' + fname + ' size: ' + buf.length)
  }

  let instanceCode = null
  let instanceModel = null
  let audioContext = null

  function decodeAudio(file) {
    return new Promise((resolve, reject) => {
      if (!audioContext) {
        audioContext = new AudioContext({
          sampleRate: kSampleRate,
          channelCount: 1,
          echoCancellation: false,
          autoGainControl: true,
          noiseSuppression: true,
        })
      }

      console.log(
        'js: loading audio: ' + file.name + ', size: ' + file.size + ' bytes'
      )
      console.log('js: please wait ...')

      var reader = new FileReader()
      reader.onload = function (event) {
        var buf = new Uint8Array(reader.result)

        audioContext.decodeAudioData(
          buf.buffer,
          function (audioBuffer) {
            resolve(audioBuffer)
          },
          function (e) {
            console.log('js: error decoding audio: ' + e)
            reject(new Error('Error decoding audio: ' + e))
          }
        )
      }
      reader.readAsArrayBuffer(file)
    })
  }

  return {
    process(audio, options) {
      onProcessed = null
      return new Promise((resolve, reject) => {
        const model = options.model || 'local'
        const language = options.language
        const nthreads = options.nthreads || 8
        const translate = options.translate || false
        if (instanceCode == null || instanceModel != model) {
          if (instanceCode) {
            Module.free(instanceModel)
          }
          instanceCode = Module.init(`${model}.bin`)
          if (instanceCode) {
            console.log('js: whisper initialized, instance: ' + instanceCode)
            instanceModel = model
          }
        }
        if (!instanceCode) {
          console.error('js: failed to initialize whisper')
          reject(new Error('js: failed to initialize whisper'))
          return
        }
        if (!audio) {
          console.error('js: no audio data')
          reject(new Error('js: no audio data'))
          return
        }

        console.log('')
        console.log('js: processing - this might take a while ...')
        console.log('')
        setTimeout(() => {
          const ret = Module.full_default(
            instanceCode,
            audio,
            language,
            nthreads,
            translate
          )
          console.log('js: full_default returned: ' + ret)
          if (ret) {
            console.log('js: whisper returned: ' + ret)
            reject(new Error('js: whisper returned: ' + ret))
          } else {
            onProcessed = (segments) => {
              resolve(segments)
            }
          }
        }, 100)
      })
    },
    async clearCache() {
      indexedDB.deleteDatabase(dbName)
      location.reload()
    },
    decodeAudio,
    loadAudio(file) {
      return decodeAudio(file).then((audioBuffer) => {
        var offlineContext = new OfflineAudioContext(
          audioBuffer.numberOfChannels,
          audioBuffer.length,
          audioBuffer.sampleRate
        )
        var source = offlineContext.createBufferSource()
        source.buffer = audioBuffer
        source.connect(offlineContext.destination)
        source.start(0)

        return new Promise((resolve, reject) => {
          offlineContext
            .startRendering()
            .then(function (renderedBuffer) {
              let audio = renderedBuffer.getChannelData(0)
              console.log('js: audio loaded, size: ' + audio.length)

              // truncate to first 30 seconds
              if (audio.length > kMaxAudio_s * kSampleRate) {
                audio = audio.slice(0, kMaxAudio_s * kSampleRate)
                console.log(
                  'js: truncated audio to first ' + kMaxAudio_s + ' seconds'
                )
              }

              resolve({
                data: audio,
                length: audioBuffer.length,
                duration: audioBuffer.duration,
                sampleRate: audioBuffer.sampleRate,
                numberOfChannels: audioBuffer.numberOfChannels,
              })
            })
            .catch(reject)
        })
      })
    },
    loadLocalModel(file, name = 'local') {
      console.log(
        'loadFile: loading model: ' +
          file.name +
          ', size: ' +
          file.size +
          ' bytes'
      )
      console.log('loadFile: please wait ...')

      var reader = new FileReader()
      reader.onload = function (event) {
        var buf = new Uint8Array(reader.result)
        storeFS(`${name}.bin`, buf)
      }
      reader.readAsArrayBuffer(file)
    },
    // load remote data
    // - check if the data is already in the IndexedDB
    // - if not, fetch it from the remote URL and store it in the IndexedDB
    loadRemoteModel(name, options) {
      return new Promise((resolve, reject) => {
        const dst = name ? `${name}.bin` : 'local.bin'
        const url = options?.url || models[name]
        const size_mb = modelSizes[name] || 0
        if (!navigator.storage || !navigator.storage.estimate) {
          console.log(
            'loadRemoteModel: navigator.storage.estimate() is not supported'
          )
        } else {
          // query the storage quota and print it
          navigator.storage.estimate().then(function (estimate) {
            console.log(
              'loadRemoteModel: storage quota: ' + estimate.quota + ' bytes'
            )
            console.log(
              'loadRemoteModel: storage usage: ' + estimate.usage + ' bytes'
            )
          })
        }

        // check if the data is already in the IndexedDB
        const rq = indexedDB.open(dbName, dbVersion)

        rq.onupgradeneeded = function (event) {
          const db = event.target.result
          if (db.version == 1) {
            db.createObjectStore('models', { autoIncrement: false })
            console.log(
              'loadRemoteModel: created IndexedDB ' +
                db.name +
                ' version ' +
                db.version
            )
          } else {
            // clear the database
            const os = event.currentTarget.transaction.objectStore('models')
            os.clear()
            console.log(
              'loadRemoteModel: cleared IndexedDB ' +
                db.name +
                ' version ' +
                db.version
            )
          }
        }

        rq.onsuccess = function (event) {
          const db = event.target.result
          const tx = db.transaction(['models'], 'readonly')
          const os = tx.objectStore('models')
          const rq = os.get(dst)

          rq.onsuccess = function (event) {
            if (rq.result) {
              console.log(
                'loadRemoteModel: "' + dst + '" is already in the IndexedDB'
              )
              storeFS(dst, rq.result)
              resolve()
            } else {
              // data is not in the IndexedDB
              console.log(
                'loadRemoteModel: "' + dst + '" is not in the IndexedDB'
              )

              fetchRemote(url, q).then(function (data) {
                if (data) {
                  // store the data in the IndexedDB
                  const rq = indexedDB.open(dbName, dbVersion)
                  rq.onsuccess = function (event) {
                    var db = event.target.result
                    var tx = db.transaction(['models'], 'readwrite')
                    var os = tx.objectStore('models')

                    var rq = null
                    try {
                      var rq = os.put(data, dst)
                    } catch (e) {
                      console.log(
                        'loadRemoteModel: failed to store "' +
                          dst +
                          '" in the IndexedDB: \n' +
                          e
                      )
                      reject(
                        new Error(
                          'loadRemoteModel: failed to store "' +
                            dst +
                            '" in the IndexedDB: \n' +
                            e
                        )
                      )
                      return
                    }

                    rq.onsuccess = function (event) {
                      console.log(
                        'loadRemoteModel: "' + dst + '" stored in the IndexedDB'
                      )
                      storeFS(dst, data)
                      resolve()
                    }

                    rq.onerror = function (event) {
                      console.log(
                        'loadRemoteModel: failed to store "' +
                          dst +
                          '" in the IndexedDB'
                      )
                      reject(
                        new Error(
                          'loadRemoteModel: failed to store "' +
                            dst +
                            '" in the IndexedDB'
                        )
                      )
                    }
                  }
                }
              })
            }
          }

          rq.onerror = function (event) {
            console.error(
              'loadRemoteModel: failed to get data from the IndexedDB'
            )
            reject(
              new Error(
                'loadRemoteModel: failed to get data from the IndexedDB'
              )
            )
          }
        }

        rq.onerror = function (event) {
          console.error('loadRemoteModel: failed to open IndexedDB')
          reject(new Error('loadRemoteModel: failed to open IndexedDB'))
        }

        rq.onblocked = function (event) {
          console.error('loadRemoteModel: failed to open IndexedDB: blocked')
          reject(
            new Error('loadRemoteModel: failed to open IndexedDB: blocked')
          )
        }

        rq.onabort = function (event) {
          console.error('loadRemoteModel: failed to open IndexedDB: abort')
          reject('loadRemoteModel: failed to open IndexedDB: abort')
        }
      })
    },
  }
}

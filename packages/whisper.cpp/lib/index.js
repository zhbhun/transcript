const dbName = 'whisper.ggerganov.com'
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

// fetch a remote file from remote URL using the Fetch API
async function fetchRemote(url, cbProgress, cbPrint) {
  cbPrint('fetchRemote: downloading with fetch()...')

  const response = await fetch(url, {
    method: 'GET',
  })

  if (!response.ok) {
    cbPrint('fetchRemote: failed to fetch ' + url)
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
      cbProgress(receivedLength / total)

      var progressCur = Math.round((receivedLength / total) * 10)
      if (progressCur != progressLast) {
        cbPrint('fetchRemote: fetching ' + 10 * progressCur + '% ...')
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

export default function Whisper() {
  const Module = Object.assign(window.Module, {
    print: console.log,
    printErr: console.log,
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

  let instance = null
  let audioContext = null
  return {
    process(audio, language, nthreads) {
      if (instance == null) {
        instance = Module.init('whisper.bin')
        if (instance) {
          console.log('js: whisper initialized, instance: ' + instance)
        }
      }
      if (!instance) {
        console.error('js: failed to initialize whisper')
        return
      }
      if (!audio) {
        console.error('js: no audio data')
        return
      }

      console.log('')
      console.log('js: processing - this might take a while ...')
      console.log('')
      setTimeout(() => {
        var ret = Module.full_default(instance, audio, language, nthreads)
        console.log('js: full_default returned: ' + ret)
        if (ret) {
          printTextarea('js: whisper returned: ' + ret)
        }
      }, 100)
    },
    async clearCache() {
      if (
        confirm(
          'Are you sure you want to clear the cache?\nAll the models will be downloaded again.'
        )
      ) {
        indexedDB.deleteDatabase(dbName)
        location.reload()
      }
    },
    loadAudio(file) {
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
              var offlineContext = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
              )
              var source = offlineContext.createBufferSource()
              source.buffer = audioBuffer
              source.connect(offlineContext.destination)
              source.start(0)

              offlineContext.startRendering().then(function (renderedBuffer) {
                let audio = renderedBuffer.getChannelData(0)
                console.log('js: audio loaded, size: ' + audio.length)

                // truncate to first 30 seconds
                if (audio.length > kMaxAudio_s * kSampleRate) {
                  audio = audio.slice(0, kMaxAudio_s * kSampleRate)
                  console.log(
                    'js: truncated audio to first ' + kMaxAudio_s + ' seconds'
                  )
                }

                resolve(audio)
              })
            },
            function (e) {
              console.log('js: error decoding audio: ' + e)
              reject(new Error('Error decoding audio: ' + e))
            }
          )
        }
        reader.readAsArrayBuffer(file)
      })
    },
    loadLocalModel(file, fname = 'whisper.bin') {
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
        storeFS(fname, buf)
      }
      reader.readAsArrayBuffer(file)
    },
    // load remote data
    // - check if the data is already in the IndexedDB
    // - if not, fetch it from the remote URL and store it in the IndexedDB
    loadRemoteModel(url, dst, size_mb, cbProgress, cbReady, cbCancel, cbPrint) {
      if (!navigator.storage || !navigator.storage.estimate) {
        cbPrint('loadRemote: navigator.storage.estimate() is not supported')
      } else {
        // query the storage quota and print it
        navigator.storage.estimate().then(function (estimate) {
          cbPrint('loadRemote: storage quota: ' + estimate.quota + ' bytes')
          cbPrint('loadRemote: storage usage: ' + estimate.usage + ' bytes')
        })
      }

      // check if the data is already in the IndexedDB
      var rq = indexedDB.open(dbName, dbVersion)

      rq.onupgradeneeded = function (event) {
        var db = event.target.result
        if (db.version == 1) {
          var os = db.createObjectStore('models', { autoIncrement: false })
          cbPrint(
            'loadRemote: created IndexedDB ' +
              db.name +
              ' version ' +
              db.version
          )
        } else {
          // clear the database
          var os = event.currentTarget.transaction.objectStore('models')
          os.clear()
          cbPrint(
            'loadRemote: cleared IndexedDB ' +
              db.name +
              ' version ' +
              db.version
          )
        }
      }

      rq.onsuccess = function (event) {
        var db = event.target.result
        var tx = db.transaction(['models'], 'readonly')
        var os = tx.objectStore('models')
        var rq = os.get(url)

        rq.onsuccess = function (event) {
          if (rq.result) {
            cbPrint('loadRemote: "' + url + '" is already in the IndexedDB')
            cbReady(dst, rq.result)
          } else {
            // data is not in the IndexedDB
            cbPrint('loadRemote: "' + url + '" is not in the IndexedDB')

            // alert and ask the user to confirm
            if (
              !confirm(
                'You are about to download ' +
                  size_mb +
                  ' MB of data.\n' +
                  'The model data will be cached in the browser for future use.\n\n' +
                  'Press OK to continue.'
              )
            ) {
              cbCancel()
              return
            }

            fetchRemote(url, cbProgress, cbPrint).then(function (data) {
              if (data) {
                // store the data in the IndexedDB
                var rq = indexedDB.open(dbName, dbVersion)
                rq.onsuccess = function (event) {
                  var db = event.target.result
                  var tx = db.transaction(['models'], 'readwrite')
                  var os = tx.objectStore('models')

                  var rq = null
                  try {
                    var rq = os.put(data, url)
                  } catch (e) {
                    cbPrint(
                      'loadRemote: failed to store "' +
                        url +
                        '" in the IndexedDB: \n' +
                        e
                    )
                    cbCancel()
                    return
                  }

                  rq.onsuccess = function (event) {
                    cbPrint('loadRemote: "' + url + '" stored in the IndexedDB')
                    cbReady(dst, data)
                  }

                  rq.onerror = function (event) {
                    cbPrint(
                      'loadRemote: failed to store "' +
                        url +
                        '" in the IndexedDB'
                    )
                    cbCancel()
                  }
                }
              }
            })
          }
        }

        rq.onerror = function (event) {
          cbPrint('loadRemote: failed to get data from the IndexedDB')
          cbCancel()
        }
      }

      rq.onerror = function (event) {
        cbPrint('loadRemote: failed to open IndexedDB')
        cbCancel()
      }

      rq.onblocked = function (event) {
        cbPrint('loadRemote: failed to open IndexedDB: blocked')
        cbCancel()
      }

      rq.onabort = function (event) {
        cbPrint('loadRemote: failed to open IndexedDB: abort')
        cbCancel()
      }
    },
  }
}

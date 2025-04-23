import { useState, useRef, useEffect } from 'react'
import { Slider } from '@heroui/react'
import PauseCircleIcon from '@heroicons/react/24/solid/PauseCircleIcon'
import PlayCircleIcon from '@heroicons/react/24/solid/PlayCircleIcon'
import SpeakerWaveIcon from '@heroicons/react/24/solid/SpeakerWaveIcon'
import SpeakerXMarkIcon from '@heroicons/react/24/solid/SpeakerXMarkIcon'
import { TranscriptRecord } from '@/types'
import { formatDate, formatSecond, formatFileSize } from '@/utils'
import TranscriptContent from './TranscriptContent'
import { loadAudioFile } from '@/services/AudioService'

export default function AudioPlayer({
  transcript,
}: {
  transcript: TranscriptRecord
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressInterval = useRef<ReturnType<typeof setTimeout>>(null)

  // Initialize audio element
  useEffect(() => {
    loadAudioFile(transcript.id).then((file) => {
      if (file) {
        const url = URL.createObjectURL(file)
        audioRef.current = new Audio(url)
        audioRef.current.volume = volume / 100
        audioRef.current.addEventListener('ended', () => {
          setIsPlaying(false)
          setCurrentTime(0)
          if (progressInterval.current) {
            clearInterval(progressInterval.current)
            progressInterval.current = null
          }
        })
      }
    })

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [transcript])

  // Handle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
        progressInterval.current = null
      }
    } else {
      audioRef.current.play()
      progressInterval.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime)
        }
      }, 16)
    }

    setIsPlaying(!isPlaying)
  }

  // Handle volume change
  const handleVolumeChange = (value: number | number[]) => {
    const newVolume = Array.isArray(value) ? value[0] : value
    setVolume(newVolume)

    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100
    }

    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  // Handle progress bar change
  const handleProgressChange = (value: number | number[]) => {
    const newTime = Array.isArray(value) ? value[0] : value
    setCurrentTime(newTime)

    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  // Toggle mute
  const toggleMute = () => {
    if (!audioRef.current) return

    if (isMuted) {
      audioRef.current.volume = volume / 100
    } else {
      audioRef.current.volume = 0
    }

    setIsMuted(!isMuted)
  }

  // Get volume icon based on volume level
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <SpeakerXMarkIcon className="h-5 w-5" />
    } else if (volume < 50) {
      return <SpeakerWaveIcon className="h-5 w-5" />
    } else {
      return <SpeakerWaveIcon className="h-5 w-5" />
    }
  }

  return (
    <>
      <TranscriptContent time={currentTime} transcript={transcript} />
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center py-3 px-4 gap-4">
          {/* Left Section - Audio Details */}
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-500 dark:text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{transcript.name}</p>
              <div className="flex flex-wrap text-xs text-gray-500 dark:text-gray-400">
                <span className="mr-2">{formatFileSize(transcript.size)}</span>
                <span className="mr-2">•</span>
                <span className="mr-2">
                  {formatSecond(transcript.duration)}
                </span>
                <span className="mr-2">•</span>
                <span>{formatDate(new Date(transcript.createdAt))}</span>
              </div>
            </div>
          </div>

          {/* Center Section - Playback Controls */}
          <div className="flex flex-col items-center space-y-2">
            <button
              onClick={togglePlayPause}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <PauseCircleIcon className="h-5 w-5" />
              ) : (
                <PlayCircleIcon className="h-5 w-5" />
              )}
            </button>
            <div className="w-full flex items-center space-x-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                {formatSecond(currentTime)}
              </span>
              <Slider
                value={currentTime}
                minValue={0}
                maxValue={transcript.duration}
                step={0.01}
                onChange={handleProgressChange}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 w-10">
                {formatSecond(transcript.duration)}
              </span>
            </div>
          </div>

          {/* Right Section - Volume Control */}
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {getVolumeIcon()}
            </button>
            <Slider
              className="w-32"
              value={isMuted ? 0 : volume}
              minValue={0}
              maxValue={100}
              step={1}
              onChange={handleVolumeChange}
            />
          </div>
        </div>
      </div>
    </>
  )
}

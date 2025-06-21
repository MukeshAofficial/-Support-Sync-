"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mic, MicOff, Volume2, Languages } from "lucide-react"
import { MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface TranscriptionResult {
  text: string
  originalText?: string
  timestamp: string
  id: string
  language: string
}

const SUPPORTED_LANGUAGES = [
  { code: "hi-IN", name: "Hindi" },
  { code: "bn-IN", name: "Bengali" },
  { code: "kn-IN", name: "Kannada" },
  { code: "ml-IN", name: "Malayalam" },
  { code: "mr-IN", name: "Marathi" },
  { code: "od-IN", name: "Odia" },
  { code: "pa-IN", name: "Punjabi" },
  { code: "ta-IN", name: "Tamil" },
  { code: "te-IN", name: "Telugu" },
  { code: "gu-IN", name: "Gujarati" },
  { code: "en-IN", name: "English" },
]

export default function RealtimeTranscription() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcriptions, setTranscriptions] = useState<TranscriptionResult[]>([])
  const [currentTranscription, setCurrentTranscription] = useState("")
  const [currentOriginal, setCurrentOriginal] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("hi-IN")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Convert audio to WAV format that Sarvam accepts
  const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const arrayBuffer = await audioBlob.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // Resample to 16kHz mono for Sarvam
      const targetSampleRate = 16000
      const numberOfChannels = 1
      const length = Math.round((audioBuffer.length * targetSampleRate) / audioBuffer.sampleRate)

      const offlineContext = new OfflineAudioContext(numberOfChannels, length, targetSampleRate)
      const bufferSource = offlineContext.createBufferSource()
      bufferSource.buffer = audioBuffer
      bufferSource.connect(offlineContext.destination)
      bufferSource.start(0)

      const resampledBuffer = await offlineContext.startRendering()

      // Convert to WAV
      const wavArrayBuffer = audioBufferToWav(resampledBuffer)
      return new Blob([wavArrayBuffer], { type: "audio/wav" })
    } catch (error) {
      console.error("Audio conversion error:", error)
      return audioBlob
    }
  }

  // Convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length
    const arrayBuffer = new ArrayBuffer(44 + length * 2)
    const view = new DataView(arrayBuffer)

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, "RIFF")
    view.setUint32(4, 36 + length * 2, true)
    writeString(8, "WAVE")
    writeString(12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true) // PCM
    view.setUint16(22, 1, true) // Mono
    view.setUint32(24, buffer.sampleRate, true)
    view.setUint32(28, buffer.sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, "data")
    view.setUint32(40, length * 2, true)

    // Convert samples to 16-bit PCM
    const channelData = buffer.getChannelData(0)
    let offset = 44
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]))
      view.setInt16(offset, sample * 0x7fff, true)
      offset += 2
    }

    return arrayBuffer
  }

  const startRecording = async () => {
    try {
      setError("")
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      streamRef.current = stream

      let mimeType = "audio/webm;codecs=opus"
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm"
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/mp4"
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
          await transcribeAudio(audioBlob)
          audioChunksRef.current = []
        }
      }

      setIsRecording(true)
      mediaRecorder.start()

      // Record and transcribe every 5 seconds
      intervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop()
          setTimeout(() => {
            if (mediaRecorderRef.current && isRecording) {
              audioChunksRef.current = []
              mediaRecorderRef.current.start()
            }
          }, 100)
        }
      }, 5000)
    } catch (err) {
      setError("Failed to access microphone. Please check permissions.")
      console.error("Error accessing microphone:", err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    setIsRecording(false)
    setCurrentTranscription("")
    setCurrentOriginal("")
  }

  // Send transcript to backend RAG and play TTS response
  const sendToRagAndPlay = async (transcript: string) => {
    setIsProcessing(true)
    setError("")
    try {
      const response = await fetch("http://localhost:5000/api/voice-ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: transcript,
          target_language_code: selectedLanguage,
          tts_model: "bulbul:v2",
          tts_speaker: "anushka"
        })
      })
      if (!response.ok) throw new Error("RAG/TTS backend error")
      // Play the audio response
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audio.play()
    } catch (err) {
      setError("Failed to get or play answer audio.")
    } finally {
      setIsProcessing(false)
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true)
      setCurrentTranscription("Processing...")
      setCurrentOriginal("")

      console.log("Converting audio to WAV...")
      const wavBlob = await convertToWav(audioBlob)
      console.log("Audio converted, size:", wavBlob.size)

      const formData = new FormData()
      formData.append("audio", wavBlob, "audio.wav")
      formData.append("language", selectedLanguage)

      console.log("Sending to translation API...")
      const response = await fetch("/api/translate", {
        method: "POST",
        body: formData,
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", response.headers.get("content-type"))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error response:", errorText)
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log("API response:", result)

      if (result.translatedText && result.translatedText.trim()) {
        const newTranscription: TranscriptionResult = {
          text: result.translatedText,
          originalText: result.originalText,
          timestamp: new Date().toLocaleTimeString(),
          id: Date.now().toString(),
          language: selectedLanguage,
        }

        setTranscriptions((prev) => [newTranscription, ...prev].slice(0, 10))
        setCurrentTranscription(result.translatedText)
        setCurrentOriginal(result.originalText || "")
        // Send transcript to backend RAG and play TTS
        await sendToRagAndPlay(result.translatedText)
      } else {
        setCurrentTranscription("No speech detected")
        setCurrentOriginal("")
      }
    } catch (err) {
      const errorMessage = (err as Error).message
      setError(`Translation failed: ${errorMessage}`)
      setCurrentTranscription("")
      setCurrentOriginal("")
    } finally {
      setIsProcessing(false)
    }
  }

  const clearTranscriptions = () => {
    setTranscriptions([])
    setCurrentTranscription("")
    setCurrentOriginal("")
    setError("")
  }

  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [])

  const selectedLanguageName = SUPPORTED_LANGUAGES.find((lang) => lang.code === selectedLanguage)?.name || "Unknown"

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-20 bg-gray-900 text-white flex flex-col items-center py-8 space-y-8 min-h-screen">
        <button
          className="flex flex-col items-center focus:outline-none hover:text-blue-400"
          title="Text Bot"
          onClick={() => router.push('/bot')}
        >
          <MessageCircle className="w-7 h-7 mb-1" />
          <span className="text-xs">Text</span>
        </button>
        <button
          className="flex flex-col items-center focus:outline-none hover:text-blue-400"
          title="Voice Bot"
          onClick={() => router.push('/voice')}
        >
          <Mic className="w-7 h-7 mb-1" />
          <span className="text-xs">Voice</span>
        </button>
      </aside>
      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">Voice Bot</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={isRecording}>
                <SelectTrigger className="w-24 text-xs border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      {language.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Control Panel */}
          <Card className="p-8 border border-gray-200 bg-gray-50">
            <div className="flex flex-col items-center space-y-6">
              {/* Microphone Button */}
              <div className="relative">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  size="lg"
                  className={`w-24 h-24 rounded-full transition-all duration-300 ${
                    isRecording ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-black hover:bg-gray-800"
                  }`}
                  disabled={isProcessing}
                >
                  {isRecording ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
                </Button>

                {isRecording && (
                  <div className="absolute -inset-2 border-2 border-red-400 rounded-full animate-ping"></div>
                )}
              </div>

              {/* Status */}
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">
                  {isRecording ? `Listening in ${selectedLanguageName}...` : "Click to start"}
                </p>
                {isProcessing && <p className="text-sm text-gray-600 mt-1">Translating with Sarvam AI...</p>}
              </div>

              {/* Current Translation */}
              {currentTranscription && (
                <div className="w-full space-y-3">
                  {/* Original Text */}
                  {currentOriginal && (
                    <Card className="w-full p-4 bg-blue-50 border border-blue-200">
                      <div className="flex items-start space-x-3">
                        <div className="text-xs text-blue-600 font-medium mt-1">ORIGINAL ({selectedLanguageName})</div>
                      </div>
                      <p className="text-blue-900 font-medium mt-1">{currentOriginal}</p>
                    </Card>
                  )}

                  {/* English Translation */}
                  <Card className="w-full p-4 bg-white border border-gray-200">
                    <div className="flex items-start space-x-3">
                      <Volume2 className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 font-medium">ENGLISH TRANSLATION</div>
                        <p className="text-gray-900 font-medium mt-1">{currentTranscription}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <Card className="w-full p-4 bg-red-50 border border-red-200">
                  <p className="text-red-800">{error}</p>
                </Card>
              )}

              {/* Controls */}
              <div className="flex space-x-4">
                <Button
                  onClick={clearTranscriptions}
                  variant="outline"
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={transcriptions.length === 0}
                >
                  Clear History
                </Button>
              </div>
            </div>
          </Card>

          {/* Translation History */}
          {transcriptions.length > 0 && (
            <Card className="p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Translations</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {transcriptions.map((transcription) => (
                  <div key={transcription.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm text-gray-500">{transcription.timestamp}</span>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        {SUPPORTED_LANGUAGES.find((lang) => lang.code === transcription.language)?.name} → English
                      </span>
                    </div>
                    {transcription.originalText && (
                      <div className="mb-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                        <div className="text-xs text-blue-600 font-medium mb-1">Original</div>
                        <p className="text-blue-900 text-sm">{transcription.originalText}</p>
                      </div>
                    )}
                    <div className="p-2 bg-white rounded border-l-4 border-green-400">
                      <div className="text-xs text-green-600 font-medium mb-1">English Translation</div>
                      <p className="text-gray-900">{transcription.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* How to Use Voice Support */}
          <Card className="p-8 border border-gray-200 bg-gray-50">
            <h3 className="text-xl font-semibold text-gray-900 mb-8 text-center">How to Use Voice Support</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Speak Clearly */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                  <Mic className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Speak Clearly</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Click the microphone button and speak your question clearly in your preferred language
                </p>
              </div>

              {/* Listen to Response */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                  <Volume2 className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Listen to Response</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Our AI will process your question and respond with a natural voice in your language
                </p>
              </div>

              {/* Multilingual Support */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                  <Languages className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Multilingual Support</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Switch between 50+ languages for seamless communication in your native language
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

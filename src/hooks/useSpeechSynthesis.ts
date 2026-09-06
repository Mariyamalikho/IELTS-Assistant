import { useCallback, useRef } from 'react'

export function useSpeechSynthesis() {
  const isSpeakingRef = useRef(false)

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    const cleanText = text.replace(/[*_#]/g, '').trim()
    if (!cleanText) return

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 0.9 // slightly slower for better comprehension
    utterance.pitch = 1.0
    
    // Try to find a good English voice
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(v => v.lang === 'en-GB' || v.lang === 'en-US')
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => { isSpeakingRef.current = true }
    utterance.onend = () => { isSpeakingRef.current = false }
    utterance.onerror = () => { isSpeakingRef.current = false }

    window.speechSynthesis.speak(utterance)
  }, [])

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      isSpeakingRef.current = false
    }
  }, [])

  return { speak, stop, isSpeaking: () => isSpeakingRef.current }
}

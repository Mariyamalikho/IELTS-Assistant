import { useState, useEffect } from 'react'
import { STORAGE_KEYS } from '@/lib/constants'

export function useApiUsage() {
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    const updateStreak = () => {
      const today = new Date().toISOString().split('T')[0]
      const lastUsageDate = localStorage.getItem(STORAGE_KEYS.USAGE_DATE)
      let currentStreak = parseInt(localStorage.getItem(STORAGE_KEYS.STREAK) || '0', 10)

      if (lastUsageDate && lastUsageDate !== today) {
        const lastDate = new Date(lastUsageDate)
        const currentDate = new Date(today)
        const diffTime = currentDate.getTime() - lastDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) 
        
        // Break streak if missed a day
        if (diffDays > 1) {
          currentStreak = 0
          localStorage.setItem(STORAGE_KEYS.STREAK, '0')
        }
      }
      
      setStreak(currentStreak)
    }

    // Initial check
    updateStreak()
    
    // Listen for custom event
    window.addEventListener('api_usage_updated', updateStreak)
    return () => window.removeEventListener('api_usage_updated', updateStreak)
  }, [])

  return { streak }
}

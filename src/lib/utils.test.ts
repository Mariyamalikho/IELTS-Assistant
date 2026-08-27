import { describe, it, expect } from 'vitest'
import { formatTime, cn } from './utils'

describe('utils', () => {
  describe('formatTime', () => {
    it('formats seconds correctly', () => {
      expect(formatTime(0)).toBe('00:00')
      expect(formatTime(59)).toBe('00:59')
      expect(formatTime(60)).toBe('01:00')
      expect(formatTime(3600)).toBe('60:00')
    })
  })

  describe('cn', () => {
    it('merges tailwind classes properly', () => {
      expect(cn('p-4', 'p-8')).toBe('p-8')
      expect(cn('bg-red-500', undefined, null, 'text-white')).toBe('bg-red-500 text-white')
    })
  })
})

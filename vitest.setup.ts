import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock analytics to avoid side effects
vi.mock('./src/core/analytics', () => ({
  trackVisit: () => { console.log('mock trackVisit') },
  trackCommand: () => { console.log('mock trackCommand') },
  trackUnknownCommand: () => { console.log('mock trackUnknownCommand') },
}))

// Tokenizer Tests
import { describe, it, expect } from 'vitest'
import { tokenize, hasTrailingSpace } from '../core/tokenize'

describe('tokenize', () => {
  it('should handle empty string', () => {
    expect(tokenize('')).toEqual([])
  })

  it('should handle null/undefined', () => {
    expect(tokenize(null as any)).toEqual([])
    expect(tokenize(undefined as any)).toEqual([])
  })

  it('should split simple command', () => {
    expect(tokenize('hello world')).toEqual(['hello', 'world'])
  })

  it('should handle double quotes', () => {
    expect(tokenize('echo "hello world"')).toEqual(['echo', 'hello world'])
  })

  it('should handle single quotes', () => {
    expect(tokenize("echo 'hello world'")).toEqual(['echo', 'hello world'])
  })

  it('should handle mixed quotes', () => {
    expect(tokenize('cmd "arg one" \'arg two\' arg3')).toEqual([
      'cmd',
      'arg one',
      'arg two',
      'arg3',
    ])
  })

  it('should handle multiple spaces', () => {
    expect(tokenize('cmd    arg1     arg2')).toEqual(['cmd', 'arg1', 'arg2'])
  })

  it('should handle quotes with spaces', () => {
    expect(tokenize('run demo "json grep"')).toEqual(['run', 'demo', 'json grep'])
  })
})

describe('hasTrailingSpace', () => {
  it('should detect trailing space', () => {
    expect(hasTrailingSpace('hello ')).toBe(true)
    expect(hasTrailingSpace('hello world ')).toBe(true)
  })

  it('should return false for no trailing space', () => {
    expect(hasTrailingSpace('hello')).toBe(false)
    expect(hasTrailingSpace('hello world')).toBe(false)
  })

  it('should handle empty string', () => {
    expect(hasTrailingSpace('')).toBe(false)
  })
})

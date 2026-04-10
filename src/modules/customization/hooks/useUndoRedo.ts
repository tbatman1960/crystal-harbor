import { useState, useCallback, useRef } from 'react'

interface UndoRedoState<T> {
  current: T
  canUndo: boolean
  canRedo: boolean
  set: (value: T) => void
  undo: () => void
  redo: () => void
  reset: (value: T) => void
}

export function useUndoRedo<T>(initialValue: T, maxHistory = 50): UndoRedoState<T> {
  const [current, setCurrent] = useState<T>(initialValue)
  const pastRef = useRef<T[]>([])
  const futureRef = useRef<T[]>([])

  const set = useCallback((value: T) => {
    setCurrent(prev => {
      pastRef.current = [...pastRef.current.slice(-(maxHistory - 1)), prev]
      futureRef.current = []
      return value
    })
  }, [maxHistory])

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return
    setCurrent(prev => {
      const previous = pastRef.current[pastRef.current.length - 1]
      pastRef.current = pastRef.current.slice(0, -1)
      futureRef.current = [...futureRef.current, prev]
      return previous
    })
  }, [])

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return
    setCurrent(prev => {
      const next = futureRef.current[futureRef.current.length - 1]
      futureRef.current = futureRef.current.slice(0, -1)
      pastRef.current = [...pastRef.current, prev]
      return next
    })
  }, [])

  const reset = useCallback((value: T) => {
    pastRef.current = []
    futureRef.current = []
    setCurrent(value)
  }, [])

  return {
    current,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    set,
    undo,
    redo,
    reset,
  }
}

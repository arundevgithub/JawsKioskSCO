import { useCallback, useRef, useState } from 'react'

// Drives two visually-hidden aria-live regions (polite + assertive).
// Clearing the message before re-setting it guarantees screen readers
// (including JAWS) re-announce text even when the same phrase repeats.
export function useAnnouncer() {
  const [politeMessage, setPoliteMessage] = useState('')
  const [assertiveMessage, setAssertiveMessage] = useState('')
  const politeTimer = useRef(null)
  const assertiveTimer = useRef(null)

  const announce = useCallback((message) => {
    clearTimeout(politeTimer.current)
    setPoliteMessage('')
    politeTimer.current = setTimeout(() => setPoliteMessage(message), 60)
  }, [])

  const announceAssertive = useCallback((message) => {
    clearTimeout(assertiveTimer.current)
    setAssertiveMessage('')
    assertiveTimer.current = setTimeout(() => setAssertiveMessage(message), 60)
  }, [])

  return { politeMessage, assertiveMessage, announce, announceAssertive }
}

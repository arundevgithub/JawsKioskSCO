import { useEffect, useRef } from 'react'

// Focuses the screen's h1 whenever the screen mounts, so a screen reader's
// focus (and JAWS virtual cursor) moves to the new screen and announces its
// title automatically, matching how real self-checkout kiosks change context.
export default function ScreenHeading({ children }) {
  const ref = useRef(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  return (
    <h1 ref={ref} tabIndex={-1} className="screen-heading">
      {children}
    </h1>
  )
}

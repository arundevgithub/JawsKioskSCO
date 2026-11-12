import { useEffect, useRef, useState } from 'react'
import Numpad from './Numpad'
import { lookupLoyaltyAccount } from '../api/mockApi'

// Loyalty lookup shown as a modal dialog over the cart. App makes everything
// behind it inert while it is open, which takes the page out of the
// accessibility tree, so the JAWS virtual cursor, its element lists and Tab
// all stay inside the dialog. The live regions sit outside the inert parts,
// so announcements keep working.
export default function LoyaltyDialog({ onFound, onSkip, announce, announceAssertive }) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const headingRef = useRef(null)
  // Taken while rendering, before focus moves into the dialog.
  const [opener] = useState(() => document.activeElement)

  const digitsEntered = phoneNumber.replace(/\D/g, '').length
  const isComplete = digitsEntered === 10

  useEffect(() => {
    headingRef.current?.focus()
    return () => {
      // The page is no longer inert by now. Go back to whatever opened the
      // dialog; if that's gone (Start Checkout, or the cart's loyalty button
      // once an account is found), go to the screen heading instead.
      if (opener?.isConnected && opener !== document.body) opener.focus()
      else document.querySelector('.screen-heading')?.focus()
    }
  }, [opener])

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSearching) return
    if (!isComplete) {
      announce(`Enter all 10 digits first. ${digitsEntered} of 10 digits entered.`)
      return
    }

    setIsSearching(true)
    setError('')
    announce('Searching for your loyalty account, please wait.')

    try {
      const result = await lookupLoyaltyAccount(phoneNumber)
      setIsSearching(false)
      onFound(result, phoneNumber)
    } catch {
      setIsSearching(false)
      setError('We could not find that account. Please try again.')
      announceAssertive('Account lookup failed. Please re-enter your phone number.')
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape' && !isSearching) onSkip()
  }

  return (
    <div className="modal-backdrop">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="loyalty-heading"
        className="modal"
        onKeyDown={handleKeyDown}
      >
        <h2 ref={headingRef} id="loyalty-heading" tabIndex={-1} className="screen-heading">
          Find Your Loyalty Account
        </h2>
        {/* Two columns so the dialog fits without scrolling: the number pad
            sits on the right, everything else on the left. DOM order (and so
            JAWS reading and Tab order) is unchanged. */}
        <form className="phone-entry" onSubmit={handleSubmit} noValidate>
          <p className="screen-intro phone-entry__intro">
            Enter your 10-digit phone number using the number pad, then choose
            Find My Account, or choose Skip to continue without it.
          </p>

          <div className="field-group">
            {/* A kiosk has no keyboard, so the number is a read-only display
                filled only by the on-screen number pad. It is plain text rather
                than an <input> so JAWS doesn't land on an edit field that
                suggests typing and can't be typed into. */}
            <p className="field-label">Phone number</p>
            <p className="phone-display">
              {phoneNumber ? (
                formatPhone(phoneNumber)
              ) : (
                <span className="phone-display-empty">Not entered</span>
              )}
            </p>
            <p id="phone-hint" className="field-hint">
              {digitsEntered} of 10 digits entered.
            </p>
          </div>

          <Numpad
            value={phoneNumber}
            onChange={(digits) => {
              setPhoneNumber(digits)
              setError('')
            }}
            announce={announce}
            disabled={isSearching}
          />

          {error ? (
            <p className="error-text" role="alert">
              {error}
            </p>
          ) : null}

          <div className="button-row">
            {/* aria-disabled keeps the button focusable so JAWS users can find it
                before all 10 digits are in, and focus is not lost while searching. */}
            <button type="submit" className="primary-button" aria-disabled={!isComplete || isSearching}>
              {isSearching ? 'Searching…' : 'Find My Account'}
            </button>
            <button type="button" className="secondary-button" onClick={onSkip} disabled={isSearching}>
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function formatPhone(digits) {
  if (digits.length === 0) return ''
  if (digits.length < 4) return digits
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

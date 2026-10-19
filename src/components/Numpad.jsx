const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace']

// Keys are never `disabled` based on the current value: disabling the focused
// button drops focus to <body>, which throws JAWS back to the top of the page.
// Unavailable keys use aria-disabled instead so they stay in the tab order.
// Each press is confirmed through the live region because JAWS does not
// re-speak a button after it is activated.
export default function Numpad({ value, onChange, announce, maxLength = 10, disabled = false }) {
  const isFull = value.length >= maxLength
  const isEmpty = value.length === 0

  function progress(length) {
    return `${length} of ${maxLength} digits entered.`
  }

  function pressDigit(digit) {
    if (isFull) {
      announce(`Phone number is complete. ${progress(value.length)}`)
      return
    }
    const next = value + digit
    onChange(next)
    announce(
      next.length === maxLength
        ? `${digit}. ${progress(next.length)} Choose Find My Account to continue.`
        : `${digit}. ${progress(next.length)}`
    )
  }

  function pressBackspace() {
    if (isEmpty) {
      announce('No digits to delete.')
      return
    }
    const next = value.slice(0, -1)
    onChange(next)
    announce(`Deleted ${value.slice(-1)}. ${progress(next.length)}`)
  }

  function pressClear() {
    onChange('')
    announce(`Phone number cleared. ${progress(0)}`)
  }

  // Each key sits in its own block-level <div> so the JAWS virtual cursor
  // treats every key as a separate line. Bare buttons in a grid row are merged
  // into one line ("1 button 2 button 3 button"), so Up/Down Arrow skipped
  // whole rows. Things that broke JAWS arrow-key reading and must stay out:
  // - <ul>/<li> wrappers: a "blank" line between each key ("1 blank 2 blank 3")
  // - display: block on the button: "1, blank, 1 button"
  // - aria-hidden key text with an aria-label: the whole pad read as one item
  return (
    <div role="group" aria-label="On-screen number pad" className="numpad">
      {KEYS.map((key) => (
        <div key={key} className="numpad-cell">
          {renderKey(key)}
        </div>
      ))}
    </div>
  )

  function renderKey(key) {
    if (key === 'clear') {
      return (
        <button
          type="button"
          className="numpad-key numpad-key--wide"
          onClick={pressClear}
          disabled={disabled}
          aria-label="Clear phone number"
        >
          Clear
        </button>
      )
    }
    if (key === 'backspace') {
      return (
        <button
          type="button"
          className="numpad-key numpad-key--wide"
          onClick={pressBackspace}
          disabled={disabled}
          aria-disabled={isEmpty}
          aria-label="Delete last digit"
        >
          Backspace
        </button>
      )
    }
    return (
      <button
        type="button"
        className="numpad-key"
        onClick={() => pressDigit(key)}
        disabled={disabled}
        aria-disabled={isFull}
      >
        {key}
      </button>
    )
  }
}

import { useEffect, useState } from 'react'

const MAX_ROWS = 15

function timestamp() {
  return new Date().toLocaleTimeString([], { hour12: false }) +
    '.' + String(Date.now() % 1000).padStart(3, '0')
}

// Temporary diagnostic overlay (enable with ?keydebug in the URL). Logs every
// key event so we can see what the Storm keypad sends when headphones are
// plugged in or removed. Also logs audio device changes, in case the jack
// shows up as an audio output appearing or disappearing.
// aria-hidden so JAWS doesn't read the log while you test.
export default function KeyDebugPanel() {
  const [rows, setRows] = useState([])

  useEffect(() => {
    let nextId = 0
    function log(row) {
      setRows((prev) => [{ id: nextId++, time: timestamp(), ...row }, ...prev].slice(0, MAX_ROWS))
    }

    function onKey(e) {
      const mods = [e.ctrlKey && 'Ctrl', e.altKey && 'Alt', e.shiftKey && 'Shift', e.metaKey && 'Meta']
        .filter(Boolean).join('+')
      log({
        type: e.type,
        detail: `key="${e.key}" code="${e.code}" keyCode=${e.keyCode} location=${e.location}` +
          (mods ? ` mods=${mods}` : '') + (e.repeat ? ' repeat' : '')
      })
    }

    async function onDeviceChange() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const outputs = devices.filter((d) => d.kind === 'audiooutput').length
        const inputs = devices.filter((d) => d.kind === 'audioinput').length
        log({ type: 'devicechange', detail: `audio outputs=${outputs} inputs=${inputs}` })
      } catch (err) {
        log({ type: 'devicechange', detail: `enumerateDevices failed: ${err.message}` })
      }
    }

    // Capture phase so we see keys before any component handler can stop them.
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('keyup', onKey, true)
    navigator.mediaDevices?.addEventListener('devicechange', onDeviceChange)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('keyup', onKey, true)
      navigator.mediaDevices?.removeEventListener('devicechange', onDeviceChange)
    }
  }, [])

  return (
    <div className="key-debug" aria-hidden="true">
      <div className="key-debug__header">
        <strong>Key debug</strong>
        <button type="button" tabIndex={-1} onClick={() => setRows([])}>Clear</button>
      </div>
      {rows.length === 0 && <p className="key-debug__empty">Waiting for key events…</p>}
      <ol className="key-debug__log">
        {rows.map((r) => (
          <li key={r.id}>
            <span className="key-debug__time">{r.time}</span>{' '}
            <span className="key-debug__type">{r.type}</span> {r.detail}
          </li>
        ))}
      </ol>
    </div>
  )
}

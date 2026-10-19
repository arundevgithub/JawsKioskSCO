export default function LiveRegions({ politeMessage, assertiveMessage }) {
  return (
    <>
      <div className="visually-hidden" role="status" aria-live="polite">
        {politeMessage}
      </div>
      <div className="visually-hidden" role="alert" aria-live="assertive">
        {assertiveMessage}
      </div>
    </>
  )
}

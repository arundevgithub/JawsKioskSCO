import { useId, useLayoutEffect, useRef, useState } from 'react'

// Item list whose item rows scroll on their own (see .item-table__items), so
// the column headings, the totals and the buttons below stay where they are.
//
// The table parts are laid out with CSS grid so the item row group can scroll.
// Changing a table's display strips Chrome's native table semantics, so the
// explicit roles put them back and JAWS table navigation (T, Ctrl+Alt+Arrows)
// keeps working. tabIndex -1 on the scrolling body stops Chrome adding it to
// the Tab order as an unnamed stop.
export default function ItemTable({ caption, items, totals, emptyText, scrollToNewest = false }) {
  const captionId = useId()
  const bodyRef = useRef(null)
  const [scrolls, setScrolls] = useState(false)

  // The scrollbar only shows once the rows overflow; the heading and total
  // rows then make room for it so the Price column stays lined up. The rows
  // get whatever height the window has left, so recheck when that changes.
  useLayoutEffect(() => {
    const body = bodyRef.current
    const update = () => setScrolls(body.scrollHeight > body.clientHeight)
    const observer = new ResizeObserver(update)
    observer.observe(body)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    const body = bodyRef.current
    setScrolls(body.scrollHeight > body.clientHeight)
    // Keep the newest scanned item in view for sighted shoppers.
    if (scrollToNewest) body.scrollTop = body.scrollHeight
  }, [items.length, scrollToNewest])

  return (
    <table
      className={scrolls ? 'item-table item-table--scrolls' : 'item-table'}
      role="table"
      aria-labelledby={captionId}
    >
      {/* Hidden on screen to save room (the screen heading says the same);
          JAWS still reads it as the table's name. */}
      <caption id={captionId} className="visually-hidden">
        {caption}
      </caption>
      <thead role="rowgroup">
        <tr role="row">
          <th scope="col" role="columnheader">Item</th>
          <th scope="col" role="columnheader">Price</th>
        </tr>
      </thead>
      <tbody ref={bodyRef} role="rowgroup" className="item-table__items" tabIndex={-1}>
        {items.length === 0 ? (
          <tr role="row">
            <td role="cell" colSpan={2} className="item-table__empty">
              {emptyText}
            </td>
          </tr>
        ) : (
          items.map((item) => (
            <tr key={item.lineId} role="row">
              <td role="cell">{item.description}</td>
              <td role="cell">{formatMoney(item.price)}</td>
            </tr>
          ))
        )}
      </tbody>
      <tfoot role="rowgroup">
        {totals.map(({ label, value }) => (
          <tr key={label} role="row">
            <th scope="row" role="rowheader">{label}</th>
            <td role="cell">{formatMoney(value)}</td>
          </tr>
        ))}
      </tfoot>
    </table>
  )
}

function formatMoney(value) {
  return `$${value.toFixed(2)}`
}

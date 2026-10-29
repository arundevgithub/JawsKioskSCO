import { useState } from 'react'
import ScreenHeading from './ScreenHeading'
import ItemTable from './ItemTable'
import { scanRandomItem } from '../api/mockApi'
import { TAX_RATE } from '../data/catalog'

const TARGET_ITEM_COUNT = 5

export default function ScanningScreen({ items, onItemScanned, onProceedToPayment, onCancel, announce }) {
  const [isScanning, setIsScanning] = useState(false)

  const subtotal = round2(items.reduce((sum, item) => sum + item.price, 0))
  const tax = round2(subtotal * TAX_RATE)
  const total = round2(subtotal + tax)
  const isDone = items.length >= TARGET_ITEM_COUNT

  async function handleScan() {
    if (isScanning || isDone) return
    setIsScanning(true)
    const item = await scanRandomItem()
    const isLastItem = items.length + 1 >= TARGET_ITEM_COUNT
    onItemScanned(item)
    setIsScanning(false)

    // `items` doesn't include the new item yet, so total it up here.
    const newSubtotal = round2(subtotal + item.price)
    const newTotal = round2(newSubtotal + round2(newSubtotal * TAX_RATE))
    const newCount = items.length + 1
    const countPhrase = `${newCount} ${newCount === 1 ? 'item' : 'items'}`
    const itemPhrase = `${item.description}, ${formatMoney(item.price)}. ${countPhrase}, total due ${formatMoney(newTotal)}.`
    // After the last scan, tell the user where to go next.
    announce(isLastItem ? `${itemPhrase} Press Proceed to Payment to continue.` : itemPhrase)
  }

  return (
    <section aria-labelledby="scanning-heading" className="screen">
      {/* Stand-in for the physical barcode scanner, for sighted testers only.
          aria-hidden + tabIndex -1 keep it out of JAWS's virtual cursor, lists
          and Tab order; preventing mousedown keeps focus where the shopper is. */}
      <div className="sim-toolbar" aria-hidden="true">
        <button
          type="button"
          className="sim-button"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleScan}
          disabled={isScanning || isDone}
        >
          {isScanning ? 'Scanning…' : 'Simulate Barcode Scan'}
        </button>
      </div>

      <ScreenHeading>
        <span id="scanning-heading">Scan Your Items</span>
      </ScreenHeading>
      <p className="screen-intro">
        {isDone
          ? 'All items have been scanned. Choose Proceed to Payment to continue.'
          : 'Scan the barcode of each item on the scanner.'}
      </p>

      <ItemTable
        caption="Scanned items"
        items={items}
        emptyText="No items scanned yet."
        totals={[
          { label: 'Subtotal', value: subtotal },
          { label: 'Estimated tax', value: tax },
          { label: 'Total due', value: total }
        ]}
        scrollToNewest
      />

      <div className="button-row">
        <button type="button" className="primary-button" onClick={onProceedToPayment} disabled={!isDone}>
          Proceed to Payment
        </button>
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel Transaction
        </button>
      </div>
    </section>
  )
}

function round2(value) {
  return Math.round(value * 100) / 100
}

function formatMoney(value) {
  return `$${value.toFixed(2)}`
}

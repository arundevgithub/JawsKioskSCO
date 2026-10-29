import { useState } from 'react'
import ScreenHeading from './ScreenHeading'
import { printReceipt } from '../api/mockApi'

export default function ReceiptScreen({ items, totals, payment, customer, onStartOver, announce, announceAssertive }) {
  const [isPrinting, setIsPrinting] = useState(false)
  const [printedId, setPrintedId] = useState(null)
  const pointsEarned = Math.round(totals.total)

  async function handlePrint() {
    if (isPrinting) return
    setIsPrinting(true)
    announce('Printing receipt, please wait.')
    const result = await printReceipt()
    setIsPrinting(false)
    setPrintedId(result.receiptId)
    announceAssertive('Receipt printed. Thank you for shopping with us.')
  }

  const now = new Date()

  return (
    <section aria-labelledby="receipt-heading" className="screen">
      <ScreenHeading>
        <span id="receipt-heading">Payment Approved</span>
      </ScreenHeading>
      <p className="screen-intro">
        Thank you, {customer.firstName}! Choose Print Receipt or Start New
        Transaction.
      </p>

      <div className="receipt" aria-label="Transaction receipt">
        <div className="receipt__header">
          <p className="receipt-line">QuickStop Self-Checkout — Demo Store #1</p>
          <p className="receipt-line">{now.toLocaleString()}</p>
        </div>

        <div className="receipt__details">
          <dl className="summary-list">
            <div className="summary-row">
              <dt>Items</dt>
              <dd>{items.length}</dd>
            </div>
            <div className="summary-row">
              <dt>Subtotal</dt>
              <dd>{formatMoney(totals.subtotal)}</dd>
            </div>
            <div className="summary-row">
              <dt>Tax</dt>
              <dd>{formatMoney(totals.tax)}</dd>
            </div>
            <div className="summary-row summary-row--total">
              <dt>Total paid</dt>
              <dd>{formatMoney(totals.total)}</dd>
            </div>
            {payment.method === 'cash' ? (
              <>
                <div className="summary-row">
                  <dt>Payment method</dt>
                  <dd>Cash</dd>
                </div>
                <div className="summary-row">
                  <dt>Cash tendered</dt>
                  <dd>{formatMoney(payment.amountTendered)}</dd>
                </div>
                <div className="summary-row">
                  <dt>Change</dt>
                  <dd>{formatMoney(payment.change)}</dd>
                </div>
              </>
            ) : (
              <>
                <div className="summary-row">
                  <dt>Payment method</dt>
                  <dd>{payment.cardBrand} ending in {payment.cardLast4}</dd>
                </div>
                <div className="summary-row">
                  <dt>Authorization code</dt>
                  <dd>{payment.authCode}</dd>
                </div>
              </>
            )}
            <div className="summary-row">
              <dt>Loyalty number</dt>
              <dd>{customer.loyaltyNumber}</dd>
            </div>
            <div className="summary-row">
              <dt>Points earned this visit</dt>
              <dd>{pointsEarned} points</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="button-row">
        <button type="button" className="primary-button" onClick={handlePrint} disabled={isPrinting}>
          {isPrinting ? 'Printing…' : 'Print Receipt'}
        </button>
        <button type="button" className="secondary-button" onClick={onStartOver}>
          Start New Transaction
        </button>
        {/* Beside the buttons rather than in the receipt, which has no room
            left for it in a short window. */}
        {printedId ? (
          <p className="confirmation-text" role="status">
            Receipt printed. Confirmation number {printedId}.
          </p>
        ) : null}
      </div>
    </section>
  )
}

function formatMoney(value) {
  return `$${value.toFixed(2)}`
}

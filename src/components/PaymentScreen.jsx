import { useEffect, useRef, useState } from 'react'
import ScreenHeading from './ScreenHeading'
import {
  waitForCardPresented,
  readCardData,
  authorizePayment,
  waitForCashInserted,
  dispenseChange,
  simulateCardPresented,
  simulateCashInserted
} from '../api/mockApi'
import { TAX_RATE } from '../data/catalog'

// Stages of a transaction, in order. The card is read on the separate
// card reader device, never by the kiosk itself: the kiosk waits for the
// customer to present the card at the reader, waits for the reader to send
// back the card data, then waits on the payment gateway's response.
// Cash goes into the cash acceptor one bill or coin at a time until the
// total is covered, then the cash dispenser pays out any change.
const STAGE = {
  IDLE: 'idle',
  WAITING_FOR_CARD: 'waiting-for-card',
  READING_CARD: 'reading-card',
  AUTHORIZING: 'authorizing',
  INSERTING_CASH: 'inserting-cash',
  DISPENSING_CHANGE: 'dispensing-change'
}

const STAGE_STEPS = {
  card: [
    { stage: STAGE.WAITING_FOR_CARD, label: 'Present card at reader' },
    { stage: STAGE.READING_CARD, label: 'Card reader reading card' },
    { stage: STAGE.AUTHORIZING, label: 'Authorizing payment' }
  ],
  cash: [
    { stage: STAGE.INSERTING_CASH, label: 'Insert cash' },
    { stage: STAGE.DISPENSING_CHANGE, label: 'Dispensing change' }
  ]
}

const STAGE_BANNER = {
  [STAGE.WAITING_FOR_CARD]: 'Waiting for card reader. Tap, insert, or swipe your card on the card reader…',
  [STAGE.READING_CARD]: 'The card reader is reading your card. Do not remove your card from the reader…',
  [STAGE.AUTHORIZING]: 'Contacting payment processor. Please wait…',
  [STAGE.DISPENSING_CHANGE]: 'Dispensing your change. Please take your change from the cash dispenser…'
}

const SIM_ACTIONS = [
  { label: 'Simulate Card Tap/Insert/Swipe', waitsFor: STAGE.WAITING_FOR_CARD, run: simulateCardPresented },
  { label: 'Simulate $1 Bill', waitsFor: STAGE.INSERTING_CASH, run: () => simulateCashInserted(1) },
  { label: 'Simulate $10 Bill', waitsFor: STAGE.INSERTING_CASH, run: () => simulateCashInserted(10) },
  { label: 'Simulate 25¢ Coin', waitsFor: STAGE.INSERTING_CASH, run: () => simulateCashInserted(0.25) }
]

export default function PaymentScreen({ items, onApproved, onCancel, announce, announceAssertive }) {
  const [stage, setStage] = useState(STAGE.IDLE)
  const [method, setMethod] = useState(null)
  const [cashInserted, setCashInserted] = useState(0)
  const cancelledRef = useRef(false)
  const isProcessing = stage !== STAGE.IDLE

  const subtotal = round2(items.reduce((sum, item) => sum + item.price, 0))
  const tax = round2(subtotal * TAX_RATE)
  const total = round2(subtotal + tax)

  // Stop the simulated transaction from completing if the screen goes away.
  useEffect(() => () => { cancelledRef.current = true }, [])

  async function handlePayWithCard() {
    if (isProcessing) return
    cancelledRef.current = false
    setMethod('card')

    setStage(STAGE.WAITING_FOR_CARD)
    announce(`Total due ${formatMoney(total)}. Tap, insert, or swipe your card on the card reader.`)
    await waitForCardPresented()
    if (cancelledRef.current) return

    setStage(STAGE.READING_CARD)
    announce('Card detected. The card reader is reading your card. Please do not remove it from the reader.')
    const cardData = await readCardData()
    if (cancelledRef.current) return

    setStage(STAGE.AUTHORIZING)
    announce('Card reader finished. Contacting payment processor, please wait.')
    const result = await authorizePayment(cardData, total)
    if (cancelledRef.current) return

    setStage(STAGE.IDLE)
    if (result.approved) {
      announceAssertive(`Payment approved. ${result.cardBrand} ending in ${result.cardLast4}. Thank you.`)
      onApproved({ method: 'card', ...result }, { subtotal, tax, total })
    } else {
      announceAssertive('Payment declined. Please try a different card.')
    }
  }

  async function handlePayWithCash() {
    if (isProcessing) return
    cancelledRef.current = false
    setMethod('cash')
    setCashInserted(0)

    setStage(STAGE.INSERTING_CASH)
    announce(`Total due ${formatMoney(total)}. Insert bills or coins into the cash acceptor.`)
    let inserted = 0
    while (inserted < total) {
      const cash = await waitForCashInserted()
      if (cancelledRef.current) return
      inserted = round2(inserted + cash.amount)
      setCashInserted(inserted)
      if (inserted < total) {
        announce(`${formatMoney(cash.amount)} inserted. Amount remaining ${formatMoney(round2(total - inserted))}.`)
      }
    }

    const change = round2(inserted - total)
    if (change > 0) {
      setStage(STAGE.DISPENSING_CHANGE)
      announce(`Total paid. Dispensing ${formatMoney(change)} change. Please take your change from the cash dispenser.`)
      await dispenseChange(change)
      if (cancelledRef.current) return
    }

    setStage(STAGE.IDLE)
    announceAssertive(
      change > 0
        ? `Payment complete. Paid ${formatMoney(inserted)} cash, change ${formatMoney(change)}. Thank you.`
        : `Payment complete. Paid ${formatMoney(inserted)} cash. Thank you.`
    )
    onApproved({ method: 'cash', amountTendered: inserted, change }, { subtotal, tax, total })
  }

  function handleCancel() {
    cancelledRef.current = true
    onCancel()
  }

  // The customer can still back out while the reader waits for a card, or
  // before any cash goes in, but not once the card is being read, the payment
  // is being authorized, or cash has been accepted.
  const canCancel =
    stage === STAGE.IDLE ||
    stage === STAGE.WAITING_FOR_CARD ||
    (stage === STAGE.INSERTING_CASH && cashInserted === 0)
  const steps = method ? STAGE_STEPS[method] : []
  const currentStepIndex = steps.findIndex((step) => step.stage === stage)
  const banner =
    stage === STAGE.INSERTING_CASH
      ? `Insert bills or coins into the cash acceptor. Inserted ${formatMoney(cashInserted)}, remaining ${formatMoney(round2(Math.max(total - cashInserted, 0)))}…`
      : STAGE_BANNER[stage]

  return (
    <section aria-labelledby="payment-heading" className="screen">
      {/* Stand-in for the physical card reader and cash acceptor, for sighted
          testers only. aria-hidden + tabIndex -1 keep it out of JAWS's virtual
          cursor, lists and Tab order; preventing mousedown keeps focus where
          the shopper is. */}
      <div className="sim-toolbar" aria-hidden="true">
        {SIM_ACTIONS.map(({ label, waitsFor, run }) => (
          <button
            key={label}
            type="button"
            className="sim-button"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={run}
            disabled={stage !== waitsFor}
          >
            {label}
          </button>
        ))}
      </div>

      <ScreenHeading>
        <span id="payment-heading">Payment</span>
      </ScreenHeading>
      <p className="screen-intro">
        Review your order total, then choose Pay with Card or Pay with Cash.
      </p>

      <dl className="summary-list">
        <div className="summary-row">
          <dt>Items</dt>
          <dd>{items.length}</dd>
        </div>
        <div className="summary-row">
          <dt>Subtotal</dt>
          <dd>{formatMoney(subtotal)}</dd>
        </div>
        <div className="summary-row">
          <dt>Estimated tax</dt>
          <dd>{formatMoney(tax)}</dd>
        </div>
        <div className="summary-row summary-row--total">
          <dt>Total due</dt>
          <dd>{formatMoney(total)}</dd>
        </div>
      </dl>

      {/* Visual-only progress; speech comes from the live region announcements. */}
      <div className="card-reader-status" aria-hidden="true">
        {isProcessing && (
          <>
            <ol className="payment-steps">
              {steps.map((step, index) => {
                const state =
                  index < currentStepIndex ? 'done' : index === currentStepIndex ? 'current' : 'pending'
                return (
                  <li key={step.stage} className={`payment-step payment-step--${state}`}>
                    <span className="payment-step__marker">{state === 'done' ? '✓' : index + 1}</span>
                    {step.label}
                  </li>
                )
              })}
            </ol>
            <p className="status-banner">
              <span className="spinner" />
              {banner}
            </p>
          </>
        )}
      </div>

      <div className="button-row">
        <button type="button" className="primary-button" onClick={handlePayWithCard} disabled={isProcessing}>
          {isProcessing && method === 'card' ? 'Processing…' : 'Pay with Card'}
        </button>
        <button type="button" className="primary-button" onClick={handlePayWithCash} disabled={isProcessing}>
          {isProcessing && method === 'cash' ? 'Processing…' : 'Pay with Cash'}
        </button>
        <button type="button" className="secondary-button" onClick={handleCancel} disabled={!canCancel}>
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

import { useLayoutEffect, useRef, useState } from 'react'
import { useAnnouncer } from './hooks/useAnnouncer'
import LiveRegions from './components/LiveRegions'
import WelcomeScreen from './components/WelcomeScreen'
import LoyaltyDialog from './components/LoyaltyDialog'
import ScanningScreen from './components/ScanningScreen'
import PaymentScreen from './components/PaymentScreen'
import ReceiptScreen from './components/ReceiptScreen'
import KeyDebugPanel from './components/KeyDebugPanel'

const KEY_DEBUG = new URLSearchParams(window.location.search).has('keydebug')

const SCREEN = {
  WELCOME: 'welcome',
  SCANNING: 'scanning',
  PAYMENT: 'payment',
  RECEIPT: 'receipt'
}

const SCREEN_LABEL = {
  [SCREEN.WELCOME]: 'Welcome',
  [SCREEN.SCANNING]: 'Scan items',
  [SCREEN.PAYMENT]: 'Payment',
  [SCREEN.RECEIPT]: 'Receipt'
}

function initialState() {
  return {
    screen: SCREEN.WELCOME,
    customer: null,
    isLoyaltyOpen: false,
    items: [],
    payment: null,
    totals: null
  }
}

export default function App() {
  const [state, setState] = useState(initialState)
  const { politeMessage, assertiveMessage, announce, announceAssertive } = useAnnouncer()
  const headerRef = useRef(null)
  const mainRef = useRef(null)
  const footerRef = useRef(null)

  // While the loyalty dialog is open, everything behind it is inert: out of
  // the accessibility tree and unfocusable, so JAWS can't leave the dialog.
  // A layout effect, so it's in place before any screen focuses its heading.
  useLayoutEffect(() => {
    for (const ref of [headerRef, mainRef, footerRef]) ref.current.inert = state.isLoyaltyOpen
  }, [state.isLoyaltyOpen])

  function resetToWelcome(message) {
    setState(initialState())
    if (message) announce(message)
  }

  // Checkout opens on the cart with the loyalty dialog already over it.
  function handleStart() {
    setState((prev) => ({ ...prev, screen: SCREEN.SCANNING, isLoyaltyOpen: true }))
    announce('Enter your 10-digit phone number to find your loyalty account, or choose Skip.')
  }

  function handleOpenLoyalty() {
    setState((prev) => ({ ...prev, isLoyaltyOpen: true }))
    announce('Enter your 10-digit phone number to find your loyalty account, or choose Skip.')
  }

  function handleAccountFound(customer) {
    setState((prev) => ({ ...prev, customer, isLoyaltyOpen: false }))
    announce(
      `Loyalty account found for ${customer.firstName} ${customer.lastName}, ` +
        `${customer.pointsBalance} points. Scan the barcode of each item.`
    )
  }

  function handleSkipLoyalty() {
    setState((prev) => ({ ...prev, isLoyaltyOpen: false }))
    announce('Scan the barcode of each item.')
  }

  function handleItemScanned(item) {
    setState((prev) => ({ ...prev, items: [...prev.items, item] }))
  }

  function handleProceedToPayment() {
    setState((prev) => ({ ...prev, screen: SCREEN.PAYMENT }))
    announce('Payment screen. Choose Pay with Card or Pay with Cash to complete your purchase.')
  }

  function handlePaymentApproved(payment, totals) {
    setState((prev) => ({ ...prev, screen: SCREEN.RECEIPT, payment, totals }))
  }

  return (
    <div className="kiosk">
      <LiveRegions politeMessage={politeMessage} assertiveMessage={assertiveMessage} />

      <header ref={headerRef} className="kiosk-header">
        <p className="kiosk-brand">QuickStop Self-Checkout</p>
        <p className="kiosk-step" aria-hidden="true">
          Step: {SCREEN_LABEL[state.screen]}
        </p>
      </header>

      <main ref={mainRef} className="kiosk-main">
        {state.screen === SCREEN.WELCOME && <WelcomeScreen onStart={handleStart} />}

        {state.screen === SCREEN.SCANNING && (
          <ScanningScreen
            items={state.items}
            customer={state.customer}
            onEnterLoyalty={handleOpenLoyalty}
            onItemScanned={handleItemScanned}
            onProceedToPayment={handleProceedToPayment}
            onCancel={() => resetToWelcome('Transaction cancelled. Returning to the welcome screen.')}
            announce={announce}
          />
        )}

        {state.screen === SCREEN.PAYMENT && (
          <PaymentScreen
            items={state.items}
            onApproved={handlePaymentApproved}
            onCancel={() => resetToWelcome('Transaction cancelled. Returning to the welcome screen.')}
            announce={announce}
            announceAssertive={announceAssertive}
          />
        )}

        {state.screen === SCREEN.RECEIPT && (
          <ReceiptScreen
            items={state.items}
            totals={state.totals}
            payment={state.payment}
            customer={state.customer}
            onStartOver={() => resetToWelcome('Starting a new transaction. Welcome screen.')}
            announce={announce}
            announceAssertive={announceAssertive}
          />
        )}
      </main>

      <footer ref={footerRef} className="kiosk-footer">
        <p>Demo kiosk for JAWS-for-Kiosk accessibility testing. No real payment is processed.</p>
      </footer>

      {state.isLoyaltyOpen && (
        <LoyaltyDialog
          onFound={handleAccountFound}
          onSkip={handleSkipLoyalty}
          announce={announce}
          announceAssertive={announceAssertive}
        />
      )}

      {KEY_DEBUG && <KeyDebugPanel />}
    </div>
  )
}

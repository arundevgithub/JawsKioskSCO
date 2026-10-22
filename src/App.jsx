import { useState } from 'react'
import { useAnnouncer } from './hooks/useAnnouncer'
import LiveRegions from './components/LiveRegions'
import WelcomeScreen from './components/WelcomeScreen'
import PhoneEntryScreen from './components/PhoneEntryScreen'
import LoyaltyFoundScreen from './components/LoyaltyFoundScreen'
import ScanningScreen from './components/ScanningScreen'
import PaymentScreen from './components/PaymentScreen'
import ReceiptScreen from './components/ReceiptScreen'
import KeyDebugPanel from './components/KeyDebugPanel'

const KEY_DEBUG = new URLSearchParams(window.location.search).has('keydebug')

const SCREEN = {
  WELCOME: 'welcome',
  PHONE_ENTRY: 'phone-entry',
  LOYALTY_FOUND: 'loyalty-found',
  SCANNING: 'scanning',
  PAYMENT: 'payment',
  RECEIPT: 'receipt'
}

const SCREEN_LABEL = {
  [SCREEN.WELCOME]: 'Welcome',
  [SCREEN.PHONE_ENTRY]: 'Find loyalty account',
  [SCREEN.LOYALTY_FOUND]: 'Account found',
  [SCREEN.SCANNING]: 'Scan items',
  [SCREEN.PAYMENT]: 'Payment',
  [SCREEN.RECEIPT]: 'Receipt'
}

function initialState() {
  return {
    screen: SCREEN.WELCOME,
    customer: null,
    items: [],
    payment: null,
    totals: null
  }
}

export default function App() {
  const [state, setState] = useState(initialState)
  const { politeMessage, assertiveMessage, announce, announceAssertive } = useAnnouncer()

  function resetToWelcome(message) {
    setState(initialState())
    if (message) announce(message)
  }

  function handleStart() {
    setState((prev) => ({ ...prev, screen: SCREEN.PHONE_ENTRY }))
    announce('Enter your 10-digit phone number to find your loyalty account.')
  }

  function handleAccountFound(customer) {
    setState((prev) => ({ ...prev, screen: SCREEN.LOYALTY_FOUND, customer }))
    announce(`Loyalty account found for ${customer.firstName} ${customer.lastName}.`)
  }

  function handleBeginScanning() {
    setState((prev) => ({ ...prev, screen: SCREEN.SCANNING }))
    announce('Scanning screen. Scan the barcode of your first item.')
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

      <header className="kiosk-header">
        <p className="kiosk-brand">QuickStop Self-Checkout</p>
        <p className="kiosk-step" aria-hidden="true">
          Step: {SCREEN_LABEL[state.screen]}
        </p>
      </header>

      <main className="kiosk-main">
        {state.screen === SCREEN.WELCOME && <WelcomeScreen onStart={handleStart} />}

        {state.screen === SCREEN.PHONE_ENTRY && (
          <PhoneEntryScreen
            onFound={handleAccountFound}
            onCancel={() => resetToWelcome('Transaction cancelled. Returning to the welcome screen.')}
            announce={announce}
            announceAssertive={announceAssertive}
          />
        )}

        {state.screen === SCREEN.LOYALTY_FOUND && (
          <LoyaltyFoundScreen
            customer={state.customer}
            onContinue={handleBeginScanning}
            onCancel={() => resetToWelcome('Transaction cancelled. Returning to the welcome screen.')}
          />
        )}

        {state.screen === SCREEN.SCANNING && (
          <ScanningScreen
            items={state.items}
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

      <footer className="kiosk-footer">
        <p>Demo kiosk for JAWS-for-Kiosk accessibility testing. No real payment is processed.</p>
      </footer>

      {KEY_DEBUG && <KeyDebugPanel />}
    </div>
  )
}

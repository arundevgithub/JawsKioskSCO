// All "API calls" in this demo are fully simulated on the client with
// artificial network delay, so the app can run standalone with no backend.
import { CATALOG } from '../data/catalog'

const FIRST_NAMES = ['Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sam']
const LAST_NAMES = ['Nguyen', 'Smith', 'Garcia', 'Patel', 'Johnson', 'Kim', 'Brown', 'Davis']

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Deterministic pseudo-random pick based on the phone number, so the same
// number always resolves to the same demo customer (useful when re-testing).
function hashDigits(digits) {
  let hash = 0
  for (const ch of digits) {
    hash = (hash * 31 + ch.charCodeAt(0)) % 100000
  }
  return hash
}

/**
 * Simulates a loyalty account lookup by phone number.
 * Always "finds" an account for any 10-digit number so the demo flow
 * never dead-ends during accessibility testing.
 */
export async function lookupLoyaltyAccount(phoneNumber) {
  await delay(1400)
  const digits = phoneNumber.replace(/\D/g, '')
  const hash = hashDigits(digits)
  const firstName = FIRST_NAMES[hash % FIRST_NAMES.length]
  const lastName = LAST_NAMES[Math.floor(hash / FIRST_NAMES.length) % LAST_NAMES.length]
  const loyaltyNumber = `LOY-${digits.slice(-4)}-${(hash % 9000 + 1000)}`
  const pointsBalance = 100 + (hash % 900)

  return {
    found: true,
    firstName,
    lastName,
    loyaltyNumber,
    pointsBalance
  }
}

/**
 * Simulates scanning a random item off the shelf (barcode scan).
 * Each scan is a single unit of one product.
 */
export async function scanRandomItem() {
  await delay(600)
  const product = CATALOG[Math.floor(Math.random() * CATALOG.length)]
  return {
    lineId: `${product.id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    id: product.id,
    description: product.description,
    price: product.price
  }
}

// Resolvers for the device waits below, fired by the tester's simulation
// toolbar. Only one wait of each kind is pending at a time.
let pendingCard = null
let pendingCash = null

/**
 * Simulates the payment terminal waiting for the customer to present a card.
 * Resolves once simulateCardPresented() reports a tap, insert, or swipe.
 */
export function waitForCardPresented() {
  return new Promise((resolve) => { pendingCard = resolve })
}

/**
 * Called by the simulation toolbar when the card is tapped, inserted, or swiped.
 */
export function simulateCardPresented() {
  const resolve = pendingCard
  pendingCard = null
  resolve?.()
}

/**
 * Simulates the card reader device reading the presented card and sending
 * its (masked) card data back to the kiosk. The kiosk never reads the card.
 */
export async function readCardData() {
  await delay(1500)
  const brands = ['Visa', 'Mastercard', 'Discover']
  const brand = brands[Math.floor(Math.random() * brands.length)]
  const last4 = String(1000 + Math.floor(Math.random() * 9000))
  return { cardBrand: brand, cardLast4: last4 }
}

/**
 * Simulates sending the card data to the payment gateway for authorization
 * and receiving its response.
 * Always approves, so the demo flow is reliable for repeated AT testing.
 */
export async function authorizePayment(cardData, amountDue) {
  await delay(2200)
  const authCode = `AUTH${Math.floor(100000 + Math.random() * 900000)}`

  return {
    approved: true,
    amount: amountDue,
    cardBrand: cardData.cardBrand,
    cardLast4: cardData.cardLast4,
    authCode
  }
}

/**
 * Simulates the cash acceptor waiting for the customer to insert one bill
 * or coin. Resolves once simulateCashInserted() reports the amount.
 */
export function waitForCashInserted() {
  return new Promise((resolve) => { pendingCash = resolve })
}

/**
 * Called by the simulation toolbar with the value of the bill or coin.
 */
export function simulateCashInserted(amount) {
  const resolve = pendingCash
  pendingCash = null
  resolve?.({ amount })
}

/**
 * Simulates the cash dispenser paying out the customer's change.
 */
export async function dispenseChange(amount) {
  await delay(1800)
  return { dispensed: true, amount }
}

/**
 * Simulates sending the receipt to the kiosk's receipt printer.
 */
export async function printReceipt() {
  await delay(1200)
  const receiptId = `RCPT-${Math.floor(100000 + Math.random() * 900000)}`
  return { printed: true, receiptId }
}

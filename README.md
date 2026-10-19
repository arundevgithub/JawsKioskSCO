# QuickStop Self-Checkout Kiosk (Demo)

A React simulator of a grocery self-checkout kiosk, built specifically as a
test bed for **JAWS for Kiosk** (Vispero/Freedom Scientific) integration and,
more generally, for any screen-reader accessibility testing. Every backend
interaction — loyalty lookup, barcode scanning, card payment, receipt
printing — is simulated client-side with artificial network delay. There is
no server and no real payment processing.

## Flow implemented

1. **Welcome** — large "Start Checkout" button.
2. **Phone entry** — customer enters a 10-digit phone number with the
   on-screen numpad (a kiosk has no keyboard) to look up a loyalty account.
3. **Account found** — shows the matched customer's name, loyalty number,
   and points balance.
4. **Scan items** — the shopper scans barcodes on the physical scanner. For
   testing, a "Simulate Barcode Scan" button (top-right, hidden from JAWS)
   stands in for the scanner, adding one
   random product (one unit, with its name and price) until 5 items have
   been scanned; subtotal/tax/total update live.
5. **Payment** — "Pay with Credit Card" simulates sending the total to a
   card reader/processor and always approves after a short delay.
6. **Receipt** — full itemized receipt with payment and loyalty details;
   "Print Receipt" simulates sending the receipt to a kiosk printer.

## Project structure

```
src/
  api/mockApi.js        simulated backend calls (delay + fake data)
  data/catalog.js        product catalog + tax rate
  hooks/useAnnouncer.js  manages the two aria-live regions
  components/            one component per kiosk screen, plus
                          ScreenHeading (focus management) and
                          LiveRegions / Numpad
  App.jsx                screen state machine
```

## Running it

Prerequisites: Node.js 18+ and npm.

```bash
npm install
npm run dev       # starts Vite dev server at http://localhost:5173
```

Production build:

```bash
npm run build      # outputs static files to dist/
npm run preview    # serves the production build locally for a final check
```

For an actual kiosk deployment, serve the contents of `dist/` as static
files from any web server (or point the kiosk browser directly at
`dist/index.html` via `file://`, or a local static file server such as
`npx serve dist`).

## Accessibility design decisions

These choices exist specifically so a screen reader — JAWS in particular —
can drive the whole transaction without sight:

- **Focus management on screen change.** Every screen is a React component
  that renders an `<h1 tabIndex={-1}>` wrapped by `ScreenHeading`, which
  calls `.focus()` on mount. This moves both visual focus and the screen
  reader's point of regard to the new screen's heading automatically,
  mirroring how a sighted user's attention snaps to new on-screen content.
- **Live regions, not visual-only feedback.** `useAnnouncer` drives two
  always-present, visually-hidden regions (`role="status"`/`aria-live="polite"`
  and `role="alert"`/`aria-live="assertive"`). Item scans, "searching…",
  "processing payment…", and the final approval/decline are all announced
  through these, independent of whatever is visually on screen. The hook
  clears the region's text before setting new text so repeated/similar
  announcements still get spoken (otherwise identical consecutive live-region
  content is sometimes not re-announced).
- **Native, semantic elements.** All actions are real `<button>` elements
  (never `<div onClick>`), the phone number is a read-only text display filled only by the on-screen
  numpad (no `<input>`, since a kiosk has no keyboard), and the
  scanned-items / receipt tables use `<caption>`, `<th scope="col">`/
  `<th scope="row">`, so a screen reader's table navigation commands work
  correctly.
- **Large hit targets and visible focus.** Buttons are at least 64px tall
  with a thick, high-contrast focus outline (`:focus-visible`), useful for
  low-vision and motor-impaired kiosk users as well as sighted testers
  following along with a keyboard.
- **Cancel is always reachable.** Every screen after Welcome has a visible,
  keyboard-reachable "Cancel Transaction" control that resets the flow and
  announces the reset.

## Testing with any screen reader (including JAWS)

1. Start the app (`npm run dev`) and open it in the browser you intend to
   test with.
2. Start your screen reader, then load/focus the page.
3. Tab to **Start Checkout** and press Enter — confirm you hear the new
   heading, "Find Your Loyalty Account," announced.
4. Tab into the on-screen keypad and press 10 digits — confirm each digit
   and the running count are announced, then Tab to
   **Find My Account** and press Enter. You should hear "Searching for your
   loyalty account, please wait," then the "Account Found" heading plus the
   customer's name.
5. Press Enter on **Begin Scanning Items**. A sighted helper then clicks
   **Simulate Barcode Scan** (top-right) in place of a real scanner — JAWS
   should never land on or list that button. Each scan should announce the
   item name and price; the 5th scan should also say to press Proceed to
   Payment.
6. Activate **Proceed to Payment**, then **Pay with Credit Card** — you
   should hear a processing announcement, then an assertive "Payment
   approved" announcement that interrupts whatever was being read.
7. On the receipt screen, verify the table reads correctly with your
   reader's table-navigation keys, then activate **Print Receipt** and
   confirm you hear the printed confirmation.

This script works with NVDA, VoiceOver, or Narrator too — it's useful to
validate the app against a free screen reader before scheduling time on a
licensed JAWS kiosk install.

## Integrating with JAWS for Kiosk

**JAWS for Kiosk** is a separate, purpose-built licensing/edition of
Freedom Scientific's JAWS screen reader (now under Vispero) meant for
unattended, public-facing terminals — ATMs, ticketing machines, grocery
self-checkouts, and similar devices — rather than a single logged-in
desktop user. The important architectural point for this project: **JAWS
for Kiosk does not require any special API calls from the web app.** It
reads any standards-compliant, accessible web page the same way desktop
JAWS does, via the browser's accessibility tree, the virtual cursor, and
Forms Mode. Your job as the app developer is exactly what this repo does —
build a fully keyboard-operable, semantically correct, live-region-aware
UI — and then JAWS for Kiosk's job is to be running, activated, and
correctly configured on the kiosk's Windows PC. The two concerns are
independent:

| Concern | Owner |
|---|---|
| Accessible, keyboard-operable, ARIA-correct web app | This repo |
| Screen reader runs unattended without a logged-in user, activates on demand, speaks through kiosk-appropriate audio output | JAWS for Kiosk install/config on the Windows device |

### What JAWS for Kiosk generally requires (architecture-level, not a
click-by-click guide — see note below)

1. **A separate kiosk license/SKU from Vispero.** This is not the same
   purchase as a normal per-user JAWS license; it's sold for unattended
   public terminals. Contact Vispero sales/your reseller to obtain it.
2. **Install on the kiosk's Windows PC**, then apply the kiosk
   authorization so JAWS is licensed to run without an interactively
   logged-in user (JAWS for Kiosk is typically designed to run at/above the
   Windows lock screen or inside a locked-down kiosk session).
3. **Configure JAWS to start automatically** with Windows (so it's already
   available before any customer approaches the kiosk), and suppress its
   normal startup UI/wizards/training screens, since there's no sighted
   administrator present to dismiss dialogs.
4. **Configure an activation trigger.** Public kiosks commonly wire speech
   activation to either (a) headphone-jack detection — JAWS starts
   speaking automatically when a customer plugs in headphones at an
   accessible jack, and stays silent otherwise so it doesn't disturb
   sighted shoppers — or (b) a dedicated physical/tactile button that
   sends a hotkey JAWS is configured to listen for. Which mechanism is
   available depends on the kiosk hardware and the JAWS for Kiosk version
   deployed.
5. **Lock down the kiosk shell.** Use Windows Assigned Access / Shell
   Launcher (or equivalent kiosk-mode tooling) so the browser running this
   app, and JAWS, are the only reachable software — no desktop, no task
   switching. Run the browser in full-screen/kiosk mode pointed at this
   app's built `dist/` output, with zoom gestures, browser dev tools, and
   any competing "read aloud"/reader-mode features disabled so they don't
   fight with JAWS's virtual cursor.
6. **Leave JAWS's web defaults in place.** Out of the box, JAWS has Virtual
   PC Cursor and Auto Forms Mode enabled and supports
   ARIA live regions by default — nothing in this app requires non-default
   JAWS settings.

> **Note on precision:** Exact menu paths, setting names, and the
> configuration utility used to apply a kiosk license change between JAWS
> releases, and JAWS for Kiosk is commercial software requiring its own
> license activation that I cannot click through here. Treat the six
> points above as the correct architecture and checklist of concerns, but
> get the current, version-specific click-by-click steps from Vispero's
> official JAWS for Kiosk deployment documentation or their support team
> when you do the install — that's the authoritative source for whatever
> JAWS version you're licensed for.

### Quick validation once JAWS for Kiosk is installed

Run through the same 7-step script in "Testing with any screen reader"
above, but triggered the way a real customer would trigger it on that
hardware (headphone jack or kiosk accessibility button) rather than
starting JAWS manually from a Start Menu. If every step in that script
reads correctly, the web app side of the integration is working; any
remaining issues (JAWS not starting, no audio, wrong trigger) are kiosk
configuration issues rather than something in this codebase.

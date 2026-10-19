import ScreenHeading from './ScreenHeading'

export default function WelcomeScreen({ onStart }) {
  return (
    <section aria-labelledby="welcome-heading" className="screen">
      <ScreenHeading>
        <span id="welcome-heading">Welcome to QuickStop Self-Checkout</span>
      </ScreenHeading>
      <p className="screen-intro">
        Press the Start Checkout button to begin.
      </p>
      <p id="welcome-desc" className="screen-intro">
        You will be asked for your phone number to look up your loyalty rewards
        account before scanning your items.
      </p>
      <button
        type="button"
        className="primary-button"
        onClick={onStart}
        aria-describedby="welcome-desc"
      >
        Start Checkout
      </button>
    </section>
  )
}

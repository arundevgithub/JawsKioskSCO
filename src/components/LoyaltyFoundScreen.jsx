import ScreenHeading from './ScreenHeading'

export default function LoyaltyFoundScreen({ customer, onContinue, onCancel }) {
  return (
    <section aria-labelledby="found-heading" className="screen">
      <ScreenHeading>
        <span id="found-heading">Account Found</span>
      </ScreenHeading>
      <p className="screen-intro">
        Welcome back, {customer.firstName} {customer.lastName}.
      </p>
      <dl className="summary-list">
        <div className="summary-row">
          <dt>Loyalty number</dt>
          <dd>{customer.loyaltyNumber}</dd>
        </div>
        <div className="summary-row">
          <dt>Rewards points balance</dt>
          <dd>{customer.pointsBalance} points</dd>
        </div>
      </dl>
      <div className="button-row">
        <button type="button" className="primary-button" onClick={onContinue}>
          Begin Scanning Items
        </button>
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel Transaction
        </button>
      </div>
    </section>
  )
}

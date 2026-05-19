export function PaymentPanel() {
  return (
    <section className="panel" id="payment">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Quick action</p>
          <h3>Record payment</h3>
        </div>
      </div>
      <form className="paymentForm">
        <label>
          Customer
          <input placeholder="Search by DCS / phone" />
        </label>
        <label>
          Amount
          <input inputMode="numeric" placeholder="₹" />
        </label>
        <label>
          UPI / bank reference
          <input placeholder="Transaction ID" />
        </label>
        <button type="button" className="primaryButton">
          Save payment
        </button>
      </form>
    </section>
  );
}

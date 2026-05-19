import { formatInr } from "@/components/domain/currency";
import { RatingBadge } from "@/components/domain/rating-badge";

type Customer = {
  dcs: string;
  name: string;
  phone: string;
  area: string;
  rating: number;
  ratingLabel: string;
  rcl: number;
};

type DcsLookupPanelProps = {
  customers: Customer[];
};

export function DcsLookupPanel({ customers }: DcsLookupPanelProps) {
  return (
    <section className="panel dcsPanel" id="dcs">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Most-used screen</p>
          <h3>DCS lookup</h3>
        </div>
        <span className="latencyBadge">&lt; 500ms target</span>
      </div>
      <form className="lookupForm">
        <input aria-label="Search DCS, name, or phone" placeholder="DCS111, Anu, or last 4 phone digits" />
        <button type="button">Search</button>
      </form>
      <div className="customerList">
        {customers.map((customer) => (
          <article key={customer.dcs} className="customerRow">
            <div>
              <RatingBadge rating={customer.rating} label={customer.ratingLabel} />
              <h4>{customer.name}</h4>
              <p>
                {customer.dcs} · {customer.phone} · {customer.area}
              </p>
            </div>
            <div className="balanceBox">
              <span>RCL</span>
              <strong>{formatInr(customer.rcl)}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

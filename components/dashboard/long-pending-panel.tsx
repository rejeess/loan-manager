import type { SessionUser } from "@/components/auth/session";

type OverdueItem = {
  dcs: string;
  name: string;
  product: string;
  daysLate: number;
  phone: string;
  message: string;
};

type LongPendingPanelProps = {
  user: SessionUser;
  items: OverdueItem[];
};

export function LongPendingPanel({ user, items }: LongPendingPanelProps) {
  return (
    <section className="panel widePanel" id="dashboard">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Follow-up queue</p>
          <h3>Long pending tracker</h3>
        </div>
        {user.role === "owner" ? (
          <button type="button" className="ghostButton">
            Export
          </button>
        ) : null}
      </div>
      <div className="tableLike" role="table" aria-label="Overdue customers">
        {items.map((item) => (
          <div className="tableRow" role="row" key={item.dcs}>
            <span>{item.dcs}</span>
            <strong>{item.name}</strong>
            <span>{item.product}</span>
            <span>{item.daysLate} days late</span>
            <a href={`https://wa.me/${item.phone}?text=${encodeURIComponent(item.message)}`}>WhatsApp</a>
            <a href={`tel:${item.phone}`}>Call</a>
          </div>
        ))}
      </div>
    </section>
  );
}

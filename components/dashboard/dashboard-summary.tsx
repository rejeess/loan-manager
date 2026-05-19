import type { SessionUser } from "@/components/auth/session";
import { formatInr } from "@/components/domain/currency";

type DashboardSummaryProps = {
  user: SessionUser;
  stats: {
    totalOut: number;
    yesterdayCollections: number;
    overdueCount: number;
    renewalReady: number;
  };
};

export function DashboardSummary({ user, stats }: DashboardSummaryProps) {
  return (
    <section className="heroBand" aria-label="Dashboard summary">
      <div>
        <p className="eyebrow">Total money out</p>
        <strong>{formatInr(stats.totalOut)}</strong>
        <span>{user.role === "owner" ? "Across permitted companies" : "Assigned company only"}</span>
      </div>
      <div>
        <p className="eyebrow">Yesterday collected</p>
        <strong>{formatInr(stats.yesterdayCollections)}</strong>
        <span>UPI and bank entries</span>
      </div>
      <div>
        <p className="eyebrow">Overdue</p>
        <strong>{stats.overdueCount}</strong>
        <span>Sorted by days late</span>
      </div>
      <div>
        <p className="eyebrow">Renewal ready</p>
        <strong>{stats.renewalReady}</strong>
        <span>{user.role === "owner" ? "Owner approval needed" : "Visible for follow-up"}</span>
      </div>
    </section>
  );
}

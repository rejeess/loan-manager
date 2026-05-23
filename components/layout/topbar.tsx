import Link from "next/link";
import type { SessionUser } from "@/components/auth/session";

type Company = { id: string; name: string; shortName: string };

type TopbarProps = {
  user: SessionUser;
  currentCompany: Company;
  allowedCompanies: Company[];
  onCompanyChange: (companyId: string) => void;
};

export function Topbar({ user, currentCompany, allowedCompanies, onCompanyChange }: TopbarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{user.role === "owner" ? "Owner dashboard" : "Clerk workspace"}</p>
        <h2>{currentCompany.name}</h2>
      </div>
      <div className="topActions">
        {allowedCompanies.length > 1 ? (
          <label className="companySwitch">
            <span>Company</span>
            <select
              value={currentCompany.id}
              aria-label="Company"
              onChange={(event) => onCompanyChange(event.target.value)}
            >
              {allowedCompanies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="companyLock">
            <span>Company</span>
            <strong>{currentCompany.shortName}</strong>
          </div>
        )}
        <Link href={`/loans/new?companyId=${currentCompany.id}`} className="primaryButton">
          New loan
        </Link>
      </div>
    </header>
  );
}

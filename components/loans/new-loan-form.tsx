"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createLoan } from "@/app/actions/loans";

type LoanProduct = "dp" | "wb" | "db" | "el";

const LOAN_TYPES: Record<string, ReadonlyArray<{ value: LoanProduct; label: string }>> = {
  jeevana: [
    { value: "dp", label: "DP – Daily Pathy" },
    { value: "wb", label: "WB – Weekly Block" },
    { value: "db", label: "DB – Daily Block" },
  ],
  phenix: [
    { value: "dp", label: "DP – Daily Pathy" },
    { value: "wb", label: "WB – Weekly Block" },
    { value: "el", label: "EL – Emergency Loan" },
  ],
};

function derivePeriodLabel(companyId: string, product: LoanProduct): string {
  if (product === "dp") return companyId === "jeevana" ? "100 days" : "50 days";
  if (product === "wb") return "Open-ended (weekly interest)";
  return "Open-ended (daily interest)";
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0] as string;
}

type NewLoanFormProps = {
  companyId: string;
  companyName: string;
  nextDcsNumber: number;
  userRole: "owner" | "clerk";
};

export function NewLoanForm({ companyId, companyName, nextDcsNumber }: NewLoanFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const products = LOAN_TYPES[companyId] ?? LOAN_TYPES["jeevana"]!;
  const defaultProduct = products[0]!.value;

  const [customerName, setCustomerName] = useState("");
  const [coApplicantName, setCoApplicantName] = useState("");
  const [phone, setPhone] = useState("");
  const [coApplicantPhone, setCoApplicantPhone] = useState("");
  const [area, setArea] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [amountRupees, setAmountRupees] = useState("");
  const [product, setProduct] = useState<LoanProduct>(defaultProduct);
  const [startDate, setStartDate] = useState(todayIso());

  const dcsPreview = `DCS${nextDcsNumber}`;
  const periodLabel = derivePeriodLabel(companyId, product);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createLoan({
        companyId,
        customerName,
        coApplicantName: coApplicantName || undefined,
        phone: `+91${phone}`,
        coApplicantPhone: coApplicantPhone ? `+91${coApplicantPhone}` : "",
        area: area || undefined,
        pinCode: pinCode || undefined,
        referredBy: referredBy || undefined,
        amountRupees: parseInt(amountRupees, 10),
        product,
        startDate,
      });

      if (result.success) {
        router.push("/");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="workspace">
      <div className="panel" style={{ maxWidth: 600 }}>
        <div className="panelHeader">
          <div>
            <p className="eyebrow">{companyName}</p>
            <h2 style={{ margin: 0 }}>New loan entry</h2>
          </div>
          <div className="readonlyField" style={{ fontWeight: 800, fontSize: "1.1rem" }}>
            {dcsPreview}
          </div>
        </div>

        <form className="loginForm" onSubmit={handleSubmit}>
          <fieldset style={{ border: "none", padding: 0, margin: 0, display: "contents" }}>
            <legend style={{ display: "none" }}>Customer details</legend>

            <label>
              Customer name
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                disabled={isPending}
                placeholder="Full name"
              />
            </label>

            <label>
              Co-applicant name <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span>
              <input
                type="text"
                value={coApplicantName}
                onChange={(e) => setCoApplicantName(e.target.value)}
                disabled={isPending}
                placeholder="Full name"
              />
            </label>

            <label>
              Phone number
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="readonlyField" style={{ whiteSpace: "nowrap", minWidth: "fit-content" }}>+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  required
                  disabled={isPending}
                  placeholder="9847000000"
                  pattern="[6-9]\d{9}"
                  title="Enter a valid 10-digit Indian mobile number"
                />
              </div>
            </label>

            <label>
              Co-applicant phone <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="readonlyField" style={{ whiteSpace: "nowrap", minWidth: "fit-content" }}>+91</span>
                <input
                  type="tel"
                  value={coApplicantPhone}
                  onChange={(e) => setCoApplicantPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  disabled={isPending}
                  placeholder="9847000000"
                  pattern="([6-9]\d{9})?"
                />
              </div>
            </label>

            <label>
              Place / Location <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                disabled={isPending}
                placeholder="e.g. Shornur Road"
              />
            </label>

            <label>
              Pin code <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span>
              <input
                type="text"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={isPending}
                placeholder="679121"
                pattern="\d{6}"
                title="6-digit pin code"
              />
            </label>

            <label>
              Referred by <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span>
              <input
                type="text"
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value)}
                disabled={isPending}
                placeholder="Name or DCS number"
              />
            </label>

            <label>
              Sanctioned amount (₹)
              <input
                type="number"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                required
                disabled={isPending}
                min={1}
                step={1}
                placeholder="50000"
              />
            </label>

            <label>
              Loan type
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value as LoanProduct)}
                disabled={isPending}
                required
              >
                {products.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Period
              <div className="readonlyField">{periodLabel}</div>
            </label>

            <label>
              Start date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={isPending}
              />
            </label>
          </fieldset>

          {error && <p className="formError">{error}</p>}

          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <button type="submit" className="primaryButton" disabled={isPending}>
              {isPending ? "Saving…" : "Save loan"}
            </button>
            <button
              type="button"
              className="ghostButton"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

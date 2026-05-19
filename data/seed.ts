export const companies = [
  {
    id: "jeevana",
    name: "Jeevana Loans",
    shortName: "Jeevana",
    nextDcs: "DCS111"
  },
  {
    id: "phenix",
    name: "Phenix Money & More",
    shortName: "Phenix",
    nextDcs: "DCS1239"
  }
];

export type UserRole = "owner" | "clerk";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  allowedCompanyIds: string[];
  defaultCompanyId: string;
};

export const users: MockUser[] = [
  {
    id: "owner-1",
    name: "Owner",
    email: "owner@loanmanager.local",
    role: "owner",
    allowedCompanyIds: ["jeevana", "phenix"],
    defaultCompanyId: "jeevana"
  },
  {
    id: "clerk-jeevana-1",
    name: "Jeevana Clerk",
    email: "clerk@loanmanager.local",
    role: "clerk",
    allowedCompanyIds: ["jeevana"],
    defaultCompanyId: "jeevana"
  }
];

export const dashboardStats = {
  totalOut: 1825000,
  yesterdayCollections: 148000,
  overdueCount: 9,
  renewalReady: 4
};

export const customers = [
  {
    dcs: "DCS111",
    name: "Anu Varghese",
    phone: "+91 98470 44120",
    area: "Shornur Road",
    rating: 5,
    ratingLabel: "Excellent",
    rcl: 100000
  },
  {
    dcs: "DCS112",
    name: "Rahim K",
    phone: "+91 87145 78355",
    area: "Pattambi",
    rating: 3,
    ratingLabel: "Average",
    rcl: 40000
  },
  {
    dcs: "DCS113",
    name: "Sreelatha P",
    phone: "+91 96560 11842",
    area: "Ottapalam",
    rating: 2,
    ratingLabel: "Risky",
    rcl: 25000
  }
];

export const products = [
  {
    code: "DP",
    name: "Daily Pathy",
    companyIds: ["jeevana", "phenix"],
    range: "₹25K-₹1L / ₹5K-₹40K",
    repayment: "Equal daily instalments"
  },
  {
    code: "WB",
    name: "Weekly Block",
    companyIds: ["jeevana", "phenix"],
    range: "₹10K-₹2.4L",
    repayment: "Weekly interest, principal stays"
  },
  {
    code: "DB",
    name: "Daily Block",
    companyIds: ["jeevana"],
    range: "₹50K-₹2L",
    repayment: "Daily interest, principal stays"
  },
  {
    code: "EL",
    name: "Emergency Loan",
    companyIds: ["phenix"],
    range: "Up to ₹1.2L",
    repayment: "₹25/day per ₹1,000"
  }
];

export const overdueItems = [
  {
    dcs: "DCS112",
    name: "Rahim K",
    product: "DP",
    daysLate: 4,
    phone: "918714578355",
    message: "Rahim, your DP payment is overdue. Please contact Jeevana Loans today."
  },
  {
    dcs: "DCS113",
    name: "Sreelatha P",
    product: "WB",
    daysLate: 9,
    phone: "919656011842",
    message: "Sreelatha, your weekly interest is pending. Please contact Jeevana Loans."
  }
];

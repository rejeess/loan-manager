export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "clerk";
  allowedCompanyIds: string[];
  defaultCompanyId: string;
};

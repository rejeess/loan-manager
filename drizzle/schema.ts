import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// ── Better Auth tables ────────────────────────────────────────────────────────

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// ── App tables ────────────────────────────────────────────────────────────────

export const companies = sqliteTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  shortName: text("shortName").notNull(),
  nextDcsNumber: integer("nextDcsNumber").notNull().default(1),
});

export const companyMemberships = sqliteTable("company_memberships", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  companyId: text("companyId")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["owner", "clerk"] }).notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("createdAt").notNull(),
});

export const customers = sqliteTable(
  "customers",
  {
    id: text("id").primaryKey(),
    companyId: text("companyId")
      .notNull()
      .references(() => companies.id, { onDelete: "restrict" }),
    dcsNumber: text("dcsNumber").notNull(),
    name: text("name").notNull(),
    coApplicantName: text("coApplicantName"),
    phone: text("phone"),
    coApplicantPhone: text("coApplicantPhone"),
    area: text("area"),
    pinCode: text("pinCode"),
    referredBy: text("referredBy"),
    rating: integer("rating").notNull().default(3),
    recoveryState: text("recoveryState", {
      enum: ["healthy", "watch", "follow_up", "recovery", "legal", "written_off"],
    })
      .notNull()
      .default("healthy"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  },
  (t) => [uniqueIndex("customers_company_dcs_unique").on(t.companyId, t.dcsNumber)]
);

export const passkeys = sqliteTable("passkeys", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name"),
  publicKey: text("publicKey").notNull(),
  counter: integer("counter").notNull().default(0),
  deviceType: text("deviceType").notNull(),
  backedUp: integer("backedUp", { mode: "boolean" }).notNull().default(false),
  transports: text("transports"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export const loans = sqliteTable("loans", {
  id: text("id").primaryKey(),
  companyId: text("companyId")
    .notNull()
    .references(() => companies.id, { onDelete: "restrict" }),
  customerId: text("customerId")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  product: text("product", { enum: ["dp", "wb", "db", "el"] }).notNull(),
  amountPaise: integer("amountPaise").notNull(),
  tenureDays: integer("tenureDays"),
  startDate: text("startDate").notNull(),
  status: text("status", { enum: ["active", "closed", "written_off"] })
    .notNull()
    .default("active"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

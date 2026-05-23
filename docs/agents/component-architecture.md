# Component Architecture

Loan Manager should stay component-based as features grow. Pages should compose behavior and data, while reusable components own presentation.

## Current Structure

- `components/auth/`: login/session gate and temporary mock session logic.
- `components/layout/`: app shell pieces like sidebar and topbar.
- `components/dashboard/`: dashboard panels and workflow sections.
- `components/domain/`: reusable business UI such as rating badges and currency formatting.
- `data/seed.ts`: temporary mock fixtures, shaped for replacement by Drizzle-backed query helpers.

## Rules For New UI

- Keep route files thin. A route should assemble providers, data, and major sections.
- Put repeated visual patterns in `components/domain/`.
- Put page-specific sections in a feature folder, for example `components/customers/` or `components/loans/`.
- Keep business calculations out of components. Use `lib/domain/` once those rules are implemented.
- Keep database access out of components. Use Server Actions or `lib/db/`.
- Prefer typed props over reaching into global state from every component.

## Suggested Next Folders

- `components/customers/`
- `components/loans/`
- `components/payments/`
- `components/reports/`
- `lib/domain/`
- `lib/db/`
- `lib/schemas/`


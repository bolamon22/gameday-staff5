# UI components & design standard

Shared primitives for a consistent look across the app. Prefer these over ad-hoc markup.

- `Card` — standard white surface (border + rounded-xl). Optional `href`/`onClick` adds hover.
- `SectionHeader` — small uppercase section label.
- `StatCard` — metric tile (number + label + optional sub + optional link).
- `ActionButton` — pill button with optional lucide icon (`primary` = teal, `secondary` = neutral).

## Standard
- Icons: lucide-react only — never emoji.
- Palette: neutral slate base, teal as the single accent; semantic green / red / amber only for meaning (money, status).
- Cards: `bg-white border border-slate-200 rounded-xl` — one consistent radius and hover.
- Section labels via `SectionHeader`.

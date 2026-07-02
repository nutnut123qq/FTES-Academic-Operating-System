## Layout — balance hero + ledger (single-column shell)

Wallet is a read-first surface: one number that matters (balance) then the trail of
how it changed. Mirror the house shell column rather than re-brainstorm:
- `mx-auto max-w-6xl p-6` column; title + subtitle.
- **Balance hero card** — `rounded-large border border-separator bg-accent/5 p-6`. Big
  accent balance (`toLocaleString`) + `coin` unit + `WalletIcon` chip; below it a row of
  action buttons (`topup` = primary, `transfer`/`redeem` = secondary). Actions are mock
  (no `onPress` logic) — top-up/transfer/redeem land when the BE wallet contract exists.
- **Transaction history** — bordered list, `divide-y divide-separator`. Each row: kind
  icon in a success/danger tinted square (credit vs debit), description + `kind · date`
  caption, and a signed amount (`+`/`−`) colored `text-success`/`text-danger`,
  `tabular-nums` so columns align.
- Empty state (dashed border card + coin icon + `wallet.empty`) when the ledger is empty.

## Data
`useQueryWalletSwr` — mock `{ balance, transactions }`, SWR-shaped. `WalletTransaction`
carries a **pre-signed** `amount` (receive/refund > 0, transfer/purchase < 0) and a
`kind ∈ receive|transfer|purchase|refund` that drives both the icon and (via sign) the
color. `ponytail:` note marks the BE swap point; hook API stays stable.

## Icons (phosphor v2, `*Icon` exports)
`WalletIcon`, `CoinsIcon` (redeem/empty), `PlusIcon` (top-up), `ArrowUpIcon` (transfer
action). Row kind icons: `ArrowDownIcon` (receive), `ArrowsLeftRightIcon` (transfer),
`ShoppingBagIcon` (purchase), `ArrowClockwiseIcon` (refund).

## Not doing
- No real money movement — top-up/transfer/redeem are placeholder buttons; no BE.
- No filters/pagination/date grouping (8 mock rows) — add when the ledger grows.
- No nav wiring / path builder here (shared-file edits out of scope for this shell).

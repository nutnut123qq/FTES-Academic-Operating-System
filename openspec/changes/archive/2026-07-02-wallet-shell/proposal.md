## Why

`/wallet` was 404 — §12 Wallet & FTES Coin (the in-app currency students earn from
streaks/rewards and spend to unlock course content) had no surface at all. Students
had no way to see their FTES Coin balance or where the coins went. This ships the
wallet shell (Phase 1): balance + transaction history as a real 200 route.

## What Changes

- Add `features/wallet/WalletShell` + `[locale]/wallet/page.tsx`: a hero balance card
  (FTES Coin, accent) + mock action buttons (top-up / transfer / redeem, no logic yet)
  + a signed, color-coded transaction history list.
- Add `useQueryWalletSwr` (mock balance + ~8-row ledger, SWR-shaped for a BE swap).
- Add `wallet.*` i18n (vi/en): title/subtitle/balance/actions/history/kinds/empty.

## Capabilities

### New Capabilities
- `wallet-shell`: the Wallet & FTES Coin surface at `/wallet` (balance + history).

### Modified Capabilities
- (none)

## Impact
- FE: new `features/wallet/WalletShell`, `wallet/page.tsx`, `useQueryWalletSwr`; new
  `wallet.*` i18n. No BE (mock — `ponytail:` marks the swap point). No shared-file edits
  beyond i18n. Build green.

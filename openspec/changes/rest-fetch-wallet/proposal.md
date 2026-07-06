## Why

The shared REST client (`restRequest`) already serves `challenges`, `course`, `subject`, `identity`, `commerce`, `community`, `resource`, `gamification`, `notification`, and `profile`. The wallet domain exposes two REST controllers in `vn.ftes.aos.wallet.web` — `WalletController` for user-facing wallet operations and `WalletAdminController` for admin wallet reads and adjustments. There are no equivalent GraphQL operations for wallet balance, transactions, transfers, gifts, vouchers, referrals, or admin adjustments, so the frontend currently has no typed data layer for any of these features.

## What Changes

- Reuse `src/modules/api/rest/client/` (`restRequest`, envelope unwrap, bearer token) from previous changes.
- Add a typed REST client under `src/modules/api/rest/wallet/` covering:
  - `WalletController` — wallet balance, transaction history, transfers, gifts, voucher redemption, referral code.
  - `WalletAdminController` — user wallet lookup, admin transaction search, audited balance adjustments.
- Add `usePost*Swr` mutation hooks for every writing REST endpoint.
- Add `useGet*Swr` query hooks for read endpoints.
- Update `src/modules/api/rest/index.ts` to re-export `./wallet`.
- No new dependencies; no changes to backend or other modules.

## Capabilities

### New Capabilities
- `rest-fetch-wallet`: REST client + SWR wrappers for the wallet controller cluster.

### Modified Capabilities
- None.

## Impact

- New files in `src/modules/api/rest/wallet/` and `src/hooks/swr/api/rest/mutations/` (plus query hooks in `src/hooks/swr/api/rest/queries/`).
- One-line change to `src/modules/api/rest/index.ts`.
- No runtime impact until components import the new hooks.

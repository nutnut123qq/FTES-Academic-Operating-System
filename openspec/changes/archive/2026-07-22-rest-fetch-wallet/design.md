## Context

The shared REST client (`restRequest`) already powers `challenges`, `course`, `subject`, `identity`, `commerce`, `community`, `resource`, `gamification`, `notification`, and `profile`. The backend wallet domain in `vn.ftes.aos.wallet.web` exposes two REST controllers:

- `WalletController` — `/api/v1/wallet/**` (user-scoped reads and writes).
- `WalletAdminController` — `/api/v1/wallet/admin/**` (admin reads and adjustments).

The frontend has no GraphQL operations that overlap with the wallet surface. `queryMyRewardWallet` covers reward points (điểm quà), which is a separate domain from the coin wallet; it is therefore not a duplicate and does not cause any wallet REST endpoints to be skipped.

## Goals / Non-Goals

**Goals:**
- Add typed REST clients in `src/modules/api/rest/wallet/` for all wallet endpoints.
- Add SWR mutation wrappers for every writing REST endpoint.
- Add SWR query wrappers for every read REST endpoint.
- Update `src/modules/api/rest/index.ts` to re-export `./wallet`.
- Pass `npx tsc --noEmit` and `npm run build` (webpack).

**Non-Goals:**
- Do not recreate the shared REST client; reuse `src/modules/api/rest/client/`.
- Do not add UI components or pages.
- Do not add new dependencies or backend changes.

## Decisions

### 1. Reuse `restRequest` without modification
**Rationale:** The wrapper already handles base URL, bearer token, envelope unwrap, and error mapping. Wallet needs no special envelope handling.

### 2. Group clients in `src/modules/api/rest/wallet/`
**Rationale:** Mirrors the backend package `wallet.web` and keeps the module boundary clear, consistent with previous domains.

### 3. Expose all wallet endpoints via REST
**Rationale:** No GraphQL operations exist for wallet balance, transactions, transfers, gifts, vouchers, referrals, or admin adjustments. Every endpoint in both controllers is implemented.

### 4. Read endpoints get SWR query hooks
**Rationale:** `getMyWallet`, `getMyTransactions`, `getMyReferral`, `getUserWallet`, and `listAdminTransactions` are reads. They get `useGet*Swr` query hooks.

### 5. Types inferred from `WalletDtos.java`
**Rationale:** These records are the backend source of truth. We mirror them using TypeScript interfaces, using `string` for UUIDs and ISO timestamps. `PageView<T>` is renamed to `WalletPageView<T>` to avoid a collision with the existing `PageView<T>` from the commerce module.

## Risks / Trade-offs

- **[Risk]** The wallet module is the canonical data layer for coin balance and transactions. Until components adopt these hooks, wallet features remain unimplemented on the frontend.
- **[Risk]** Admin adjustment requires `wallet.adjust`; callers must ensure admin UIs hold the appropriate permission.
- **[Trade-off]** We expose both user and admin transaction list endpoints even though they return the same `TransactionView`. Separate functions keep the user/admin boundary explicit.

## Affected Files / Modules

- `src/modules/api/rest/wallet/types.ts`
- `src/modules/api/rest/wallet/wallet.ts`
- `src/modules/api/rest/wallet/index.ts`
- `src/modules/api/rest/index.ts`
- `src/hooks/swr/api/rest/mutations/usePost*.ts`
- `src/hooks/swr/api/rest/mutations/index.ts`
- `src/hooks/swr/api/rest/queries/useGet*.ts`
- `src/hooks/swr/api/rest/queries/index.ts`

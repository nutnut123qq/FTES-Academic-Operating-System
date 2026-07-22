## ADDED Requirements

### Requirement: Wallet REST client reuses the shared REST wrapper
The wallet REST client SHALL import `restRequest` from `src/modules/api/rest/client/` and SHALL NOT create its own axios instance or envelope handling.

#### Scenario: Client uses the shared wrapper
- **WHEN** any wallet REST function issues a request
- **THEN** it routes through `restRequest` and inherits the shared bearer + envelope unwrap behaviour

### Requirement: WalletController endpoints are exposed via REST
The wallet REST client SHALL expose typed functions for all `WalletController` endpoints.

#### Scenario: Get my wallet
- **WHEN** `getMyWallet()` is called
- **THEN** it performs `GET /api/v1/wallet/me` and returns `WalletView`

#### Scenario: Get my transactions
- **WHEN** `getMyTransactions(params)` is called
- **THEN** it performs `GET /api/v1/wallet/me/transactions?type=&from=&to=&page=&size=` and returns `WalletPageView<TransactionView>`

#### Scenario: Create transfer
- **WHEN** `createTransfer(request)` is called
- **THEN** it performs `POST /api/v1/wallet/transfers` with `TransferRequest` and returns `TransferView`

#### Scenario: Confirm transfer
- **WHEN** `confirmTransfer(id)` is called
- **THEN** it performs `POST /api/v1/wallet/transfers/{id}/confirm` and returns `TransferView`

#### Scenario: Cancel transfer
- **WHEN** `cancelTransfer(id)` is called
- **THEN** it performs `POST /api/v1/wallet/transfers/{id}/cancel` and returns `TransferView`

#### Scenario: Gift coins
- **WHEN** `gift(request)` is called
- **THEN** it performs `POST /api/v1/wallet/gifts` with `GiftRequest` and returns `TransferView`

#### Scenario: Redeem voucher
- **WHEN** `redeemVoucher(request)` is called
- **THEN** it performs `POST /api/v1/wallet/vouchers/redeem` with `RedeemVoucherRequest` and returns `string`

#### Scenario: Get my referral
- **WHEN** `getMyReferral()` is called
- **THEN** it performs `GET /api/v1/wallet/referrals/me` and returns `ReferralView`

#### Scenario: Apply referral code
- **WHEN** `applyReferralCode(request)` is called
- **THEN** it performs `POST /api/v1/wallet/referrals/apply` with `ApplyReferralRequest` and resolves with `void`

### Requirement: WalletAdminController endpoints are exposed via REST
The wallet REST client SHALL expose typed functions for all `WalletAdminController` endpoints.

#### Scenario: Get user wallet
- **WHEN** `getUserWallet(userId)` is called
- **THEN** it performs `GET /api/v1/wallet/admin/wallets/{userId}` and returns `WalletView`

#### Scenario: List admin transactions
- **WHEN** `listAdminTransactions(params)` is called
- **THEN** it performs `GET /api/v1/wallet/admin/transactions?type=&from=&to=&page=&size=` and returns `WalletPageView<TransactionView>`

#### Scenario: Adjust wallet
- **WHEN** `adjustWallet(request)` is called
- **THEN** it performs `POST /api/v1/wallet/admin/adjustments` with `AdjustmentRequest` and returns `AdjustmentView`

### Requirement: SWR mutation wrappers exist for every writing endpoint
For every POST profile REST function, a corresponding `usePost*Swr` hook SHALL exist in `src/hooks/swr/api/rest/mutations/` following the existing naming and generic pattern.

#### Scenario: Use create transfer hook
- **WHEN** a component calls `usePostCreateTransferSwr().trigger(request)`
- **THEN** the hook invokes `createTransfer(request)` through `useSWRMutation`

#### Scenario: Use confirm transfer hook
- **WHEN** a component calls `usePostConfirmTransferSwr().trigger(id)`
- **THEN** the hook invokes `confirmTransfer(id)` through `useSWRMutation`

#### Scenario: Use cancel transfer hook
- **WHEN** a component calls `usePostCancelTransferSwr().trigger(id)`
- **THEN** the hook invokes `cancelTransfer(id)` through `useSWRMutation`

#### Scenario: Use gift hook
- **WHEN** a component calls `usePostGiftSwr().trigger(request)`
- **THEN** the hook invokes `gift(request)` through `useSWRMutation`

#### Scenario: Use redeem voucher hook
- **WHEN** a component calls `usePostRedeemVoucherSwr().trigger(request)`
- **THEN** the hook invokes `redeemVoucher(request)` through `useSWRMutation`

#### Scenario: Use apply referral code hook
- **WHEN** a component calls `usePostApplyReferralCodeSwr().trigger(request)`
- **THEN** the hook invokes `applyReferralCode(request)` through `useSWRMutation`

#### Scenario: Use adjust wallet hook
- **WHEN** a component calls `usePostAdjustWalletSwr().trigger(request)`
- **THEN** the hook invokes `adjustWallet(request)` through `useSWRMutation`

### Requirement: SWR query wrappers exist for read endpoints
For every GET wallet REST function, a corresponding `useGet*Swr` hook SHALL exist in `src/hooks/swr/api/rest/queries/`.

#### Scenario: Use get my wallet hook
- **WHEN** a component calls `useGetMyWalletSwr()`
- **THEN** the hook invokes `getMyWallet()` through `useSWR`

#### Scenario: Use get my transactions hook
- **WHEN** a component calls `useGetMyTransactionsSwr(params)`
- **THEN** the hook invokes `getMyTransactions(params)` through `useSWR`

#### Scenario: Use get my referral hook
- **WHEN** a component calls `useGetMyReferralSwr()`
- **THEN** the hook invokes `getMyReferral()` through `useSWR`

#### Scenario: Use get user wallet hook
- **WHEN** a component calls `useGetUserWalletSwr(userId)`
- **THEN** the hook invokes `getUserWallet(userId)` through `useSWR`

#### Scenario: Use list admin transactions hook
- **WHEN** a component calls `useGetAdminTransactionsSwr(params)`
- **THEN** the hook invokes `listAdminTransactions(params)` through `useSWR`

### Requirement: Wallet module is re-exported from the REST barrel
The REST barrel `src/modules/api/rest/index.ts` SHALL re-export the wallet module so consumers import it from the shared entry point.

#### Scenario: Barrel re-exports wallet
- **WHEN** `src/modules/api/rest/index.ts` is updated
- **THEN** it adds `export * from "./wallet"` alongside existing module exports

## 1. Wallet REST types

- [ ] 1.1 Create `src/modules/api/rest/wallet/types.ts` with request/response interfaces inferred from backend `WalletDtos.java`. Rename `PageView<T>` to `WalletPageView<T>` to avoid collision.

## 2. Wallet REST client

- [ ] 2.1 Create `src/modules/api/rest/wallet/wallet.ts` exporting REST functions for all endpoints in `WalletController` and `WalletAdminController`.
- [ ] 2.2 Create `src/modules/api/rest/wallet/index.ts` barrel re-exporting types and functions.
- [ ] 2.3 Update `src/modules/api/rest/index.ts` to add `export * from "./wallet"`.

### Endpoint mapping

**WalletController:**
- `getMyWallet`, `getMyTransactions`, `createTransfer`, `confirmTransfer`, `cancelTransfer`, `gift`, `redeemVoucher`, `getMyReferral`, `applyReferralCode`

**WalletAdminController:**
- `getUserWallet`, `listAdminTransactions`, `adjustWallet`

## 3. SWR mutation wrappers

- [ ] 3.1 Create `usePostCreateTransferSwr.ts`
- [ ] 3.2 Create `usePostConfirmTransferSwr.ts`
- [ ] 3.3 Create `usePostCancelTransferSwr.ts`
- [ ] 3.4 Create `usePostGiftSwr.ts`
- [ ] 3.5 Create `usePostRedeemVoucherSwr.ts`
- [ ] 3.6 Create `usePostApplyReferralCodeSwr.ts`
- [ ] 3.7 Create `usePostAdjustWalletSwr.ts`
- [ ] 3.8 Update `src/hooks/swr/api/rest/mutations/index.ts` to re-export all new mutation hooks.

## 4. SWR query wrappers

- [ ] 4.1 Create `useGetMyWalletSwr.ts`
- [ ] 4.2 Create `useGetMyTransactionsSwr.ts`
- [ ] 4.3 Create `useGetMyReferralSwr.ts`
- [ ] 4.4 Create `useGetUserWalletSwr.ts`
- [ ] 4.5 Create `useGetAdminTransactionsSwr.ts`
- [ ] 4.6 Update `src/hooks/swr/api/rest/queries/index.ts` to re-export all new query hooks.

## 5. Verification

- [ ] 5.1 Run `npx tsc --noEmit` and fix type errors.
- [ ] 5.2 Run `npm run build` (webpack) and ensure a green build.

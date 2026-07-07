/**
 * Request/response DTOs for the wallet REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.wallet.web.dto.WalletDtos`.
 */

/** Generic paginated view used by the wallet domain. */
export interface WalletPageView<T> {
    items: Array<T>
    page: number
    totalElements: number
}

/** Wallet balance and status. */
export interface WalletView {
    walletId: string
    balance: number
    status: string
}

/** One wallet transaction. */
export interface TransactionView {
    id: string
    type: string
    status: string
    amount: number
    direction: string
    counterparty: string
    /** Free-text note; `null` when the BE has none (e.g. system-generated entries). */
    memo: string | null
    createdAt: string
}

/** Transfer/gift result. */
export interface TransferView {
    transactionId: string
    status: string
    expiresAt: string | null
}

/** Referral summary for the current user. */
export interface ReferralView {
    referralCode: string
    referredCount: number
    totalBonus: number
}

/** Admin adjustment result. */
export interface AdjustmentView {
    transactionId: string
    balanceAfter: number
}

/** Body sent to `POST /api/v1/wallet/transfers`. */
export interface TransferRequest {
    recipientUserId?: string | null
    recipientReferralCode?: string | null
    amount: number
    memo?: string | null
    idempotencyKey: string
}

/** Body sent to `POST /api/v1/wallet/gifts`. */
export interface GiftRequest {
    recipientUserId: string
    amount: number
    message?: string | null
    idempotencyKey: string
}

/** Body sent to `POST /api/v1/wallet/vouchers/redeem`. */
export interface RedeemVoucherRequest {
    voucherProductId: string
    idempotencyKey: string
}

/** Body sent to `POST /api/v1/wallet/referrals/apply`. */
export interface ApplyReferralRequest {
    referralCode: string
}

/** Body sent to `POST /api/v1/wallet/admin/adjustments`. */
export interface AdjustmentRequest {
    userId: string
    amount: number
    direction: string
    reason: string
    idempotencyKey: string
}

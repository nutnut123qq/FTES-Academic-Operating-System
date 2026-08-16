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
    /**
     * VND per one coin (BE `vndPerCoin`). Optional so a BE that predates the
     * top-up contract still type-checks; call sites must fall back rather than
     * render a bogus "0₫" conversion.
     */
    vndPerCoin?: number
    /** `balance × vndPerCoin`, precomputed by the BE. */
    balanceVnd?: number
}

/**
 * One purchasable top-up pack — `GET /api/v1/wallet/topup/packs`.
 *
 * An EMPTY array is a legitimate answer (nothing on sale, or every pack hidden
 * because its price drifted from the conversion rate); it is not an error.
 */
export interface TopupPackView {
    productId: string
    slug: string
    name: string
    description: string
    /** Coins credited once the bank confirms the transfer. */
    coinAmount: number
    /** Price in VND. */
    priceVnd: number
}

/**
 * Result of `POST /api/v1/wallet/topup/orders`.
 *
 * The coins are NOT in the wallet yet: they land only after the bank webhook
 * flips the order to PAID, so the caller must poll the commerce order.
 */
export interface TopupOrderView {
    orderId: string
    amountVnd: number
    /** VietQR EMVCo payload to render as a QR image. */
    qrCode: string
    status: string
}

/** Body sent to `POST /api/v1/wallet/topup/orders`. */
export interface TopupOrderRequest {
    productId: string
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

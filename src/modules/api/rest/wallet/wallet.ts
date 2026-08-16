import { restRequest } from "@/modules/api/rest/client"
import type {
    AdjustmentRequest,
    AdjustmentView,
    ApplyReferralRequest,
    GiftRequest,
    RedeemVoucherRequest,
    ReferralView,
    TopupOrderRequest,
    TopupOrderView,
    TopupPackView,
    TransactionView,
    TransferRequest,
    TransferView,
    WalletPageView,
    WalletView,
} from "./types"

// ---------------------------------------------------------------- WalletController

/**
 * Returns the current user's wallet.
 *
 * `GET /api/v1/wallet/me`
 */
export const getMyWallet = async (): Promise<WalletView> => {
    return restRequest<WalletView>({
        method: "GET",
        url: "/wallet/me",
        authenticated: true,
    })
}

/**
 * Returns the current user's transaction history.
 *
 * `GET /api/v1/wallet/me/transactions?type=&from=&to=&page=&size=`
 */
export const getMyTransactions = async (params?: {
    type?: string | null
    from?: string | null
    to?: string | null
    page?: number
    size?: number
}): Promise<WalletPageView<TransactionView>> => {
    return restRequest<WalletPageView<TransactionView>>({
        method: "GET",
        url: "/wallet/me/transactions",
        authenticated: true,
        params: {
            type: params?.type ?? undefined,
            from: params?.from ?? undefined,
            to: params?.to ?? undefined,
            page: params?.page ?? 0,
            size: params?.size ?? 20,
        },
    })
}

/**
 * Lists the purchasable top-up packs.
 *
 * `GET /api/v1/wallet/topup/packs`
 *
 * An empty array means nothing is on sale right now (or every pack is hidden
 * because its price no longer matches the conversion rate) — a normal answer,
 * which the top-up surface renders as an empty state rather than an error.
 */
export const getTopupPacks = async (): Promise<Array<TopupPackView>> => {
    return restRequest<Array<TopupPackView>>({
        method: "GET",
        url: "/wallet/topup/packs",
        authenticated: true,
    })
}

/**
 * Opens a top-up order for one pack and returns the VietQR payload to pay it.
 *
 * `POST /api/v1/wallet/topup/orders`
 *
 * MONEY PATH: coins are credited only after the bank webhook marks the order
 * paid, so the caller must poll `GET /commerce/orders/{orderId}` until the
 * status settles instead of assuming success on the 200 here. Pressing the
 * button twice returns the SAME pending order (the BE reuses it), so a double
 * click cannot open two orders — but the caller still guards its own button so
 * the user is never shown two QR codes.
 */
export const createTopupOrder = async (
    request: TopupOrderRequest,
): Promise<TopupOrderView> => {
    return restRequest<TopupOrderView>({
        method: "POST",
        url: "/wallet/topup/orders",
        authenticated: true,
        data: request,
    })
}

/**
 * Creates a coin transfer to another user.
 *
 * `POST /api/v1/wallet/transfers`
 */
export const createTransfer = async (
    request: TransferRequest,
): Promise<TransferView> => {
    return restRequest<TransferView>({
        method: "POST",
        url: "/wallet/transfers",
        data: request,
    })
}

/**
 * Confirms a pending transfer.
 *
 * `POST /api/v1/wallet/transfers/{id}/confirm`
 */
export const confirmTransfer = async (id: string): Promise<TransferView> => {
    return restRequest<TransferView>({
        method: "POST",
        url: `/wallet/transfers/${id}/confirm`,
    })
}

/**
 * Cancels a pending transfer.
 *
 * `POST /api/v1/wallet/transfers/{id}/cancel`
 */
export const cancelTransfer = async (id: string): Promise<TransferView> => {
    return restRequest<TransferView>({
        method: "POST",
        url: `/wallet/transfers/${id}/cancel`,
    })
}

/**
 * Gifts coins to another user.
 *
 * `POST /api/v1/wallet/gifts`
 */
export const gift = async (request: GiftRequest): Promise<TransferView> => {
    return restRequest<TransferView>({
        method: "POST",
        url: "/wallet/gifts",
        data: request,
    })
}

/**
 * Redeems a voucher product for coins.
 *
 * `POST /api/v1/wallet/vouchers/redeem`
 */
export const redeemVoucher = async (
    request: RedeemVoucherRequest,
): Promise<string> => {
    return restRequest<string>({
        method: "POST",
        url: "/wallet/vouchers/redeem",
        data: request,
    })
}

/**
 * Returns the current user's referral summary.
 *
 * `GET /api/v1/wallet/referrals/me`
 */
export const getMyReferral = async (): Promise<ReferralView> => {
    return restRequest<ReferralView>({
        method: "GET",
        url: "/wallet/referrals/me",
        authenticated: true,
    })
}

/**
 * Applies a referral code for the current user.
 *
 * `POST /api/v1/wallet/referrals/apply`
 */
export const applyReferralCode = async (
    request: ApplyReferralRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: "/wallet/referrals/apply",
        data: request,
    })
}

// ---------------------------------------------------------------- WalletAdminController

/**
 * Returns a user's wallet (admin).
 *
 * `GET /api/v1/wallet/admin/wallets/{userId}`
 */
export const getUserWallet = async (userId: string): Promise<WalletView> => {
    return restRequest<WalletView>({
        method: "GET",
        url: `/wallet/admin/wallets/${userId}`,
        authenticated: true,
    })
}

/**
 * Searches transactions across all wallets (admin).
 *
 * `GET /api/v1/wallet/admin/transactions?type=&from=&to=&page=&size=`
 */
export const listAdminTransactions = async (params?: {
    type?: string | null
    from?: string | null
    to?: string | null
    page?: number
    size?: number
}): Promise<WalletPageView<TransactionView>> => {
    return restRequest<WalletPageView<TransactionView>>({
        method: "GET",
        url: "/wallet/admin/transactions",
        authenticated: true,
        params: {
            type: params?.type ?? undefined,
            from: params?.from ?? undefined,
            to: params?.to ?? undefined,
            page: params?.page ?? 0,
            size: params?.size ?? 20,
        },
    })
}

/**
 * Performs an audited balance adjustment for a user (admin).
 *
 * `POST /api/v1/wallet/admin/adjustments`
 */
export const adjustWallet = async (
    request: AdjustmentRequest,
): Promise<AdjustmentView> => {
    return restRequest<AdjustmentView>({
        method: "POST",
        url: "/wallet/admin/adjustments",
        data: request,
    })
}

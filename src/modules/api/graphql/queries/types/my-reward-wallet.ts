import type { GraphQLResponse } from "../../types"

/** A single past redemption in the viewer's reward wallet. */
export interface QueryMyRewardWalletRedemptionData {
    /** Key of the redeemed reward. */
    rewardKey: string
    /** Display title at the time of redemption. */
    title: string
    /** Cost in điểm quà paid for this redemption. */
    cost: number
    /** Fulfilment status — `granted` / `pending` / `fulfilled`. */
    status: string
    /** ISO timestamp the redemption was created. */
    createdAt: string
}

/** Payload inside `myRewardWallet.data` after the standard API wrapper. */
export interface QueryMyRewardWalletData {
    /** Current spendable điểm quà balance. */
    balance: number
    /** Lifetime điểm quà spent. */
    spent: number
    /** Past redemptions, newest first. */
    redemptions: QueryMyRewardWalletRedemptionData[]
}

/** Apollo response shape for the `myRewardWallet` query. */
export interface QueryMyRewardWalletResponse {
    /** Top-level `myRewardWallet` field wrapping the standard API response. */
    myRewardWallet: GraphQLResponse<QueryMyRewardWalletData>
}

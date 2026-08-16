import type { GraphQLResponse } from "../../types"

/** The membership plan currently on sale (a `commerce.products` row), if any. */
export interface MembershipOffer {
    /** Product slug — the id of the plan on the backend. */
    slug: string
    /** Display name of the plan. */
    displayName: string
    /** Short description; null when the product has none. */
    description?: string | null
    /**
     * Price in VND that will actually be charged. Null when the product carries no VND
     * price — the screen must NOT invent one.
     */
    priceVnd?: number | null
    /** Days each purchase adds to the membership expiry (`fulfillment_config.durationDays`). */
    durationDays: number
}

/** Payload inside `myMembership.data` after the standard API wrapper. */
export interface MyMembershipData {
    /** Effective plan code of the viewer, already normalised to `FREE` once expired. */
    plan: string
    /** True while a paid membership is in effect. */
    active: boolean
    /** Expiry (ISO-8601); null on FREE or for a plan that does not expire. */
    expiresAt?: string | null
    /**
     * The membership plan on sale, or null when operations has not published one — the
     * screen then shows an honest empty state instead of a buy button that cannot work.
     */
    offer?: MembershipOffer | null
}

/** Apollo response shape for the `myMembership` query. */
export interface QueryMyMembershipResponse {
    /** Top-level `myMembership` field wrapping the standard API response. */
    myMembership: GraphQLResponse<MyMembershipData>
}

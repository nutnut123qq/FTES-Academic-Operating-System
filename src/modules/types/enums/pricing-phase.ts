/**
 * Tier key for course pricing (matches GraphQL `GraphQLTypePricingPhase` / DB `phase`).
 */
export enum PricingPhase {
    /** Earliest-adopter tier — lowest price, most limited slots. */
    Pioneer = "pioneer",
    /** Second-wave tier — discounted price, limited slots. */
    EarlyBird = "earlyBird",
    /** Standard public price — unlimited slots. */
    Regular = "regular",
}

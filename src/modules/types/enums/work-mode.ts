/**
 * Preferred work arrangement a user advertises on their profile (GraphQL / DB
 * enum). Pairs with the "open to work" flag for recruiter-facing context.
 */
export enum WorkMode {
    /** Prefers fully remote work. */
    Remote = "remote",
    /** Prefers a hybrid (mixed remote / on-site) arrangement. */
    Hybrid = "hybrid",
    /** Prefers working on-site. */
    Onsite = "onsite",
}

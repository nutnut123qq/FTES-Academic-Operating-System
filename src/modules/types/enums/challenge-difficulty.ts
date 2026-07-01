/**
 * Relative difficulty for a module challenge (GraphQL / DB enum).
 */
export enum ChallengeDifficulty {
    /** Beginner-friendly — minimal prerequisites, straightforward implementation. */
    Easy = "easy",
    /** Moderate complexity — requires understanding of core concepts. */
    Medium = "medium",
    /** Difficult — non-trivial design decisions and deeper domain knowledge required. */
    Hard = "hard",
    /** Extremely difficult — advanced architecture or algorithm knowledge needed. */
    Insane = "insane",
    /** Expert tier — the hardest, mastery-level challenges. */
    Expert = "expert",
}

/**
 * Traffic-light liveness of one infrastructure component on the public status
 * page (mirrors backend `ComponentStatus`). Reachable + fast is `up`, reachable
 * but slow is `degraded`, unreachable is `down`.
 */
export enum ComponentStatus {
    /** Reachable and responsive. */
    Up = "up",
    /** Reachable but slow / partially impaired. */
    Degraded = "degraded",
    /** Unreachable. */
    Down = "down",
}

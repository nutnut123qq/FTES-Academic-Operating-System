/**
 * Lifecycle status of one API key in the AI balancer pool (mirrors backend `KeyStatus`).
 */
export enum AiBalancerKeyStatus {
    /** Healthy — eligible for rotation. */
    Active = "active",
    /** Unhealthy — skipped until ping or a successful call restores cache. */
    Disabled = "disabled",
    /** Probationary recovery slot (not used for normal rotation). */
    Probing = "probing",
}

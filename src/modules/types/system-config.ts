/** Nested challenge configuration within the system config payload. */
export interface SystemConfigChallengeData {
    /** Minimum score (0–1) required to pass a challenge. */
    passThreshold: number
}

/** Nested task configuration within the system config payload. */
export interface SystemConfigTaskData {
    /** Minimum score (0–1) required to pass a personal project task. */
    passThreshold: number
}

/** Free Auto-lane caps from `systemConfig.ai.auto` (mounted `app.yaml`). */
export interface SystemConfigAiAutoData {
    /** Max complimentary gradings per rolling 5-hour window. */
    usesPer5h: number
    /** Max complimentary gradings per rolling 7-day window. */
    usesPerWeek: number
    /** Max Auto credits per rolling 5-hour window. */
    creditsPer5h: number
    /** Max Auto credits per rolling 7-day window. */
    creditsPerWeek: number
    /** Credits charged per Auto grading. */
    creditCost: number
}

/** AI section of mounted `systemConfig`. */
export interface SystemConfigAiData {
    /** Free Auto lane caps. */
    auto: SystemConfigAiAutoData
}

/** Mounted `systemConfig` payload (GraphQL: `systemConfig.data`). */
export interface SystemConfigData {
    /** Challenge-specific system configuration. */
    challenge: SystemConfigChallengeData
    /** Personal project task configuration. */
    task: SystemConfigTaskData
    /** AI quota caps (Auto lane). */
    ai: SystemConfigAiData
}

/**
 * FE-side defaults for `systemConfig`.
 *
 * The real BE (FTES) has NO public `systemConfig` query — only an admin-scoped
 * `systemConfigurations`. So these values are served locally instead of hitting the
 * BE. `passThreshold` mirrors the 0.8 default already used by the challenge
 * submission flow; the AI Auto-lane caps are sane placeholders (no consumer reads
 * them yet). Update here (not via a BE call) when real values are needed.
 */
export const DEFAULT_SYSTEM_CONFIG: SystemConfigData = {
    challenge: { passThreshold: 0.8 },
    task: { passThreshold: 0.8 },
    ai: {
        auto: {
            usesPer5h: 5,
            usesPerWeek: 20,
            creditsPer5h: 50,
            creditsPerWeek: 200,
            creditCost: 10,
        },
    },
}

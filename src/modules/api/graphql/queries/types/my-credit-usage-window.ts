/** Credit usage for one rolling time window from `myCreditUsage`. */
export interface QueryMyCreditUsageWindowData {
    /** Credits consumed inside the window. */
    usedCredits: number
    /** Credit cap for the window. */
    quota: number
    /** Credits left before hitting the cap. */
    remainingCredits: number
    /** ISO time when the oldest in-window charge ages out; null when no usage. */
    resetAt: string | null
}

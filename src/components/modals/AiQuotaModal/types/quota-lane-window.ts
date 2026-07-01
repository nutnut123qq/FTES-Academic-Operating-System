/** One rolling window row passed into {@link QuotaBar}. */
export interface QuotaLaneWindow {
    /** Consumed amount in the window. */
    used: number
    /** Cap for the window. */
    limit: number
    /** Formatted reset line under the bar. */
    resetLabel: string | null
}

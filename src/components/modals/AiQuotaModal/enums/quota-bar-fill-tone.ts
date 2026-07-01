/** Semantic tone for quota progress bar fills (maps to Tailwind `bg-*` tokens). */
export enum QuotaBarFillTone {
    /** Default Auto / credit pool usage. */
    Accent = "accent",
    /** Premium lane usage. */
    Warning = "warning",
    /** Over-quota or exhausted pool. */
    Danger = "danger",
}

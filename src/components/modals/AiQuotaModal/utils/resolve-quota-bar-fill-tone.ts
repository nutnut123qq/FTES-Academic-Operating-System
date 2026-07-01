import {
    QuotaBarFillTone,
} from "../enums"

/** Usage ratio above which the bar shows warning color (>75%). */
const WARNING_USAGE_RATIO = 0.75

/** Usage ratio above which the bar shows danger color (>90%). */
const DANGER_USAGE_RATIO = 0.9

/**
 * Map consumed share to a progress bar color tier.
 * @param used - Credits (or uses) consumed in the window.
 * @param limit - Window cap.
 * @returns `accent` (≤75%), `warning` (>75%), or `danger` (>90%).
 */
export const resolveQuotaBarFillTone = (
    used: number,
    limit: number,
): QuotaBarFillTone => {
    const ratio = limit > 0
        ? Math.min(1, Math.max(0, used / limit))
        : (used > 0 ? 1 : 0)
    if (ratio > DANGER_USAGE_RATIO) {
        return QuotaBarFillTone.Danger
    }
    if (ratio > WARNING_USAGE_RATIO) {
        return QuotaBarFillTone.Warning
    }
    return QuotaBarFillTone.Accent
}

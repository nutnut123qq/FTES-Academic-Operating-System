/**
 * Locale-aware relative-time label ("2 giờ trước" / "2 hours ago") from an ISO
 * timestamp, using the platform-native `Intl.RelativeTimeFormat` (same primitive
 * the notification center uses). Returns "" for a missing/invalid timestamp so
 * the caller renders nothing rather than "Invalid Date".
 */
const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1],
]

export const formatRelativeTime = (
    iso: string | null | undefined,
    locale: string,
): string => {
    if (!iso) {
        return ""
    }
    const then = new Date(iso).getTime()
    if (Number.isNaN(then)) {
        return ""
    }
    // negative => in the past (RelativeTimeFormat convention)
    const diffSeconds = Math.round((then - Date.now()) / 1000)
    const abs = Math.abs(diffSeconds)
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
    for (const [unit, seconds] of UNITS) {
        if (abs >= seconds || unit === "second") {
            return rtf.format(Math.round(diffSeconds / seconds), unit)
        }
    }
    return ""
}

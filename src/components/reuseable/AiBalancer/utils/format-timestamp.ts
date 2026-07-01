/**
 * Formats an ISO timestamp for balancer health UI, or returns a dash when missing.
 *
 * @param value - ISO date string from GraphQL, or null.
 * @param locale - BCP-47 locale for `Intl.DateTimeFormat`.
 * @returns Localized date/time or "—".
 */
export const formatBalancerTimestamp = (
    value: string | null,
    locale: string,
): string => {
    if (!value) {
        return "—"
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return "—"
    }
    return new Intl.DateTimeFormat(locale, {
        dateStyle: "short",
        timeStyle: "medium",
    }).format(date)
}

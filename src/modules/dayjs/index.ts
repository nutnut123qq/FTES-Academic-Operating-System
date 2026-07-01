import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import duration from "dayjs/plugin/duration"
import "dayjs/locale/vi"

dayjs.extend(utc)
dayjs.extend(duration)
export { dayjs }

/**
 * Format an absolute timestamp as a localized "time + date" string:
 * - vi → `HH:mm D tháng M, YYYY` (e.g. `12:33 23 tháng 5, 2023`)
 * - en → `HH:mm MMMM D, YYYY` (e.g. `12:33 May 23, 2023`)
 *
 * Locale is applied per-instance (no global mutation).
 *
 * @param date - Day.js input (ISO string, `Date`, `dayjs.Dayjs`, …).
 * @param locale - active UI locale; anything other than `"en"` uses the vi format.
 */
export const formatDateTime = (date: dayjs.ConfigType, locale = "vi"): string => {
    const d = dayjs(date).locale(locale)
    return locale === "en"
        ? d.format("HH:mm MMMM D, YYYY")
        : d.format("HH:mm D [tháng] M, YYYY")
}

/** i18n keys for relative time; values must match `timeAgo.*` in `messages/*`. */
export const TIME_AGO = {
    justNow: "timeAgo.justNow",
    yearsAgo: "timeAgo.yearsAgo",
    monthsAgo: "timeAgo.monthsAgo",
    daysAgo: "timeAgo.daysAgo",
    daysHoursAgo: "timeAgo.daysHoursAgo",
    hoursAgo: "timeAgo.hoursAgo",
    hoursMinutesAgo: "timeAgo.hoursMinutesAgo",
    minutesAgo: "timeAgo.minutesAgo",
    minutesSecondsAgo: "timeAgo.minutesSecondsAgo",
    secondsAgo: "timeAgo.secondsAgo",
} as const

/** A message to pass to `getTimeAgoLabel` / `t()` for relative time. */
export type TimeAgoMessage = {
    key: (typeof TIME_AGO)[keyof typeof TIME_AGO]
    values?: Record<string, number>
}

/**
 * Renders a {@link TimeAgoMessage} with the same `t` you use in components (`next-intl`).
 *
 * @param message - Return value of {@link getTimeAgoMessage}.
 * @param t - `useTranslations()` result.
 */
export const getTimeAgoLabel = (
    message: TimeAgoMessage,
    t: (key: string, values?: Record<string, number>) => string,
): string => (message.values ? t(message.key, message.values) : t(message.key))

/**
 * Picks a `timeAgo.*` key (and numeric placeholders) from a past instant — no hard‑coded copy here.
 * The UI should call `getTimeAgoLabel(getTimeAgoMessage(dayjs(m)), t)` or `t(key, values)` yourself.
 *
 * @param date - A past time as Day.js input (string, `Date`, `dayjs.Dayjs`, etc.).
 */
export const getTimeAgoMessage = (date: dayjs.ConfigType): TimeAgoMessage => {
    const now = dayjs()
    const past = dayjs(date)

    const diffInMs = now.diff(past)
    if (diffInMs < 0) {
        return { key: TIME_AGO.justNow }
    }

    const d = dayjs.duration(diffInMs)

    const years = d.years()
    const months = d.months()
    const days = d.days()
    const hours = d.hours()
    const minutes = d.minutes()
    const seconds = d.seconds()

    if (years > 0) {
        return { key: TIME_AGO.yearsAgo, values: { years } }
    }
    if (months > 0) {
        return { key: TIME_AGO.monthsAgo, values: { months } }
    }
    if (days > 0) {
        if (hours > 0) {
            return { key: TIME_AGO.daysHoursAgo, values: { days, hours } }
        }
        return { key: TIME_AGO.daysAgo, values: { days } }
    }
    if (hours > 0) {
        if (minutes > 0) {
            return { key: TIME_AGO.hoursMinutesAgo, values: { hours, minutes } }
        }
        return { key: TIME_AGO.hoursAgo, values: { hours } }
    }
    if (minutes > 0) {
        if (seconds > 0) {
            return { key: TIME_AGO.minutesSecondsAgo, values: { minutes, seconds } }
        }
        return { key: TIME_AGO.minutesAgo, values: { minutes } }
    }
    if (seconds > 10) {
        return { key: TIME_AGO.secondsAgo, values: { seconds } }
    }
    return { key: TIME_AGO.justNow }
}

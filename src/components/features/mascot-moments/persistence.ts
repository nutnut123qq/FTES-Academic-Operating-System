/**
 * localStorage persistence for mascot MOMENTS — FE-only, no backend.
 *
 * Two anti-nag concerns live here:
 *   1. Celebrations that must fire at most once per day (e.g. clearing every
 *      daily quest) — keyed by a `YYYY-MM-DD` day stamp so a fresh day re-arms.
 *   2. Nudges that must appear at most once per device, ever (e.g. "complete
 *      your profile") — a plain dismissed flag.
 *
 * Every access is wrapped so SSR (no `window`) and privacy-mode/quota errors
 * (localStorage throwing) degrade gracefully — a blocked store reads as
 * "not shown / not dismissed", never a crash. Keys share the `ftes.mascot.*`
 * namespace used by the onboarding tour (`ftes.tour.*`).
 */

/** Namespace prefix for every mascot-moment key. */
const PREFIX = "ftes.mascot"

/** Local `YYYY-MM-DD` day stamp (device timezone) used to scope once-per-day moments. */
const todayStamp = (): string => {
    const now = new Date()
    const y = now.getFullYear()
    const m = `${now.getMonth() + 1}`.padStart(2, "0")
    const d = `${now.getDate()}`.padStart(2, "0")
    return `${y}-${m}-${d}`
}

/**
 * Whether a once-per-day celebration keyed by `id` has already been shown TODAY.
 * A new calendar day (device local) re-arms it automatically.
 */
export const isCelebrationShownToday = (id: string): boolean => {
    try {
        if (typeof window === "undefined") return false
        return window.localStorage.getItem(`${PREFIX}.celebration.${id}`) === todayStamp()
    } catch {
        return false
    }
}

/** Mark a once-per-day celebration keyed by `id` as shown for today. */
export const markCelebrationShownToday = (id: string): void => {
    try {
        window.localStorage.setItem(`${PREFIX}.celebration.${id}`, todayStamp())
    } catch {
        // ignore — worst case the celebration shows again later today
    }
}

/** Whether a once-per-device nudge keyed by `id` has been dismissed already. */
export const isNudgeDismissed = (id: string): boolean => {
    try {
        if (typeof window === "undefined") return false
        return window.localStorage.getItem(`${PREFIX}.nudge.${id}`) === "1"
    } catch {
        return false
    }
}

/** Permanently dismiss a once-per-device nudge keyed by `id` on this device. */
export const markNudgeDismissed = (id: string): void => {
    try {
        window.localStorage.setItem(`${PREFIX}.nudge.${id}`, "1")
    } catch {
        // ignore — worst case the nudge can appear again next session
    }
}

/**
 * localStorage persistence for the onboarding tour — FE-only, no backend.
 *
 * Only ONE key is stored: whether the first-run welcome tour has been seen
 * (completed OR skipped). Storing a single "done" flag is enough to stop the
 * auto-start from repeating; the "Xem lại hướng dẫn" replay entry ignores the
 * flag and always starts fresh (then re-sets it on finish/skip).
 *
 * Every access is wrapped so SSR (no `window`) and privacy-mode/quota errors
 * (localStorage throwing) degrade gracefully to "not done" instead of crashing
 * the app shell.
 */

/** localStorage key: `"1"` once the welcome tour has been seen (done or skipped). */
export const TOUR_DONE_KEY = "ftes.tour.onboarding.done"

/** Whether the welcome tour has already been completed or skipped on this device. */
export const isTourDone = (): boolean => {
    try {
        return typeof window !== "undefined" && window.localStorage.getItem(TOUR_DONE_KEY) === "1"
    } catch {
        // storage blocked (private mode / disabled) → treat as not done, but the
        // in-memory auto-start guard still prevents a re-run within the session.
        return false
    }
}

/** Mark the welcome tour as seen so the first-run auto-start never repeats. */
export const markTourDone = (): void => {
    try {
        window.localStorage.setItem(TOUR_DONE_KEY, "1")
    } catch {
        // ignore — worst case the tour auto-starts again next session
    }
}

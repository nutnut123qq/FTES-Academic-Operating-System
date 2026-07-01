/**
 * Format a number of seconds as `m:ss` for display in the control bar.
 *
 * Non-finite or negative inputs collapse to `"0:00"`.
 * @param seconds - Elapsed/total time in seconds.
 * @returns A human-readable `m:ss` timestamp.
 */
export const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return "0:00"
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
}

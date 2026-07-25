/**
 * Pure date helpers for the group Events tab. The BE speaks ISO-8601 instants
 * (`2026-08-01T09:00:00Z`) while `<input type="datetime-local">` speaks a naive
 * local `YYYY-MM-DDTHH:mm` — these two functions are the only bridge, kept free of
 * React so the conversion can be unit-tested.
 */

/**
 * Converts a `datetime-local` field value into the ISO instant the BE expects.
 *
 * @param local - the raw field value (`""` when untouched).
 * @returns the ISO-8601 instant, or `undefined` when the field is empty/unparsable
 * (so an optional field can be omitted from the request body entirely).
 */
export const toIsoInstant = (local: string): string | undefined => {
    if (local.trim() === "") {
        return undefined
    }
    const date = new Date(local)
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

/**
 * Converts an ISO instant back into a `datetime-local` field value, so the edit
 * form can prefill an existing event's schedule in the viewer's own timezone.
 *
 * @param iso - the ISO-8601 instant from the BE (may be absent).
 * @returns `YYYY-MM-DDTHH:mm`, or `""` when there is nothing to prefill.
 */
export const toLocalInputValue = (iso?: string | null): string => {
    if (!iso) {
        return ""
    }
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) {
        return ""
    }
    const pad = (value: number) => String(value).padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
        date.getHours(),
    )}:${pad(date.getMinutes())}`
}

"use client"

import { useEffect, useState } from "react"

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of no
 * further changes. Used to throttle search-as-you-type into a single fetch after
 * the user pauses. No external deps beyond React; the timer is cleared on every
 * change and on unmount.
 * @param value - the fast-changing source value (e.g. the raw input string).
 * @param delay - the quiet period in milliseconds before the value settles (default 300).
 * @returns the debounced value.
 */
export const useDebouncedValue = <T,>(value: T, delay = 300): T => {
    const [debounced, setDebounced] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])

    return debounced
}

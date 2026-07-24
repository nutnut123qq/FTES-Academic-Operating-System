"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Tracks the document's current fullscreen element (or `null`), reacting to
 * `fullscreenchange`. Used by surfaces that must relocate INTO the fullscreen
 * element to stay visible — the browser renders the fullscreen element in a
 * top layer above everything else, so a `position: fixed` sibling in `<body>`
 * (e.g. the AI FAB) is otherwise hidden behind the fullscreened video.
 */
/**
 * Whether the browser implements the Fullscreen API for an arbitrary ELEMENT
 * (i.e. container fullscreen via `Element.requestFullscreen`). iPhone Safari — every
 * version — does NOT: it exposes fullscreen only on the bare `<video>`, so
 * `Element.requestFullscreen` is absent and {@link useElementFullscreen}.toggle would
 * silently no-op. Suppressing the media's native fullscreen (YouTube `fs:0`, HLS
 * `controlsList="nofullscreen"`) and rendering the custom container button is only
 * correct when this is true; otherwise the native control must stay.
 */
export const isElementFullscreenSupported = (): boolean =>
    typeof document !== "undefined" &&
    Boolean(document.fullscreenEnabled) &&
    typeof document.documentElement.requestFullscreen === "function"

/**
 * Client-safe reactive read of {@link isElementFullscreenSupported}. Starts `false`
 * so SSR and the first client render agree (no hydration mismatch), then resolves
 * to the real capability after mount — gate the custom fullscreen button on it.
 */
export const useElementFullscreenSupported = (): boolean => {
    const [supported, setSupported] = useState(false)
    useEffect(() => {
        setSupported(isElementFullscreenSupported())
    }, [])
    return supported
}

export const useFullscreenElement = (): HTMLElement | null => {
    const [element, setElement] = useState<HTMLElement | null>(null)
    useEffect(() => {
        const onChange = () =>
            setElement((document.fullscreenElement as HTMLElement | null) ?? null)
        // sync once in case we mount while already fullscreen
        onChange()
        document.addEventListener("fullscreenchange", onChange)
        return () => document.removeEventListener("fullscreenchange", onChange)
    }, [])
    return element
}

/**
 * Container fullscreen for a video wrapper. The reader must fullscreen a DIV
 * (not the bare `<video>` / YouTube `<iframe>`) so overlaid UI — the custom
 * fullscreen control and the AI FAB — can live INSIDE the fullscreen element
 * instead of being clipped behind the browser top layer.
 *
 * Returns a `ref` to attach to the container, whether that container is the
 * active fullscreen element, and a `toggle` that enters/exits fullscreen.
 */
export const useElementFullscreen = <T extends HTMLElement>() => {
    const ref = useRef<T>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)

    useEffect(() => {
        const onChange = () =>
            setIsFullscreen(!!ref.current && document.fullscreenElement === ref.current)
        document.addEventListener("fullscreenchange", onChange)
        return () => document.removeEventListener("fullscreenchange", onChange)
    }, [])

    const toggle = useCallback(() => {
        const el = ref.current
        if (!el) return
        // Compare by IDENTITY, not truthiness: if a DIFFERENT element is fullscreen
        // (e.g. another VideoRenderer / diagram viewer), exiting it would be wrong —
        // this button must fullscreen ITS OWN container.
        if (document.fullscreenElement === el) {
            void document.exitFullscreen?.()
        } else {
            void el.requestFullscreen?.()
        }
    }, [])

    return { ref, isFullscreen, toggle }
}

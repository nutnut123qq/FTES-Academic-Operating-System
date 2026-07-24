"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Tracks the document's current fullscreen element (or `null`), reacting to
 * `fullscreenchange`. Used by surfaces that must relocate INTO the fullscreen
 * element to stay visible — the browser renders the fullscreen element in a
 * top layer above everything else, so a `position: fixed` sibling in `<body>`
 * (e.g. the AI FAB) is otherwise hidden behind the fullscreened video.
 */
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
        if (document.fullscreenElement) {
            void document.exitFullscreen?.()
        } else {
            void el.requestFullscreen?.()
        }
    }, [])

    return { ref, isFullscreen, toggle }
}

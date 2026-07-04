"use client"

import React, { useEffect, useState } from "react"

/**
 * Thin top-of-viewport reading-progress bar (0→100% of document scroll). Posts
 * run ~2000 words, so a lightweight progress signal helps orientation. Purely
 * presentational; listens to window scroll and paints an accent fill.
 */
export const ReadingProgress = () => {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const update = () => {
            const scrollable = document.documentElement.scrollHeight - window.innerHeight
            const ratio = scrollable > 0 ? window.scrollY / scrollable : 0
            setProgress(Math.min(1, Math.max(0, ratio)))
        }
        update()
        window.addEventListener("scroll", update, { passive: true })
        window.addEventListener("resize", update)
        return () => {
            window.removeEventListener("scroll", update)
            window.removeEventListener("resize", update)
        }
    }, [])

    return (
        <div
            className="fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent"
            role="progressbar"
            aria-label="Reading progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
        >
            <div
                className="h-full bg-accent transition-[width] duration-150 ease-out"
                style={{ width: `${progress * 100}%` }}
            />
        </div>
    )
}

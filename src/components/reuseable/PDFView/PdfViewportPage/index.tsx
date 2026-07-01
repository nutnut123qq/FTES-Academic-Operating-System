"use client"

import React, {
    useEffect,
    useRef,
    useState,
} from "react"
import { Page } from "react-pdf"
import { cn } from "@heroui/react"
import { PAGE_ASPECT_FALLBACK } from "../constants"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link PdfViewportPage}. */
export interface PdfViewportPageProps extends WithClassNames<undefined> {
    /** 1-based page index. */
    pageNumber: number
    /** Scroll container ref used as the IntersectionObserver root. */
    scrollRootRef: React.RefObject<HTMLDivElement | null>
    /** Rendered page width (deferred during resize). */
    width: number
    /** When true, mount the canvas immediately (no IntersectionObserver). */
    eager: boolean
}

/**
 * Renders one PDF page once it nears the viewport to avoid painting every page at once.
 *
 * Presentational: uses only UI-local hooks (`useState`/`useRef`/`useEffect`) to lazily
 * mount the page canvas via an IntersectionObserver.
 * @param props - {@link PdfViewportPageProps}
 */
export const PdfViewportPage = (props: PdfViewportPageProps) => {
    const {
        pageNumber,
        scrollRootRef,
        width,
        eager,
        className,
    } = props
    const wrapRef = useRef<HTMLDivElement | null>(null)
    const [showCanvas, setShowCanvas] = useState(eager)
    const placeholderMinH = Math.max(
        160,
        Math.round(width * PAGE_ASPECT_FALLBACK),
    )

    useEffect(() => {
        if (eager) {
            setShowCanvas(true)
            return
        }
        if (showCanvas) {
            return
        }
        const el = wrapRef.current
        if (!el) {
            return
        }
        const root = scrollRootRef.current ?? undefined
        const io = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (entry?.isIntersecting) {
                    setShowCanvas(true)
                }
            },
            {
                root,
                rootMargin: "100% 0px 120% 0px",
                threshold: 0.01,
            },
        )
        io.observe(el)
        return () => io.disconnect()
    }, [
        eager,
        scrollRootRef,
        showCanvas,
        pageNumber,
    ])

    return (
        <div
            ref={wrapRef}
            className={cn("flex justify-center", className)}
        >
            {
                showCanvas ? (
                    <Page
                        pageNumber={pageNumber}
                        width={width}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                    />
                ) : (
                    <div
                        className="w-full max-w-full rounded-medium bg-default-100/30"
                        style={{ minHeight: placeholderMinH }}
                        aria-hidden
                    />
                )
            }
        </div>
    )
}

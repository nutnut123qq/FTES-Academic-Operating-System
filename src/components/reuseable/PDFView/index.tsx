"use client"

import React, {
    useDeferredValue,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react"
import { Document, pdfjs } from "react-pdf"
import { cn } from "@heroui/react"
import { RESIZE_DEBOUNCE_MS } from "./constants"
import { PdfViewportPage } from "./PdfViewportPage"
import type { WithClassNames } from "@/modules/types/base/class-name"

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

/** Props for {@link PDFView}. */
export interface PDFViewProps extends WithClassNames<undefined> {
    /** Source URL of the PDF file to preview. */
    src: string
    /** Accessible title for the iframe viewer. */
    title: string
    /** Optional custom height class for wrapper. */
    heightClassName?: string
    /** Optional page width for PDF rendering. */
    pageWidth?: number
    /** Render all pages or only first page. */
    showAllPages?: boolean
    /** Allow vertical scroll in viewer container. */
    allowVerticalScroll?: boolean
    /** Auto fit rendered PDF width to container width. */
    fitToContainer?: boolean
}

/**
 * Reusable PDF preview viewer built on react-pdf.
 *
 * Presentational: uses only UI-local hooks (refs, resize/layout effects, deferred width)
 * to size pages to the container; no business logic. Marked `"use client"` for the DOM
 * observers and react-pdf canvas rendering.
 * @param props - {@link PDFViewProps}
 */
export const PDFView = ({
    src,
    title,
    heightClassName = "h-[560px]",
    pageWidth = 840,
    showAllPages = true,
    allowVerticalScroll = false,
    fitToContainer = false,
    className,
}: PDFViewProps) => {
    const file = useMemo(() => (src ? src : undefined), [src])
    const [numPages, setNumPages] = useState(0)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const scrollRootRef = useRef<HTMLDivElement | null>(null)
    const [containerWidth, setContainerWidth] = useState(0)
    const computedPageWidth = fitToContainer && containerWidth > 0
        ? Math.max(320, Math.floor(containerWidth) - 24)
        : pageWidth
    const deferredPageWidth = useDeferredValue(computedPageWidth)
    const renderWidth = deferredPageWidth > 0 ? deferredPageWidth : computedPageWidth

    const assignContainerRef = (node: HTMLDivElement | null) => {
        containerRef.current = node
        scrollRootRef.current = node
    }

    useLayoutEffect(() => {
        if (!fitToContainer) {
            return
        }
        const el = containerRef.current
        if (!el) {
            return
        }
        const w = Math.floor(el.getBoundingClientRect().width)
        if (w > 0) {
            setContainerWidth(w)
        }
    }, [
        fitToContainer,
        src,
        heightClassName,
    ])

    useEffect(() => {
        if (!fitToContainer) {
            return
        }
        const element = containerRef.current
        if (!element) {
            return
        }
        let timeoutId: NodeJS.Timeout | undefined
        const observer = new ResizeObserver((entries) => {
            const nextWidth = Math.floor(entries[0]?.contentRect.width ?? 0)
            clearTimeout(timeoutId)
            timeoutId = setTimeout(
                () => {
                    setContainerWidth(nextWidth)
                }, RESIZE_DEBOUNCE_MS
            )
        })
        observer.observe(element)
        return () => {
            clearTimeout(timeoutId)
            observer.disconnect()
        }
    }, [
        fitToContainer,
        src,
    ])

    const pageCount = showAllPages ? numPages : Math.min(1, numPages)

    return (
        <div
            ref={assignContainerRef}
            className={cn(
                heightClassName,
                "overflow-x-auto bg-surface scrollbar-thin scrollbar-thumb-accent scrollbar-track-surface-secondary",
                allowVerticalScroll ? "overflow-y-auto" : "overflow-y-hidden",
                className,
            )}
        >
            {file ? (
                <Document
                    key={src}
                    file={file}
                    loading={<div className="text-sm text-muted">{title}</div>}
                    error={<div className="text-sm text-danger">Failed to render PDF.</div>}
                    noData={<div className="text-sm text-muted">No PDF selected.</div>}
                    onLoadSuccess={(pdf) => setNumPages(pdf.numPages)}
                >
                    <div className="flex flex-col gap-3">
                        {Array.from({ length: pageCount }, (_, index) => {
                            const pageNumber = index + 1
                            const eager = !showAllPages || pageNumber <= 2
                            return (
                                <PdfViewportPage
                                    key={`pdf-page-${pageNumber}-${src}`}
                                    eager={eager}
                                    pageNumber={pageNumber}
                                    scrollRootRef={scrollRootRef}
                                    width={renderWidth}
                                />
                            )
                        })}
                    </div>
                </Document>
            ) : (
                <div className="text-sm text-muted">No PDF selected.</div>
            )}
        </div>
    )
}

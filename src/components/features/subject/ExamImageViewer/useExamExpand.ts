"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * Full-screen reading mode for an exam surface — the state the VIEWER cannot own.
 *
 * The expand button lives in {@link import("./index").ExamImageViewer}'s toolbar, but what
 * has to change when it is pressed lives one level up: the two-pane frame (paper | comments)
 * belongs to the HOST (`SubjectFeAlbum`, `ChallengePaper`), and so does the comment column
 * the reader may hide. So the viewer stays a controlled component — it draws the two
 * switches and reports presses — and this hook holds the state plus the exact class strings
 * the host swaps its frame to.
 *
 * The class strings are returned WHOLE rather than merged onto the docked ones on purpose.
 * Tailwind resolves competing utilities by their order in the generated stylesheet, not by
 * the order they appear in a `class` attribute, so "docked classes + an override" is a coin
 * flip (`lg:grid-cols-[minmax(0,1fr)_400px]` vs `lg:grid-cols-1`). Picking one string or the
 * other means no utility ever competes with its opposite.
 */

/**
 * The frame while expanded: the viewport, full stop.
 *
 * `z-[60]` is the app's established overlay step (see `ContentAiFab`), above the sticky
 * navbar and the workspace rail but below the splash screen. Below `lg` the overlay SCROLLS
 * (`overflow-y-auto`) and the two panes stack exactly as they do docked — a phone cannot
 * show a 400 px comment column beside an exam page, and silently dropping the comments
 * there would hide the thread from the reader without them asking.
 */
const EXPANDED_FRAME =
    "fixed inset-0 z-[60] h-[100dvh] w-screen overflow-y-auto bg-background lg:grid lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden"

/** With the comments hidden the paper is the only column, at every width. */
const EXPANDED_FRAME_COLUMNS_ALONE = "lg:grid-cols-1"

/** With the comments showing, the docked 400 px column comes back from `lg`. */
const EXPANDED_FRAME_COLUMNS_WITH_COMMENTS = "lg:grid-cols-[minmax(0,1fr)_400px]"

/**
 * The paper pane while expanded. `70dvh` in the stacked (below-`lg`) case rather than the
 * docked `60dvh`: the whole point of the mode is a bigger page, and the comment column is
 * one scroll away underneath.
 */
const EXPANDED_PANE = "h-[70dvh] min-h-0 lg:h-full"

/** What {@link useExamExpand} hands back to a host. */
export interface ExamExpandControls {
    /** Full-screen mode is on. */
    isExpanded: boolean
    /** The comment column is hidden (only ever true while expanded). */
    areCommentsHidden: boolean
    /** Toggle full-screen. Pass straight to the viewer's `onExpandedChange`. */
    setExpanded: (expanded: boolean) => void
    /** Toggle the comment column. Pass straight to the viewer's `onCommentsHiddenChange`. */
    setCommentsHidden: (hidden: boolean) => void
    /** Render the comment column? `false` only while expanded AND hidden. */
    areCommentsVisible: boolean
    /** The whole class string for the two-pane frame while expanded (`""` when docked). */
    frameClassName: string
    /** The whole class string for the paper pane while expanded (`""` when docked). */
    paneClassName: string
}

/**
 * Owns expand + hide-comments for one exam surface.
 *
 * @returns {@link ExamExpandControls}.
 */
export const useExamExpand = (): ExamExpandControls => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [areCommentsHidden, setAreCommentsHidden] = useState(false)

    const setExpanded = useCallback((expanded: boolean) => {
        setIsExpanded(expanded)
        if (!expanded) {
            // Leaving full screen restores the docked layout WHOLE. Carrying a hidden
            // comment column back into the two-pane page would leave the reader in a state
            // they never chose, with the control that undoes it only reachable by expanding
            // again.
            setAreCommentsHidden(false)
        }
    }, [])

    // Freeze the page behind the overlay: `html` is the scroll container app-wide (see
    // globals.css), so it is the element to pin — locking `body` alone does nothing here.
    // `scrollbar-gutter: stable` is already on `html`, so the gutter stays reserved and
    // nothing shifts sideways when the scrollbar goes.
    useEffect(() => {
        if (!isExpanded) {
            return
        }
        const root = document.documentElement
        const previous = root.style.overflow
        root.style.overflow = "hidden"
        return () => {
            root.style.overflow = previous
        }
    }, [isExpanded])

    return {
        isExpanded,
        areCommentsHidden,
        setExpanded,
        setCommentsHidden: setAreCommentsHidden,
        areCommentsVisible: !isExpanded || !areCommentsHidden,
        frameClassName: isExpanded
            ? `${EXPANDED_FRAME} ${areCommentsHidden ? EXPANDED_FRAME_COLUMNS_ALONE : EXPANDED_FRAME_COLUMNS_WITH_COMMENTS}`
            : "",
        paneClassName: isExpanded ? EXPANDED_PANE : "",
    }
}

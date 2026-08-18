import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useExamExpand } from "./useExamExpand"

/**
 * Unit — the state behind the exam viewer's full-screen mode.
 *
 * Three things can only break here, not in the viewer: the frame classes must actually
 * CHANGE when the reader hides the comments (otherwise the paper never gets the freed
 * width, which is the entire point of the switch), the page behind the overlay must be
 * frozen and unfrozen, and hiding the comments must not survive leaving full screen.
 */

describe("useExamExpand", () => {
    it("starts docked, with comments showing and no classes to apply", () => {
        const { result } = renderHook(() => useExamExpand())

        expect(result.current.isExpanded).toBe(false)
        expect(result.current.areCommentsVisible).toBe(true)
        expect(result.current.frameClassName).toBe("")
        expect(result.current.paneClassName).toBe("")
    })

    it("expands to a viewport-covering frame", () => {
        const { result } = renderHook(() => useExamExpand())

        act(() => result.current.setExpanded(true))

        expect(result.current.isExpanded).toBe(true)
        expect(result.current.frameClassName).toContain("fixed inset-0")
        expect(result.current.paneClassName.length).toBeGreaterThan(0)
    })

    it("gives the paper the whole width once the comments are hidden", () => {
        const { result } = renderHook(() => useExamExpand())

        act(() => result.current.setExpanded(true))
        expect(result.current.frameClassName).toContain("lg:grid-cols-[minmax(0,1fr)_400px]")

        act(() => result.current.setCommentsHidden(true))

        expect(result.current.areCommentsVisible).toBe(false)
        expect(result.current.frameClassName).toContain("lg:grid-cols-1")
        expect(result.current.frameClassName).not.toContain("400px")
    })

    it("puts the comments back when full screen is left", () => {
        const { result } = renderHook(() => useExamExpand())

        act(() => result.current.setExpanded(true))
        act(() => result.current.setCommentsHidden(true))
        act(() => result.current.setExpanded(false))

        expect(result.current.areCommentsHidden).toBe(false)
        expect(result.current.areCommentsVisible).toBe(true)
    })

    it("freezes the page behind the overlay and thaws it on the way out", () => {
        const { result, unmount } = renderHook(() => useExamExpand())

        act(() => result.current.setExpanded(true))
        expect(document.documentElement.style.overflow).toBe("hidden")

        act(() => result.current.setExpanded(false))
        expect(document.documentElement.style.overflow).not.toBe("hidden")

        // And an unmount while still expanded must not leave the page frozen forever.
        act(() => result.current.setExpanded(true))
        unmount()
        expect(document.documentElement.style.overflow).not.toBe("hidden")
    })
})

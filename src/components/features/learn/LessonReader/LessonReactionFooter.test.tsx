import React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ReactionType } from "@/modules/api/graphql/queries/types/discussion"
import type { ReactionSummary } from "@/modules/api/graphql/queries/types/discussion"

/**
 * Component — the lesson reaction footer (learn-engagement-wire task 2.3 quality loop).
 *
 * The footer is wired to the real `GET/PUT/DELETE /courses/lessons/{id}/reactions`
 * endpoints through the REAL SWR hooks (only the REST module is mocked), so these pin:
 *  - the `{viewCount, likeCount, myReaction}` → ReactionSummary mapping,
 *  - the optimistic like (+1 instantly while the PUT is in flight),
 *  - the ROLLBACK to server truth when the PUT fails,
 *  - the PREVIEW gate (control disabled, no doomed PUT ever fired).
 */

const getReactions = vi.fn()
const putReaction = vi.fn()
const deleteReaction = vi.fn()

vi.mock("@/modules/api/rest/course", () => ({
    LESSON_REACTION_LIKE: "LIKE",
    getLessonReactions: (lessonId: string) => getReactions(lessonId),
    putLessonReaction: (lessonId: string, reaction: string) => putReaction(lessonId, reaction),
    deleteLessonReaction: (lessonId: string, reaction: string) => deleteReaction(lessonId, reaction),
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

/** Probe InteractionBar: dumps the summary it received + a button that fires `onReact`. */
vi.mock("@/components/reuseable/Discussion/InteractionBar", () => ({
    InteractionBar: ({
        summary,
        onReact,
        disabled,
        disabledReason,
    }: {
        summary?: ReactionSummary
        onReact: (type: ReactionType | null) => void
        disabled?: boolean
        disabledReason?: string
    }) => (
        <div>
            <span data-testid="total">{summary ? String(summary.total) : "none"}</span>
            <span data-testid="mine">{summary ? String(summary.myReaction) : "none"}</span>
            <span data-testid="views">{summary ? String(summary.viewCount) : "none"}</span>
            <span data-testid="disabled">{String(disabled ?? false)}</span>
            {disabledReason ? <span data-testid="reason">{disabledReason}</span> : null}
            <button type="button" onClick={() => onReact(ReactionType.Like)}>like</button>
            <button type="button" onClick={() => onReact(null)}>unlike</button>
        </div>
    ),
}))

import { LessonReactionFooter, toReactionSummary } from "./LessonReactionFooter"

beforeEach(() => {
    getReactions.mockReset()
    putReaction.mockReset()
    deleteReaction.mockReset()
})

/** A one-shot deferred so a test can hold a PUT in flight, then settle it. */
const deferred = <T,>() => {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

describe("toReactionSummary", () => {
    it("maps the wire view onto the shared ReactionSummary", () => {
        expect(
            toReactionSummary({ lessonId: "l", viewCount: 42, likeCount: 5, myReaction: "LIKE" }),
        ).toEqual({
            counts: [{ type: ReactionType.Like, count: 5 }],
            total: 5,
            myReaction: ReactionType.Like,
            viewCount: 42,
        })
    })

    it("collapses zero likes to an empty bucket and a null myReaction", () => {
        expect(
            toReactionSummary({ lessonId: "l", viewCount: 7, likeCount: 0, myReaction: null }),
        ).toEqual({ counts: [], total: 0, myReaction: null, viewCount: 7 })
    })
})

describe("LessonReactionFooter — optimistic like + rollback", () => {
    // NOTE: SWR's cache is module-global, so every test uses a distinct lessonId.

    it("shows the summary and flips optimistically, then commits the server truth", async () => {
        getReactions.mockResolvedValue({ lessonId: "les-1", viewCount: 42, likeCount: 5, myReaction: null })
        const put = deferred<{ lessonId: string; viewCount: number; likeCount: number; myReaction: string }>()
        putReaction.mockReturnValue(put.promise)

        render(<LessonReactionFooter contentId="les-1" accessLevel="FULL" />)
        await waitFor(() => expect(screen.getByTestId("total").textContent).toBe("5"))
        expect(screen.getByTestId("views").textContent).toBe("42")

        // Like → the summary flips INSTANTLY while the PUT is still in flight.
        fireEvent.click(screen.getByText("like"))
        await waitFor(() => expect(screen.getByTestId("total").textContent).toBe("6"))
        expect(screen.getByTestId("mine").textContent).toBe(String(ReactionType.Like))
        expect(putReaction).toHaveBeenCalledWith("les-1", "LIKE")

        // PUT lands → the server truth is committed (stays liked).
        await act(async () => {
            put.resolve({ lessonId: "les-1", viewCount: 43, likeCount: 6, myReaction: "LIKE" })
            await put.promise
        })
        expect(screen.getByTestId("total").textContent).toBe("6")
        expect(screen.getByTestId("mine").textContent).toBe(String(ReactionType.Like))
    })

    it("rolls back to the previous summary when the PUT fails", async () => {
        getReactions.mockResolvedValue({ lessonId: "les-2", viewCount: 10, likeCount: 3, myReaction: null })
        const put = deferred<never>()
        putReaction.mockReturnValue(put.promise)

        render(<LessonReactionFooter contentId="les-2" accessLevel="FULL" />)
        await waitFor(() => expect(screen.getByTestId("total").textContent).toBe("3"))

        fireEvent.click(screen.getByText("like"))
        await waitFor(() => expect(screen.getByTestId("total").textContent).toBe("4"))

        // PUT fails → rollbackOnError restores the pre-optimistic summary.
        await act(async () => {
            put.reject(new Error("boom"))
            await put.promise.catch(() => {})
        })
        await waitFor(() => expect(screen.getByTestId("total").textContent).toBe("3"))
        expect(screen.getByTestId("mine").textContent).toBe("null")
    })

    it("removes a like through DELETE and rolls that back on failure too", async () => {
        getReactions.mockResolvedValue({ lessonId: "les-3", viewCount: 9, likeCount: 4, myReaction: "LIKE" })
        const del = deferred<never>()
        deleteReaction.mockReturnValue(del.promise)

        render(<LessonReactionFooter contentId="les-3" accessLevel="FULL" />)
        await waitFor(() => expect(screen.getByTestId("mine").textContent).toBe(String(ReactionType.Like)))

        fireEvent.click(screen.getByText("unlike"))
        await waitFor(() => expect(screen.getByTestId("total").textContent).toBe("3"))
        expect(deleteReaction).toHaveBeenCalledWith("les-3", "LIKE")

        await act(async () => {
            del.reject(new Error("boom"))
            await del.promise.catch(() => {})
        })
        await waitFor(() => expect(screen.getByTestId("total").textContent).toBe("4"))
        expect(screen.getByTestId("mine").textContent).toBe(String(ReactionType.Like))
    })

    it("disables liking for a PREVIEW viewer and never fires the PUT", async () => {
        getReactions.mockResolvedValue({ lessonId: "les-4", viewCount: 42, likeCount: 5, myReaction: null })

        render(<LessonReactionFooter contentId="les-4" accessLevel="PREVIEW" />)
        await waitFor(() => expect(screen.getByTestId("total").textContent).toBe("5"))

        expect(screen.getByTestId("disabled").textContent).toBe("true")
        expect(screen.getByTestId("reason").textContent).toBe("reactions.likeGated")

        // Even if a react somehow fires, the FULL-access guard drops it silently.
        fireEvent.click(screen.getByText("like"))
        await act(async () => {})
        expect(putReaction).not.toHaveBeenCalled()
        expect(screen.getByTestId("total").textContent).toBe("5")
    })
})

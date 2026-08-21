import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const getReactions = vi.fn()

vi.mock("@/modules/api/rest/course", () => ({
    getLessonReactions: (lessonId: string) => getReactions(lessonId),
}))

vi.mock("@/components/reuseable/Discussion/InteractionBar", () => ({
    InteractionBar: ({ viewCount, showReactions }: { viewCount?: number; showReactions?: boolean }) => (
        <div data-testid="interaction" data-show-reactions={String(showReactions)}>
            {viewCount}
        </div>
    ),
}))

import { LessonReactionFooter } from "./LessonReactionFooter"

beforeEach(() => {
    getReactions.mockReset()
})

describe("LessonReactionFooter", () => {
    it("keeps the lesson view count but never renders the like control", async () => {
        getReactions.mockResolvedValue({ lessonId: "les-1", viewCount: 42, likeCount: 5, myReaction: "LIKE" })

        render(<LessonReactionFooter contentId="les-1" />)

        await waitFor(() => expect(screen.getByTestId("interaction").textContent).toBe("42"))
        expect(screen.getByTestId("interaction").getAttribute("data-show-reactions")).toBe("false")
    })
})

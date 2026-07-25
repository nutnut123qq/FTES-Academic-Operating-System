import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const sharePost = vi.fn()

vi.mock("@/modules/api/rest/community", () => ({
    sharePost: (postId: string, body: unknown) => sharePost(postId, body),
}))

import { useMutateSharePostSwr } from "./useMutateSharePostSwr"

/**
 * Unit — the share-recording write.
 *
 * The BE allowlist is `InteractionService.SHARE_TYPES = {SHARE, QUOTE}`: any other
 * value ("LINK", "REPOST", …) is a 400 `COMMUNITY_INVALID_SHARE_TYPE`. Because the
 * call is intentionally silent fire-and-forget, such a rejection would never show
 * up in the UI — the counter would just never move — so the sent `shareType` is
 * pinned here.
 */
describe("useMutateSharePostSwr", () => {
    beforeEach(() => {
        sharePost.mockReset()
        sharePost.mockResolvedValue({ id: "post-1" })
    })

    it("records a link copy as a plain SHARE (a value the BE allowlist accepts)", () => {
        const { result } = renderHook(() => useMutateSharePostSwr())

        result.current("post-1")

        expect(sharePost).toHaveBeenCalledWith("post-1", { shareType: "SHARE" })
        const [, body] = sharePost.mock.calls[0] as [string, { shareType: string }]
        expect(["SHARE", "QUOTE"]).toContain(body.shareType)
    })

    it("stays silent when the write fails (best-effort telemetry, never throws)", async () => {
        sharePost.mockRejectedValue(new Error("401"))
        const { result } = renderHook(() => useMutateSharePostSwr())

        expect(() => result.current("post-1")).not.toThrow()
        await Promise.resolve()
    })
})

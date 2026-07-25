import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — the post owner DELETE and where it leaves the viewer.
 *
 * The hook is shared by two surfaces with opposite needs: the DETAIL page must
 * leave (`/community/{id}` of a deleted post only 404s), while a FEED row is
 * removed in place and the viewer must keep the tab they were reading
 * (`/community/following`, `/community/campus` — both mount the same feed). So
 * the navigation is opt-out and the default stays "navigate".
 */

const deletePost = vi.fn()
const replace = vi.fn()

vi.mock("@/modules/api/rest/community", () => ({
    deletePost: (postId: string) => deletePost(postId),
    updatePost: vi.fn(),
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@heroui/react", () => ({
    toast: { success: vi.fn(), danger: vi.fn() },
}))

vi.mock("@/i18n/navigation", () => ({
    useRouter: () => ({ replace }),
}))

vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({ requireAuth: () => true }),
}))

vi.mock("swr", () => ({
    useSWRConfig: () => ({
        cache: { keys: () => [][Symbol.iterator]() },
        mutate: vi.fn().mockResolvedValue(undefined),
    }),
}))

import { useMutatePostOwnerActionsSwr } from "./useMutatePostOwnerActionsSwr"

describe("useMutatePostOwnerActionsSwr — removePost navigation", () => {
    beforeEach(() => {
        deletePost.mockReset().mockResolvedValue(undefined)
        replace.mockReset()
    })

    it("navigates back to /community by default (detail page)", async () => {
        const { result } = renderHook(() => useMutatePostOwnerActionsSwr())

        const ok = await result.current.removePost("p1")

        expect(ok).toBe(true)
        expect(replace).toHaveBeenCalledWith("/community")
    })

    it("stays put when the caller opts out (feed row deleted in place)", async () => {
        const { result } = renderHook(() => useMutatePostOwnerActionsSwr())

        const ok = await result.current.removePost("p1", { navigate: false })

        expect(ok).toBe(true)
        expect(replace).not.toHaveBeenCalled()
    })

    it("never navigates when the delete itself failed", async () => {
        deletePost.mockRejectedValue(new Error("403"))
        const { result } = renderHook(() => useMutatePostOwnerActionsSwr())

        const ok = await result.current.removePost("p1")

        expect(ok).toBe(false)
        expect(replace).not.toHaveBeenCalled()
    })
})

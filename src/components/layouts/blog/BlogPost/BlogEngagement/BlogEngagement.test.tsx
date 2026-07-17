import React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — {@link BlogEngagement} guest gating + author fallback (change
 * `blog-nav-and-engagement`, task 3.5). Verifies a signed-out visitor sees a
 * sign-in affordance instead of the composer and that clicking the post heart
 * opens the auth modal WITHOUT firing a reaction request, and that a comment
 * whose `authorUsername` is null renders the generic label instead of crashing.
 *
 * Every collaborator is mocked so the component renders in happy-dom without the
 * HeroUI theme, Redux store, or real network: `@heroui/react` primitives become
 * thin passthroughs, `useRequireAuth`/`useAppSelector` are driven per-test, and
 * each blog SWR hook is a spy exposing its `trigger`.
 */

const h = vi.hoisted(() => ({
    authenticated: false,
    user: null as { id: string; username: string } | null,
    requireAuth: vi.fn<(key?: string) => boolean>(() => false),
    reactPostTrigger: vi.fn(),
    reactCommentTrigger: vi.fn(),
    commentsData: { items: [] as Array<Record<string, unknown>>, hasNext: false } as {
        items: Array<Record<string, unknown>>
        hasNext: boolean
    },
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({ user: { user: h.user }, keycloak: { authenticated: h.authenticated } }),
}))

vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({
        authenticated: h.authenticated,
        requireAuth: h.requireAuth,
        guard: (action: (...a: Array<unknown>) => void) => action,
    }),
}))

vi.mock("@/hooks/swr/api/rest/queries/useGetBlogCommentsSwr", () => ({
    useGetBlogCommentsSwr: () => ({
        data: h.commentsData,
        isLoading: false,
        error: undefined,
        mutate: vi.fn(),
    }),
}))

vi.mock("@/hooks/swr/api/rest/mutations/usePostCreateBlogCommentSwr", () => ({
    usePostCreateBlogCommentSwr: () => ({ trigger: vi.fn(), isMutating: false }),
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePostUpdateBlogCommentSwr", () => ({
    usePostUpdateBlogCommentSwr: () => ({ trigger: vi.fn(), isMutating: false }),
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePostDeleteBlogCommentSwr", () => ({
    usePostDeleteBlogCommentSwr: () => ({ trigger: vi.fn(), isMutating: false }),
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePostReactToBlogPostSwr", () => ({
    usePostReactToBlogPostSwr: () => ({ trigger: h.reactPostTrigger, isMutating: false }),
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePostReactToBlogCommentSwr", () => ({
    usePostReactToBlogCommentSwr: () => ({ trigger: h.reactCommentTrigger, isMutating: false }),
}))

// AsyncContent → render the children (the resolved thread) directly
vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// identity/avatar are data owners (SWR + Redux) → replace with markers
vi.mock("@/components/features/identity", () => ({
    UserLink: ({ username }: { username?: string | null }) => (
        <span data-testid="user-link">{username}</span>
    ),
}))
vi.mock("@/components/reuseable/UserAvatar", () => ({
    UserAvatar: ({ seed }: { seed?: string | null }) => <span data-testid="user-avatar">{seed}</span>,
}))

vi.mock("@phosphor-icons/react", () => ({
    HeartIcon: (props: Record<string, unknown>) => <svg data-testid="heart" {...props} />,
}))

// HeroUI primitives → minimal passthroughs (onPress→onClick, isOpen gate on Modal)
vi.mock("@heroui/react", () => {
    const Button = ({
        children,
        onPress,
        isDisabled,
        ...rest
    }: {
        children?: React.ReactNode
        onPress?: () => void
        isDisabled?: boolean
        [k: string]: unknown
    }) => {
        // strip non-DOM HeroUI props so React does not warn about unknown attributes
        const { isPending, variant, ...domProps } = rest
        void isPending
        void variant
        return (
            <button type="button" disabled={isDisabled} onClick={onPress} {...domProps}>
                {children}
            </button>
        )
    }
    const passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    const Modal = ({ isOpen, children }: { isOpen?: boolean; children?: React.ReactNode }) =>
        isOpen ? <div role="dialog">{children}</div> : null
    Object.assign(Modal, {
        Backdrop: passthrough,
        Container: passthrough,
        Dialog: passthrough,
        Header: passthrough,
        Body: passthrough,
        Footer: passthrough,
    })
    const TextField = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    const TextArea = (props: Record<string, unknown>) => <textarea {...props} />
    const Typography = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    const cn = (...args: Array<unknown>) => args.filter(Boolean).join(" ")
    return { Button, Modal, TextField, TextArea, Typography, cn }
})

import { BlogEngagement } from "./index"

beforeEach(() => {
    h.authenticated = false
    h.user = null
    h.requireAuth.mockReset()
    h.requireAuth.mockReturnValue(false)
    h.reactPostTrigger.mockReset()
    h.reactCommentTrigger.mockReset()
    h.commentsData = { items: [], hasNext: false }
})

afterEach(() => cleanup())

describe("BlogEngagement — guest gating", () => {
    it("shows a sign-in affordance and NO composer textarea for guests", () => {
        render(<BlogEngagement postId="p1" initialEmojiCount={3} />)
        expect(screen.getByText("signInToComment")).toBeTruthy()
        expect(screen.queryByPlaceholderText("commentPlaceholder")).toBeNull()
    })

    it("opens the auth modal and fires NO reaction request when a guest taps the post heart", () => {
        render(<BlogEngagement postId="p1" initialEmojiCount={3} />)
        // the post heart button carries the like aria-label
        fireEvent.click(screen.getByLabelText("likesLabel"))
        expect(h.requireAuth).toHaveBeenCalledWith("auth.context.like")
        expect(h.reactPostTrigger).not.toHaveBeenCalled()
    })

    it("renders the composer (not the sign-in affordance) for signed-in users", () => {
        h.authenticated = true
        h.user = { id: "u1", username: "minh" }
        render(<BlogEngagement postId="p1" initialEmojiCount={0} />)
        expect(screen.queryByText("signInToComment")).toBeNull()
        expect(screen.getByPlaceholderText("commentPlaceholder")).toBeTruthy()
    })
})

describe("BlogEngagement — author fallback for a null username", () => {
    it("renders the generic label + seeded avatar instead of crashing", () => {
        h.commentsData = {
            items: [
                {
                    id: "c1",
                    postId: "p1",
                    userId: "legacy-42",
                    content: "hello",
                    emojiCount: 0,
                    authorUsername: null,
                    createdAt: "2026-07-01T00:00:00Z",
                    updatedAt: "2026-07-01T00:00:00Z",
                },
            ],
            hasNext: false,
        }
        render(<BlogEngagement postId="p1" initialEmojiCount={0} />)
        // generic label shown, avatar seeded by the raw user id, no UserLink
        expect(screen.getByText("anonymous")).toBeTruthy()
        expect(screen.getByTestId("user-avatar").textContent).toBe("legacy-42")
        expect(screen.queryByTestId("user-link")).toBeNull()
    })
})

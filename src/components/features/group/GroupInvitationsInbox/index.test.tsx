import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"

/**
 * Unit — the group invitation inbox.
 *
 * Contract pinned here: answering an invitation removes its row OPTIMISTICALLY and
 * puts it back when the write fails (the BE respond call 404s once the invitation is
 * withdrawn / already answered), the rollback reads the list as it stands at that
 * moment instead of a stale snapshot, and guests get no inbox at all.
 */

const trigger = vi.fn()
const onResponded = vi.fn()

const state = vi.hoisted(() => ({
    rows: [] as Array<Record<string, unknown>>,
    authenticated: true,
}))

const invitation = (id: string, createdAt: string) => ({
    invitationId: id,
    group: { id: `g-${id}`, name: `Nhóm ${id}`, slug: id, avatarUrl: null },
    inviter: { userId: "u1", username: "khoa", displayName: "Khoa", avatarUrl: null },
    status: "PENDING",
    createdAt,
    expiresAt: "2026-08-01T00:00:00Z",
})

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useFormatter: () => ({ dateTime: () => "01/08/2026" }),
}))

vi.mock("@heroui/react", () => {
    const Passthrough = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>
    return {
        Button: ({
            children,
            onPress,
            isDisabled,
        }: {
            children?: React.ReactNode
            onPress?: () => void
            isDisabled?: boolean
        }) => (
            <button type="button" disabled={isDisabled} onClick={onPress}>
                {children}
            </button>
        ),
        Typography: Passthrough,
        Avatar: Passthrough,
        AvatarImage: () => null,
        AvatarFallback: Passthrough,
    }
})

vi.mock("@/i18n/navigation", () => ({
    Link: ({ children, href }: { children?: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}))

vi.mock("@/components/blocks/skeleton/Skeleton", () => ({
    Skeleton: {
        Avatar: () => <div />,
        Typography: () => <div />,
    },
}))

vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({
        isLoading,
        skeleton,
        isEmpty,
        emptyContent,
        error,
        errorContent,
        children,
    }: {
        isLoading: boolean
        skeleton: React.ReactNode
        isEmpty?: boolean
        emptyContent?: { title: React.ReactNode }
        error?: unknown
        errorContent?: { title: React.ReactNode }
        children: React.ReactNode
    }) => {
        if (error && errorContent) {
            return <div>{errorContent.title}</div>
        }
        if (isLoading) {
            return <div>{skeleton}</div>
        }
        if (isEmpty) {
            return <div>{emptyContent?.title}</div>
        }
        return <>{children}</>
    },
}))

vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({
        guard:
            (action: (...args: Array<unknown>) => void) =>
                (...args: Array<unknown>) =>
                    action(...args),
    }),
}))

// mirrors runRestWithToast: the value on success, null when the write throws
vi.mock("@/modules/toast/hooks", () => ({
    useRestWithToast: () => async (action: () => Promise<unknown>) => {
        try {
            return await action()
        } catch {
            return null
        }
    },
}))

vi.mock("@/hooks/swr/api/rest/mutations/usePostRespondToInvitationSwr", () => ({
    usePostRespondToInvitationSwr: () => ({ trigger, isMutating: false }),
}))

// a real React-state store so the optimistic remove + rollback run against the list
// as it actually stands at each step (the point of the functional `mutate`)
vi.mock("./useQueryMyInvitationsSwr", async () => {
    const react = await import("react")
    return {
        useQueryMyInvitationsSwr: () => {
            const [invitations, setInvitations] = react.useState(state.rows)
            const mutate = react.useCallback(
                async (updater?: (current: Array<unknown>) => Array<unknown>) => {
                    if (typeof updater === "function") {
                        setInvitations((current) => updater(current) as typeof current)
                    }
                },
                [],
            )
            return {
                invitations,
                isLoading: false,
                error: undefined,
                mutate,
                authenticated: state.authenticated,
            }
        },
    }
})

import { GroupInvitationsInbox } from "./index"

describe("GroupInvitationsInbox", () => {
    beforeEach(() => {
        trigger.mockReset()
        trigger.mockResolvedValue(undefined)
        onResponded.mockClear()
        state.authenticated = true
        state.rows = [
            invitation("a", "2026-07-20T10:00:00Z"),
            invitation("b", "2026-07-19T10:00:00Z"),
        ]
    })

    it("renders nothing for guests", () => {
        state.authenticated = false
        const { container } = render(<GroupInvitationsInbox />)
        expect(container.innerHTML).toBe("")
    })

    it("shows the empty state when there is no invitation", () => {
        state.rows = []
        render(<GroupInvitationsInbox />)
        expect(screen.getByText("invitations.empty")).toBeTruthy()
    })

    it("accepts an invitation — the row leaves and the id is sent", async () => {
        render(<GroupInvitationsInbox onResponded={onResponded} />)
        expect(screen.getAllByText("invitation.accept")).toHaveLength(2)

        fireEvent.click(screen.getAllByText("invitation.accept")[0])

        await waitFor(() =>
            expect(trigger).toHaveBeenCalledWith({
                id: "a",
                request: { action: "ACCEPT" },
            }),
        )
        await waitFor(() => expect(screen.getAllByText("invitation.accept")).toHaveLength(1))
        expect(screen.queryByText("Nhóm a")).toBeNull()
        expect(screen.getByText("Nhóm b")).toBeTruthy()
        await waitFor(() => expect(onResponded).toHaveBeenCalledWith("ACCEPT"))
    })

    it("declines an invitation with the DECLINE action", async () => {
        render(<GroupInvitationsInbox />)
        fireEvent.click(screen.getAllByText("invitation.decline")[1])

        await waitFor(() =>
            expect(trigger).toHaveBeenCalledWith({
                id: "b",
                request: { action: "DECLINE" },
            }),
        )
        await waitFor(() => expect(screen.queryByText("Nhóm b")).toBeNull())
    })

    it("rolls the row back — in its original position — when the write fails", async () => {
        trigger.mockRejectedValue(new Error("404"))
        render(<GroupInvitationsInbox onResponded={onResponded} />)

        fireEvent.click(screen.getAllByText("invitation.accept")[0])

        // it leaves optimistically, then comes back once the call rejects
        await waitFor(() => expect(screen.getByText("Nhóm a")).toBeTruthy())
        const names = screen.getAllByText(/Nhóm/).map((node) => node.textContent)
        expect(names).toEqual(["Nhóm a", "Nhóm b"])
        expect(onResponded).not.toHaveBeenCalled()
    })

    it("does not duplicate a row that reappeared on its own before the rollback", async () => {
        trigger.mockRejectedValue(new Error("404"))
        render(<GroupInvitationsInbox />)

        fireEvent.click(screen.getAllByText("invitation.accept")[0])

        await waitFor(() => expect(screen.getAllByText("Nhóm a")).toHaveLength(1))
    })
})

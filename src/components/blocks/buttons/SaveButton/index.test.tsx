import React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Component — {@link SaveButton} (community feed bookmark bug-fix).
 *
 * The button used to be MOCK-only: it flipped the local saved-items store and
 * never hit the backend. These tests pin the real wiring for POSTs:
 *  - saving a post calls `PUT /community/bookmarks/{id}` (bookmarkPost),
 *  - un-saving calls `DELETE` (unbookmarkPost),
 *  - the store flip is optimistic and REVERTS (plus a toast) when the REST call
 *    rejects,
 *  - non-post entities (resource/course) stay on the local store — no REST call,
 *  - guests never toggle or call REST (the sign-in modal opens instead).
 *
 * The store hooks, redux, overlay, and REST client are mocked so the assertions
 * target THIS block's toggle/optimistic-revert contract.
 */

const hoisted = vi.hoisted(() => ({
    authenticated: true,
    saved: false,
    toggleSaved: vi.fn(),
    bookmarkPost: vi.fn<(id: string) => Promise<void>>(),
    unbookmarkPost: vi.fn<(id: string) => Promise<void>>(),
    toastDanger: vi.fn(),
    openAuth: vi.fn(),
    dispatch: vi.fn(),
    setTab: vi.fn(),
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@heroui/react", () => ({
    Button: ({
        children,
        onPress,
        isDisabled,
        ...rest
    }: {
        children?: React.ReactNode
        onPress?: () => void
        isDisabled?: boolean
        "aria-label"?: string
        "aria-pressed"?: boolean
    }) => (
        <button
            type="button"
            onClick={onPress}
            disabled={isDisabled}
            aria-label={rest["aria-label"]}
            aria-pressed={rest["aria-pressed"]}
        >
            {children}
        </button>
    ),
    cn: (...values: Array<unknown>) => values.filter(Boolean).join(" "),
    toast: { danger: (...args: Array<unknown>) => hoisted.toastDanger(...args) },
}))

vi.mock("@phosphor-icons/react", () => ({
    BookmarkSimpleIcon: () => <svg />,
}))

vi.mock("@/redux/hooks", () => ({
    useAppDispatch: () => hoisted.dispatch,
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({ keycloak: { authenticated: hoisted.authenticated } }),
}))

vi.mock("@/redux/slices/tabs", () => ({
    AuthenticationModalTab: { SignIn: "sign-in" },
    setAuthenticationModalTab: (tab: unknown) => hoisted.setTab(tab),
}))

vi.mock("@/hooks/zustand/overlay/hooks", () => ({
    useAuthenticationOverlayState: () => ({ open: hoisted.openAuth }),
}))

vi.mock("@/hooks/zustand/savedItems", () => ({
    useHydrateSavedItems: () => undefined,
    useIsSaved: () => hoisted.saved,
    useSavedItemsStore: (selector: (state: unknown) => unknown) =>
        selector({ toggleSaved: hoisted.toggleSaved }),
}))

vi.mock("@/modules/api/rest/community/community", () => ({
    bookmarkPost: (id: string) => hoisted.bookmarkPost(id),
    unbookmarkPost: (id: string) => hoisted.unbookmarkPost(id),
}))

import { SaveButton } from "./index"

describe("SaveButton", () => {
    beforeEach(() => {
        hoisted.authenticated = true
        hoisted.saved = false
        hoisted.bookmarkPost.mockResolvedValue(undefined)
        hoisted.unbookmarkPost.mockResolvedValue(undefined)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it("saving a post optimistically flips the store and calls PUT bookmark", async () => {
        render(<SaveButton entityType="post" entityId="p1" source={{ kind: "community", label: "X" }} />)

        fireEvent.click(screen.getByRole("button"))

        // optimistic flip fires synchronously
        expect(hoisted.toggleSaved).toHaveBeenCalledTimes(1)
        expect(hoisted.toggleSaved).toHaveBeenCalledWith({
            entityType: "post",
            entityId: "p1",
            source: { kind: "community", label: "X" },
        })
        await waitFor(() => expect(hoisted.bookmarkPost).toHaveBeenCalledWith("p1"))
        expect(hoisted.unbookmarkPost).not.toHaveBeenCalled()
    })

    it("un-saving a saved post calls DELETE unbookmark", async () => {
        hoisted.saved = true
        render(<SaveButton entityType="post" entityId="p2" />)

        fireEvent.click(screen.getByRole("button"))

        await waitFor(() => expect(hoisted.unbookmarkPost).toHaveBeenCalledWith("p2"))
        expect(hoisted.bookmarkPost).not.toHaveBeenCalled()
    })

    it("reverts the optimistic flip and toasts when the REST call rejects", async () => {
        hoisted.bookmarkPost.mockRejectedValue(new Error("network"))
        render(<SaveButton entityType="post" entityId="p3" />)

        await act(async () => {
            fireEvent.click(screen.getByRole("button"))
        })

        // one flip to save + one flip to revert = two toggles
        await waitFor(() => expect(hoisted.toggleSaved).toHaveBeenCalledTimes(2))
        expect(hoisted.toastDanger).toHaveBeenCalledWith("savedItems.saveFailed")
    })

    it("does NOT call REST for non-post entities (local store only)", async () => {
        render(<SaveButton entityType="course" entityId="c1" />)

        await act(async () => {
            fireEvent.click(screen.getByRole("button"))
        })

        expect(hoisted.toggleSaved).toHaveBeenCalledTimes(1)
        expect(hoisted.bookmarkPost).not.toHaveBeenCalled()
        expect(hoisted.unbookmarkPost).not.toHaveBeenCalled()
    })

    it("guests get the sign-in modal and never toggle or call REST", async () => {
        hoisted.authenticated = false
        render(<SaveButton entityType="post" entityId="p4" />)

        await act(async () => {
            fireEvent.click(screen.getByRole("button"))
        })

        expect(hoisted.openAuth).toHaveBeenCalled()
        expect(hoisted.toggleSaved).not.toHaveBeenCalled()
        expect(hoisted.bookmarkPost).not.toHaveBeenCalled()
    })
})

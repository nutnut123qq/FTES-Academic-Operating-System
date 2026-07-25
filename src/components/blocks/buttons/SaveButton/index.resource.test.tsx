import React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Component — {@link SaveButton}, RESOURCE branch (resource-hub wiring).
 *
 * Resources now have a real backend bookmark: `PUT/DELETE
 * /api/v1/resources/{id}/bookmark`, with the saved-state hydrated from
 * `GET /api/v1/resources/me/bookmarks`. These tests pin:
 *  - saving calls PUT and flips the icon optimistically (aria-pressed),
 *  - un-saving a server-bookmarked resource calls DELETE,
 *  - a rejected call ROLLS BACK to server truth (icon + local store) and toasts,
 *  - the local saved-items store is kept in sync so `/saved` still lists the row,
 *  - guests never toggle or call REST.
 */

const hoisted = vi.hoisted(() => ({
    authenticated: true,
    storeSaved: false,
    bookmarkedIds: undefined as Set<string> | undefined,
    toggleSaved: vi.fn(),
    mutateBookmarks: vi.fn(async () => undefined),
    bookmarkResource: vi.fn<(id: string) => Promise<unknown>>(),
    unbookmarkResource: vi.fn<(id: string) => Promise<unknown>>(),
    bookmarkPost: vi.fn<(id: string) => Promise<void>>(),
    unbookmarkPost: vi.fn<(id: string) => Promise<void>>(),
    toastDanger: vi.fn(),
    openAuth: vi.fn(),
    dispatch: vi.fn(),
    setTab: vi.fn(),
    bookmarksEnabled: [] as Array<boolean>,
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
    useIsSaved: () => hoisted.storeSaved,
    useSavedItemsStore: (selector: (state: unknown) => unknown) =>
        selector({ toggleSaved: hoisted.toggleSaved }),
}))

vi.mock("@/modules/api/rest/community/community", () => ({
    bookmarkPost: (id: string) => hoisted.bookmarkPost(id),
    unbookmarkPost: (id: string) => hoisted.unbookmarkPost(id),
}))

vi.mock("@/modules/api/rest/resource", () => ({
    bookmarkResource: (id: string) => hoisted.bookmarkResource(id),
    unbookmarkResource: (id: string) => hoisted.unbookmarkResource(id),
}))

vi.mock("./useResourceBookmarksSwr", () => ({
    useResourceBookmarksSwr: (enabled: boolean) => {
        hoisted.bookmarksEnabled.push(enabled)
        return {
            bookmarkedIds: hoisted.bookmarkedIds,
            isLoading: false,
            mutate: hoisted.mutateBookmarks,
        }
    },
}))

import { SaveButton } from "./index"

describe("SaveButton — resource branch", () => {
    beforeEach(() => {
        hoisted.authenticated = true
        hoisted.storeSaved = false
        hoisted.bookmarkedIds = new Set<string>()
        hoisted.bookmarksEnabled = []
        hoisted.bookmarkResource.mockResolvedValue({ active: true })
        hoisted.unbookmarkResource.mockResolvedValue({ active: false })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it("saving a resource calls PUT bookmark and flips the icon optimistically", async () => {
        render(<SaveButton entityType="resource" entityId="r1" />)
        const button = screen.getByRole("button")
        expect(button.getAttribute("aria-pressed")).toBe("false")

        await act(async () => {
            fireEvent.click(button)
        })

        expect(hoisted.bookmarkResource).toHaveBeenCalledWith("r1")
        expect(hoisted.unbookmarkResource).not.toHaveBeenCalled()
        // local store kept in sync for the /saved library
        expect(hoisted.toggleSaved).toHaveBeenCalledTimes(1)
        expect(hoisted.toggleSaved).toHaveBeenCalledWith({
            entityType: "resource",
            entityId: "r1",
            source: undefined,
        })
        // the shared bookmark cache is patched, not blindly refetched
        expect(hoisted.mutateBookmarks).toHaveBeenCalledTimes(1)
        // the bookmarks hook is only active for resources
        expect(hoisted.bookmarksEnabled.every((value) => value === true)).toBe(true)
    })

    it("un-saving a server-bookmarked resource calls DELETE bookmark", async () => {
        hoisted.bookmarkedIds = new Set<string>(["r2"])
        hoisted.storeSaved = true
        render(<SaveButton entityType="resource" entityId="r2" />)
        const button = screen.getByRole("button")
        expect(button.getAttribute("aria-pressed")).toBe("true")

        await act(async () => {
            fireEvent.click(button)
        })

        expect(hoisted.unbookmarkResource).toHaveBeenCalledWith("r2")
        expect(hoisted.bookmarkResource).not.toHaveBeenCalled()
    })

    it("rolls back to server truth (icon + store) and toasts when the call rejects", async () => {
        hoisted.bookmarkResource.mockRejectedValue(new Error("network"))
        render(<SaveButton entityType="resource" entityId="r3" />)
        const button = screen.getByRole("button")

        await act(async () => {
            fireEvent.click(button)
        })

        // one flip to save + one flip back = two store toggles
        await waitFor(() => expect(hoisted.toggleSaved).toHaveBeenCalledTimes(2))
        expect(hoisted.toastDanger).toHaveBeenCalledWith("savedItems.saveFailed")
        // the optimistic override is dropped → the icon shows server truth again
        expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("false")
        expect(hoisted.mutateBookmarks).not.toHaveBeenCalled()
    })

    it("does not double-fire while a bookmark call is in flight", async () => {
        let release: (() => void) | undefined
        hoisted.bookmarkResource.mockImplementation(
            () =>
                new Promise((resolve) => {
                    release = () => resolve({ active: true })
                }),
        )
        render(<SaveButton entityType="resource" entityId="r5" />)
        const button = screen.getByRole("button")

        fireEvent.click(button)
        fireEvent.click(button)

        expect(hoisted.bookmarkResource).toHaveBeenCalledTimes(1)
        await act(async () => {
            release?.()
        })
    })

    it("guests get the sign-in modal and never toggle or call REST", async () => {
        hoisted.authenticated = false
        render(<SaveButton entityType="resource" entityId="r4" />)

        await act(async () => {
            fireEvent.click(screen.getByRole("button"))
        })

        expect(hoisted.openAuth).toHaveBeenCalled()
        expect(hoisted.toggleSaved).not.toHaveBeenCalled()
        expect(hoisted.bookmarkResource).not.toHaveBeenCalled()
    })
})

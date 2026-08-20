import React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { GroupEventRow } from "./useGroupEventRowsSwr"

/**
 * Component — {@link GroupEvents} create flow.
 *
 * Pins the two things the create path must get right:
 *  - the `datetime-local` field is converted to the ISO-8601 instant the BE
 *    `EventRequest` expects (a naive local string would be rejected / mis-scheduled),
 *  - after a successful POST the events cache is REVALIDATED rather than patched by
 *    hand, so the new row arrives with its server-truth `attendeeCount`/`attending`.
 *
 * `t` echoes the key, so assertions key off message ids.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "vi",
}))

vi.mock("next/navigation", () => ({
    useParams: () => ({ groupId: "group-1" }),
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
        [key: string]: unknown
    }) => (
        <button
            type="button"
            disabled={isDisabled}
            onClick={onPress}
            aria-label={rest["aria-label"] as string | undefined}
        >
            {children}
        </button>
    ),
    Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/components/blocks/skeleton/Skeleton", () => ({
    Skeleton: Object.assign(() => <div />, { Typography: () => <div /> }),
}))

vi.mock("@/components/reuseable/PostEngagementBar", () => ({
    ConfirmDialog: () => null,
}))

vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({ requireAuth: () => true, requireAuthAsync: async () => true }),
}))
vi.mock("@/modules/toast/hooks", () => ({
    useRestWithToast: () => async <T,>(action: () => Promise<T>) => action(),
}))

vi.mock("@/redux/hooks", () => ({
    useAppSelector: () => "owner-1",
}))

vi.mock("../hooks/useQueryGroupSwr", () => ({
    useQueryGroupSwr: () => ({ group: { id: "group-1", ownerId: "owner-1" } }),
}))
vi.mock("../hooks/useQueryGroupMembersSwr", () => ({
    useQueryGroupMembersSwr: () => ({ members: [{ id: "owner-1", role: "owner" }] }),
}))
vi.mock("../hooks/useMutateAttendGroupEventSwr", () => ({
    useMutateAttendGroupEventSwr: () => vi.fn(),
}))

const events: Array<GroupEventRow> = []
const mutate = vi.fn()
vi.mock("./useGroupEventRowsSwr", () => ({
    useGroupEventRowsSwr: () => ({ events, isLoading: false, error: undefined, mutate }),
}))

const triggerCreate = vi.fn()
vi.mock("./useMutateGroupEventsSwr", () => ({
    usePostCreateGroupEventSwr: () => ({ trigger: triggerCreate }),
    usePatchGroupEventSwr: () => ({ trigger: vi.fn() }),
    useDeleteGroupEventSwr: () => ({ trigger: vi.fn() }),
}))

import { GroupEvents } from "./index"

beforeEach(() => {
    mutate.mockReset()
    triggerCreate.mockReset()
    triggerCreate.mockResolvedValue({ id: "event-9" })
})

describe("GroupEvents — create", () => {
    it("posts the ISO instant and revalidates the events cache", async () => {
        render(<GroupEvents />)

        fireEvent.click(screen.getByText("events.create"))

        fireEvent.change(screen.getByLabelText("events.titleField"), {
            target: { value: "Buổi ôn tập" },
        })
        fireEvent.change(screen.getByLabelText("events.descriptionField"), {
            target: { value: "Ôn chương 3" },
        })
        fireEvent.change(screen.getByLabelText("events.locationField"), {
            target: { value: "Phòng B201" },
        })
        fireEvent.change(screen.getByLabelText("events.startsAtField"), {
            target: { value: "2026-08-01T09:00" },
        })

        await act(async () => {
            fireEvent.click(screen.getByText("events.submit"))
        })

        expect(triggerCreate).toHaveBeenCalledTimes(1)
        expect(triggerCreate).toHaveBeenCalledWith({
            id: "group-1",
            request: {
                title: "Buổi ôn tập",
                description: "Ôn chương 3",
                location: "Phòng B201",
                startsAt: new Date("2026-08-01T09:00").toISOString(),
                endsAt: undefined,
            },
        })
        // server truth wins: the list re-fetches instead of being patched by hand
        expect(mutate).toHaveBeenCalled()
        // the composer closed again
        expect(screen.getByText("events.create")).toBeTruthy()
    })

    it("keeps the submit button disabled until the required fields are filled", () => {
        render(<GroupEvents />)
        fireEvent.click(screen.getByText("events.create"))

        const submit = screen.getByText("events.submit") as HTMLButtonElement
        expect(submit.disabled).toBe(true)
    })
})

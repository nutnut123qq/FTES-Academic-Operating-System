import React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { GroupAnnouncementRow } from "./useGroupAnnouncementRowsSwr"

/**
 * Component — {@link GroupAnnouncement} owner gate.
 *
 * Announcement writes are `group.manage` on the BE, so the tab must only offer the
 * composer and the per-card edit/delete actions to the group OWNER
 * (`group.ownerId === currentUserId`, the same signal the feed's pin affordance
 * uses). A member/guest must see the exact same read-only list with no write
 * affordance that could only 403.
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

// The announcement body renders through MarkdownContent, which drags in the whole
// markdown stack (shiki, mermaid, HeroUI Table/Link). Nothing here asserts on markdown
// rendering — echo the raw body so text assertions still work.
vi.mock("@/components/reuseable/MarkdownContent", () => ({
    MarkdownContent: ({ markdown }: { markdown?: string }) => <div>{markdown}</div>,
}))

// HeroUI primitives → trivial renderers that keep aria-label + press wiring.
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
    Chip: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    Checkbox: Object.assign(
        ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
        {
            Control: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
            Indicator: () => <span />,
            Content: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
        },
    ),
    Label: ({ children }: { children?: React.ReactNode }) => <label>{children}</label>,
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

// Auth + toast: transparent pass-through so the gate under test is the ONLY gate.
vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({ requireAuth: () => true }),
}))
vi.mock("@/modules/toast/hooks", () => ({
    useRestWithToast: () => async <T,>(action: () => Promise<T>) => action(),
}))

let currentUserId: string | undefined
vi.mock("@/redux/hooks", () => ({
    useAppSelector: () => currentUserId,
}))

vi.mock("../hooks/useQueryGroupSwr", () => ({
    useQueryGroupSwr: () => ({ group: { id: "group-1", ownerId: "owner-1" } }),
}))

const announcementRows: Array<GroupAnnouncementRow> = [
    {
        id: "ann-1",
        title: "Lịch thi giữa kỳ",
        body: "Thi vào thứ 6.",
        pinned: true,
        timeLabel: "2 giờ trước",
    },
]
const mutate = vi.fn()
vi.mock("./useGroupAnnouncementRowsSwr", () => ({
    useGroupAnnouncementRowsSwr: () => ({
        announcements: announcementRows,
        isLoading: false,
        error: undefined,
        mutate,
    }),
}))

const triggerCreate = vi.fn()
vi.mock("@/hooks/swr/api/rest/mutations/usePostCreateGroupAnnouncementSwr", () => ({
    usePostCreateGroupAnnouncementSwr: () => ({ trigger: triggerCreate }),
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePatchGroupAnnouncementSwr", () => ({
    usePatchGroupAnnouncementSwr: () => ({ trigger: vi.fn() }),
}))
vi.mock("@/hooks/swr/api/rest/mutations/useDeleteGroupAnnouncementSwr", () => ({
    useDeleteGroupAnnouncementSwr: () => ({ trigger: vi.fn() }),
}))

import { GroupAnnouncement } from "./index"

beforeEach(() => {
    mutate.mockReset()
    triggerCreate.mockReset()
})

describe("GroupAnnouncement — owner gate", () => {
    it("offers the composer and per-card actions to the group owner", () => {
        currentUserId = "owner-1"
        render(<GroupAnnouncement />)

        expect(screen.getByText("announcements.create")).toBeTruthy()
        expect(screen.getByLabelText("announcements.edit")).toBeTruthy()
        expect(screen.getByLabelText("announcements.delete")).toBeTruthy()
    })

    it("hides every write affordance from a non-owner, keeping the list readable", () => {
        currentUserId = "member-2"
        render(<GroupAnnouncement />)

        expect(screen.queryByText("announcements.create")).toBeNull()
        expect(screen.queryByLabelText("announcements.edit")).toBeNull()
        expect(screen.queryByLabelText("announcements.delete")).toBeNull()
        // the announcement itself still renders
        expect(screen.getByText("Lịch thi giữa kỳ")).toBeTruthy()
    })

    it("hides the composer from a signed-out viewer", () => {
        currentUserId = undefined
        render(<GroupAnnouncement />)

        expect(screen.queryByText("announcements.create")).toBeNull()
    })
})

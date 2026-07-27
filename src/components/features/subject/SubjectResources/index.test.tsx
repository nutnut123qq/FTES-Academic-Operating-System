import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — the Resources tab's "ask AI about this document" entry point.
 *
 * The tab used to render rows with no id worth routing on; now every row carries a
 * real resource UUID. The contract pinned here: the sparkle action routes to
 * `/resources/{id}?ask=1` (the detail surface opens its AI panel on `ask=1`), it is
 * auth-gated (guests get the sign-in modal, no navigation), and it is disabled for a
 * row that is not a real resource.
 */

const push = vi.fn()
let authenticated = true

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "vi",
}))
vi.mock("next/navigation", () => ({ useParams: () => ({ subjectId: "prf192" }) }))
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({
        authenticated,
        requireAuth: () => authenticated,
        guard:
            (action: (...args: Array<never>) => void) =>
                (...args: Array<never>) => {
                    if (authenticated) {
                        action(...args)
                    }
                },
    }),
}))

vi.mock("@heroui/react", () => ({
    Button: ({
        children,
        onPress,
        isDisabled,
        "aria-label": ariaLabel,
    }: {
        children?: React.ReactNode
        onPress?: () => void
        isDisabled?: boolean
        "aria-label"?: string
    }) => (
        <button type="button" aria-label={ariaLabel} disabled={isDisabled} onClick={onPress}>
            {children}
        </button>
    ),
    Link: ({
        children,
        onPress,
        "aria-label": ariaLabel,
    }: {
        children?: React.ReactNode
        onPress?: () => void
        "aria-label"?: string
    }) => (
        <a aria-label={ariaLabel} onClick={onPress}>
            {children}
        </a>
    ),
    Chip: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
    toast: { danger: vi.fn(), success: vi.fn() },
}))
vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <span />
    return { FolderIcon: Icon, LockSimpleIcon: Icon, SparkleIcon: Icon }
})
vi.mock("../hooks/useQuerySubjectSwr", () => ({
    useQuerySubjectSwr: () => ({
        subject: { courseLinks: [{ id: "course-9", title: "PRF192", pinned: true }] },
    }),
}))
vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock("@/components/blocks/skeleton/Skeleton", () => ({ Skeleton: () => <div /> }))
vi.mock("@/components/blocks/buttons/SaveButton", () => ({
    SaveButton: ({ entityType, entityId }: { entityType: string; entityId: string }) => (
        <button type="button" aria-label={`save-${entityType}-${entityId}`} />
    ),
}))
vi.mock("@/modules/api/rest/resource", () => ({ downloadResourceFile: vi.fn() }))
vi.mock("@/modules/api/rest/client", () => ({
    RestError: class RestError extends Error {
        status: number
        constructor(message: string, status: number) {
            super(message)
            this.status = status
        }
    },
}))

const resources = [
    {
        id: "res-1",
        title: "Giáo trình PRF192",
        type: "pdf" as const,
        isResource: true,
        downloadCount: 12,
        rating: 4.5,
        ratingCount: 3,
        createdAt: "2026-07-01T00:00:00Z",
        visibility: "PUBLIC",
        lockedForViewer: false,
    },
    {
        id: "link-1",
        title: "Bài giảng liên kết",
        type: "notes" as const,
        isResource: false,
        downloadCount: 0,
        rating: null,
        ratingCount: 0,
        createdAt: null,
        visibility: "PUBLIC",
        lockedForViewer: false,
    },
    {
        id: "res-locked",
        title: "Đề thi cuối kỳ",
        type: "pdf" as const,
        isResource: true,
        downloadCount: 0,
        rating: null,
        ratingCount: 0,
        createdAt: null,
        visibility: "ENROLLED_ONLY",
        lockedForViewer: true,
    },
]

vi.mock("../hooks/useQuerySubjectResourcesSwr", () => ({
    SUBJECT_RESOURCE_TYPES: ["pdf", "notes"],
    useQuerySubjectResourcesSwr: () => ({
        resources,
        collections: [],
        isLoading: false,
        isValidating: false,
        error: undefined,
        mutate: vi.fn(),
    }),
}))

import { SubjectResources, resourceAskAiHref } from "./index"

beforeEach(() => {
    push.mockReset()
    authenticated = true
})

describe("SubjectResources — ask AI", () => {
    it("builds the ask-AI route from the real resource id", () => {
        expect(resourceAskAiHref("res-1")).toBe("/resources/res-1?ask=1")
    })

    it("routes to /resources/{id}?ask=1 when the sparkle action is pressed", () => {
        render(<SubjectResources />)

        const [askButton] = screen.getAllByLabelText("resources.askAi")
        fireEvent.click(askButton)

        expect(push).toHaveBeenCalledWith("/resources/res-1?ask=1")
    })

    it("disables the action on a row that is not a real resource", () => {
        render(<SubjectResources />)

        const [, secondAsk] = screen.getAllByLabelText("resources.askAi")
        expect((secondAsk as HTMLButtonElement).disabled).toBe(true)
    })

    it("does not navigate for a guest (the auth guard swallows the press)", () => {
        authenticated = false
        render(<SubjectResources />)

        const [askButton] = screen.getAllByLabelText("resources.askAi")
        fireEvent.click(askButton)

        expect(push).not.toHaveBeenCalled()
    })
})

describe("SubjectResources — locked material (CONTRACT B)", () => {
    it("badges a lockedForViewer row and never exposes its download / ask-AI actions", () => {
        render(<SubjectResources />)

        // the lock badge is shown
        expect(screen.getByText("resources.lockedBadge")).toBeTruthy()
        // only the two UNLOCKED rows expose the body/URL affordances (no leak on the locked row)
        expect(screen.getAllByLabelText("resources.askAi")).toHaveLength(2)
    })

    it("routes the locked row click to the subject's linked course buy page", () => {
        render(<SubjectResources />)

        const lockedRow = screen.getByLabelText("Đề thi cuối kỳ — resources.lockedAria")
        fireEvent.click(lockedRow)

        expect(push).toHaveBeenCalledWith("/courses/course-9")
    })
})

import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ModerationReport } from "../hooks/useQueryReportsSwr"

/**
 * Component — the moderation queue's "Chuyển cấp" (escalate) control.
 *
 * Escalation addresses the REPORT (`POST /community/reports/{reportId}/escalate`), NOT
 * the queue row: the BE returns `reportId` as a NULLABLE field, and a row raised by AI /
 * the system with no open report behind it has nothing to escalate. So what is pinned
 * here is the gate plus the id that actually travels:
 *  - a row WITHOUT `reportId` shows keep/remove only — no escalate button at all,
 *  - a row WITH one shows it and hands the REPORT id (never the queue-row id) to the write,
 *  - keep/remove keep addressing the queue-row id.
 *
 * `t` echoes the key, so assertions key off message ids.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "vi",
}))

vi.mock("@heroui/react", () => ({
    Button: ({
        children,
        onPress,
    }: {
        children?: React.ReactNode
        onPress?: () => void
    }) => (
        <button type="button" onClick={onPress}>
            {children}
        </button>
    ),
    Chip: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    Skeleton: () => <div />,
    Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock("@phosphor-icons/react", () => ({
    ArrowSquareOutIcon: () => <span />,
}))

vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/i18n/navigation", () => ({
    Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
}))

vi.mock("@/hooks/useHasPermission", () => ({ useHasPermission: () => true }))

let reports: Array<ModerationReport> = []
vi.mock("../hooks/useQueryReportsSwr", () => ({
    useQueryReportsSwr: () => ({
        reports,
        isLoading: false,
        error: undefined,
        mutate: vi.fn(),
    }),
}))

const decide = vi.fn()
const escalate = vi.fn()
let escalatedIds: Array<string> = []
vi.mock("../hooks/useMutateModerationDecisionSwr", () => ({
    useMutateModerationDecisionSwr: () => decide,
}))
vi.mock("../hooks/useMutateEscalateReportSwr", () => ({
    useMutateEscalateReportSwr: () => escalate,
    useEscalatedReports: () => (reportId?: string | null) =>
        Boolean(reportId) && escalatedIds.includes(reportId as string),
}))

import { CommunityModeration } from "./index"

const row = (overrides: Partial<ModerationReport> = {}): ModerationReport => ({
    id: "queue-1",
    targetType: "POST",
    targetId: "post-1",
    source: "REPORT",
    status: "PENDING",
    ...overrides,
})

beforeEach(() => {
    reports = []
    escalatedIds = []
    decide.mockReset()
    escalate.mockReset()
})

describe("CommunityModeration — escalate", () => {
    it("hides the escalate button on a row with no report behind it", () => {
        reports = [row({ reportId: undefined, source: "AI" })]
        render(<CommunityModeration />)

        expect(screen.queryByText("moderation.escalate")).toBeNull()
        // the decision controls are unaffected
        expect(screen.getByText("moderation.keep")).toBeTruthy()
        expect(screen.getByText("moderation.remove")).toBeTruthy()
    })

    it("escalates with the REPORT id, not the queue-row id", () => {
        reports = [row({ reportId: "report-9" })]
        render(<CommunityModeration />)

        fireEvent.click(screen.getByText("moderation.escalate"))
        expect(escalate).toHaveBeenCalledWith("report-9")
    })

    it("swaps the button for a chip on a row already escalated (a second press only 409s)", () => {
        reports = [row({ reportId: "report-9" })]
        escalatedIds = ["report-9"]
        render(<CommunityModeration />)

        expect(screen.queryByText("moderation.escalate")).toBeNull()
        expect(screen.getByText("moderation.escalatedTag")).toBeTruthy()
        // the row is NOT gone: the BE leaves the queue item PENDING, it still needs a decision
        expect(screen.getByText("moderation.keep")).toBeTruthy()
        expect(screen.getByText("moderation.remove")).toBeTruthy()
    })

    it("keeps addressing decisions by the queue-row id", () => {
        reports = [row({ reportId: "report-9" })]
        render(<CommunityModeration />)

        fireEvent.click(screen.getByText("moderation.remove"))
        expect(decide).toHaveBeenCalledWith("queue-1", "REMOVE")
    })

    it("shows the escalate button only on the rows that carry a report id", () => {
        reports = [
            row({ id: "queue-1", reportId: "report-1" }),
            row({ id: "queue-2", targetId: "post-2", source: "AI" }),
        ]
        render(<CommunityModeration />)

        expect(screen.getAllByText("moderation.escalate")).toHaveLength(1)
        expect(screen.getAllByText("moderation.keep")).toHaveLength(2)
    })
})

import React from "react"
import useSWR, { SWRConfig } from "swr"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — {@link useMutateEscalateReportSwr} + {@link useEscalatedReports}.
 *
 * What is pinned here is the BE truth this FE has to live with: `escalate` moves the
 * REPORT to `IN_REVIEW` and does NOT touch `moderation_queue_items`, and a row created
 * from a report keeps its `report_id` link forever — so the queue keeps returning the row
 * (PENDING, still carrying a reportId) after a successful escalation.
 *
 * Therefore:
 *  - the row is NOT dropped from the queue cache (it used to be, and came straight back
 *    on the next revalidate with its button armed for a guaranteed 409),
 *  - the report id is remembered so the row renders as "đã chuyển cấp" ACROSS refetches,
 *  - 409 ("already escalated") marks it too — that is the outcome the moderator wanted,
 *  - a real failure (403) marks nothing.
 */

const escalateReport = vi.fn()
const toastSuccess = vi.fn()
const toastWarning = vi.fn()
const toastDanger = vi.fn()

vi.mock("@/modules/api/rest/community", () => ({
    escalateReport: (reportId: string) => escalateReport(reportId),
}))

vi.mock("@heroui/react", () => ({
    toast: {
        success: (message: string) => toastSuccess(message),
        warning: (message: string) => toastWarning(message),
        danger: (message: string) => toastDanger(message),
    },
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

import { RestError } from "@/modules/api/rest/client"
import { MODERATION_QUEUE_KEY, type ModerationReport } from "./useQueryReportsSwr"
import { useEscalatedReports, useMutateEscalateReportSwr } from "./useMutateEscalateReportSwr"

const REPORT_ID = "report-9"

const queueRow: ModerationReport = {
    id: "queue-1",
    reportId: REPORT_ID,
    targetType: "POST",
    targetId: "post-1",
    source: "REPORT",
    status: "PENDING",
}

/** Reads the queue cache + the escalated marker and drives the write from one render. */
const Probe = () => {
    const escalate = useMutateEscalateReportSwr()
    const isEscalated = useEscalatedReports()
    // the real queue cache entry, answered by a fetcher that keeps returning the same
    // PENDING row — exactly what the BE does after an escalation
    const { data, mutate } = useSWR<Array<ModerationReport>>(MODERATION_QUEUE_KEY, async () => [
        queueRow,
    ])
    return (
        <div>
            <span data-testid="rows">{String(data?.length ?? 0)}</span>
            <span data-testid="marked">{String(isEscalated(REPORT_ID))}</span>
            <button type="button" onClick={() => void escalate(REPORT_ID)}>
                escalate
            </button>
            {/* stands in for a queue revalidate landing the row again */}
            <button type="button" onClick={() => void mutate()}>
                refetch
            </button>
        </div>
    )
}

const renderProbe = () =>
    render(
        <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
            <Probe />
        </SWRConfig>,
    )

beforeEach(() => {
    escalateReport.mockReset()
    toastSuccess.mockReset()
    toastWarning.mockReset()
    toastDanger.mockReset()
})

describe("useMutateEscalateReportSwr", () => {
    it("marks the report escalated and leaves the queue row in place", async () => {
        escalateReport.mockResolvedValue(undefined)

        renderProbe()
        await waitFor(() => expect(screen.getByTestId("rows").textContent).toBe("1"))
        expect(screen.getByTestId("marked").textContent).toBe("false")

        await act(async () => {
            fireEvent.click(screen.getByText("escalate"))
        })

        await waitFor(() => expect(screen.getByTestId("marked").textContent).toBe("true"))
        expect(escalateReport).toHaveBeenCalledWith(REPORT_ID)
        // the row still needs a keep/remove decision — escalation does not resolve it
        expect(screen.getByTestId("rows").textContent).toBe("1")
        expect(toastSuccess).toHaveBeenCalledWith("moderation.escalated")
    })

    it("keeps the mark across a queue revalidate", async () => {
        escalateReport.mockResolvedValue(undefined)
        renderProbe()

        await act(async () => {
            fireEvent.click(screen.getByText("escalate"))
        })
        await waitFor(() => expect(screen.getByTestId("marked").textContent).toBe("true"))

        await act(async () => {
            fireEvent.click(screen.getByText("refetch"))
        })

        expect(screen.getByTestId("marked").textContent).toBe("true")
    })

    it("treats 409 (already escalated) as escalated", async () => {
        escalateReport.mockRejectedValue(new RestError("already", 409))
        renderProbe()

        await act(async () => {
            fireEvent.click(screen.getByText("escalate"))
        })

        await waitFor(() => expect(screen.getByTestId("marked").textContent).toBe("true"))
        expect(toastWarning).toHaveBeenCalledWith("moderation.escalateAlready")
    })

    it("marks nothing when the write really fails", async () => {
        escalateReport.mockRejectedValue(new RestError("forbidden", 403))
        renderProbe()

        await act(async () => {
            fireEvent.click(screen.getByText("escalate"))
        })

        expect(screen.getByTestId("marked").textContent).toBe("false")
        expect(toastDanger).toHaveBeenCalled()
    })
})

/** The queue key is exported for the decision hook; escalation must not write to it. */
describe("MODERATION_QUEUE_KEY", () => {
    it("stays the shared queue key", () => {
        expect(MODERATION_QUEUE_KEY).toEqual(["community-moderation-queue"])
    })
})

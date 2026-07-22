import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { UseAiToolJobReturn } from "../../hooks/useAiToolJob"

/**
 * Component — {@link AiJobFeedback} (`ai-hub-live-tools` tasks 3.4/3.5): the
 * shared non-result state panel. A hand-built job object drives each state,
 * pinning the documented priority (quota → submit error → job FAILED → busy) and
 * the retry affordances:
 *  - quota-exhausted shows the distinct quota message,
 *  - a submit error shows its message with a retry that re-runs the submit,
 *  - a FAILED job surfaces the BE `errorMessage` (fallback `failed`),
 *  - busy shows the running spinner copy; + stale adds the 90s hint whose
 *    refresh button revalidates the poll (not a resubmit),
 *  - idle (nothing submitted / result ready) renders nothing.
 *
 * `t` echoes bare keys (`aiPlatform.toolPages.states` namespace).
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@heroui/react", () => ({
    Button: ({
        children,
        onPress,
    }: {
        children: React.ReactNode
        onPress?: () => void
    }) => (
        <button type="button" onClick={onPress}>
            {children}
        </button>
    ),
    Spinner: () => <div data-testid="spinner" />,
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock("@phosphor-icons/react", () => ({
    WarningCircleIcon: () => <span />,
}))

import { AiJobFeedback } from "./index"

type Job = UseAiToolJobReturn<unknown>

const makeJob = (over: {
    isQuota?: boolean
    submitError?: Error
    isBusy?: boolean
    poll?: Partial<Job["poll"]>
}): Job => ({
    run: vi.fn(),
    reset: vi.fn(),
    isSubmitting: false,
    submitError: over.submitError,
    isQuota: over.isQuota ?? false,
    jobId: null,
    isBusy: over.isBusy ?? false,
    poll: {
        job: undefined,
        status: undefined,
        result: undefined,
        isRunning: false,
        isComplete: false,
        isFailed: false,
        isStale: false,
        error: undefined,
        isLoading: false,
        refresh: vi.fn(),
        ...over.poll,
    },
})

afterEach(() => {
    vi.clearAllMocks()
})

describe("AiJobFeedback", () => {
    it("renders nothing while idle (nothing submitted)", () => {
        const { container } = render(
            <AiJobFeedback job={makeJob({})} onRetry={vi.fn()} />,
        )
        expect(container.textContent).toBe("")
    })

    it("shows the distinct quota message with a retry, beating a generic submit error", () => {
        const onRetry = vi.fn()
        render(
            <AiJobFeedback
                job={makeJob({ isQuota: true, submitError: new Error("429") })}
                onRetry={onRetry}
            />,
        )
        expect(screen.getByText("quota")).toBeTruthy()
        expect(screen.queryByText("429")).toBeNull()
        fireEvent.click(screen.getByText("retry"))
        expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it("shows a submit error's message with a retry", () => {
        const onRetry = vi.fn()
        render(
            <AiJobFeedback
                job={makeJob({ submitError: new Error("network down") })}
                onRetry={onRetry}
            />,
        )
        expect(screen.getByText("network down")).toBeTruthy()
        fireEvent.click(screen.getByText("retry"))
        expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it("surfaces the BE errorMessage of a FAILED job (fallback `failed`)", () => {
        render(
            <AiJobFeedback
                job={makeJob({
                    poll: {
                        isFailed: true,
                        job: {
                            id: "job-1",
                            feature: "SUMMARY" as never,
                            status: "FAILED",
                            errorMessage: "Provider unavailable",
                        },
                    },
                })}
                onRetry={vi.fn()}
            />,
        )
        expect(screen.getByText("Provider unavailable")).toBeTruthy()

        render(
            <AiJobFeedback
                job={makeJob({ poll: { isFailed: true } })}
                onRetry={vi.fn()}
            />,
        )
        expect(screen.getByText("failed")).toBeTruthy()
    })

    it("shows the running spinner while busy, without the stale hint", () => {
        render(<AiJobFeedback job={makeJob({ isBusy: true })} onRetry={vi.fn()} />)
        expect(screen.getByTestId("spinner")).toBeTruthy()
        expect(screen.getByText("running")).toBeTruthy()
        expect(screen.queryByText("stale")).toBeNull()
    })

    it("adds the stale hint after 90s and its refresh revalidates the poll (not a resubmit)", () => {
        const onRetry = vi.fn()
        const job = makeJob({ isBusy: true, poll: { isStale: true, isRunning: true } })
        render(<AiJobFeedback job={job} onRetry={onRetry} />)
        expect(screen.getByText("stale")).toBeTruthy()
        fireEvent.click(screen.getByText("retry"))
        expect(job.poll.refresh).toHaveBeenCalledTimes(1)
        expect(onRetry).not.toHaveBeenCalled()
    })
})

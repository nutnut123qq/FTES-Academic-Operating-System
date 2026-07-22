import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { RestError } from "@/modules/api/rest/client"

/**
 * Component — the challenge submission surface (learn-exercises-wire task 4.7 quality
 * loop). Pins the access gate: a course-bank `CHALLENGE_COURSE_ACCESS_DENIED` (403)
 * renders the enroll CTA routed to the COURSE page (enroll rule — never "VIP"), while
 * any other error keeps the generic error state. Also pins the MCQ SubmitRequest build.
 */

const queryMock = vi.fn()
const submitTrigger = vi.fn()
const submissionMutate = vi.fn()
const push = vi.fn()

vi.mock("next/navigation", () => ({
    useParams: () => ({
        courseId: "khoa-x",
        moduleId: "m1",
        contentId: "les-1",
        challengeId: "ch-1",
    }),
}))
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push }) }))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, params?: Record<string, unknown>) =>
        params ? `${key}:${JSON.stringify(params)}` : key,
    useLocale: () => "vi",
}))

vi.mock("@heroui/react", () => {
    const Typography = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>
    Typography.Heading = ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>
    return {
        Typography,
        Button: ({
            children,
            onPress,
            isDisabled,
        }: {
            children?: React.ReactNode
            onPress?: () => void
            isDisabled?: boolean
        }) => (
            <button type="button" disabled={isDisabled} onClick={() => onPress?.()}>
                {children}
            </button>
        ),
        Chip: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
        TextField: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
        Input: ({ variant, ...rest }: { variant?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
            <input {...rest} />
        ),
        cn: (...args: Array<unknown>) => args.filter(Boolean).join(" "),
    }
})

vi.mock("@phosphor-icons/react", () => ({
    CheckSquareIcon: () => <span />,
    LockSimpleIcon: () => <span />,
    PuzzlePieceIcon: () => <span />,
    SquareIcon: () => <span />,
}))

vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({
        error,
        errorContent,
        children,
    }: {
        error?: unknown
        errorContent?: { title?: string }
        children?: React.ReactNode
    }) => (error ? <div>{errorContent?.title}</div> : <>{children}</>),
}))
vi.mock("@/components/blocks/layout/PageHeader", () => ({
    PageHeader: ({ title, actions }: { title?: React.ReactNode; actions?: React.ReactNode }) => (
        <div>
            <h1>{title}</h1>
            {actions}
        </div>
    ),
}))
vi.mock("@/components/blocks/skeleton/Skeleton", () => ({ Skeleton: () => <div /> }))
vi.mock("@/components/reuseable/MarkdownContent", () => ({
    MarkdownContent: ({ markdown }: { markdown: string }) => <div>{markdown}</div>,
}))

vi.mock("@/modules/toast/hooks", () => ({
    useRestWithToast: () => async <T,>(action: () => Promise<T>) => {
        try {
            return await action()
        } catch {
            return null
        }
    },
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePostSubmitChallengeSwr", () => ({
    usePostSubmitChallengeSwr: () => ({ trigger: submitTrigger, isMutating: false }),
}))
vi.mock("@/components/features/learn/hooks/useQueryChallengeSubmissionSwr", () => ({
    useQueryChallengeSubmissionSwr: () => queryMock(),
    isChallengeSubmissionPending: (submission: { status: string }) =>
        submission.status === "PENDING" || submission.status === "GRADING",
}))

import { ChallengeSubmission } from "./index"

const mcqChallenge = {
    id: "ch-1",
    title: "MCQ mảng C",
    slug: "ch-1",
    description: "",
    type: "MULTIPLE_CHOICE",
    mode: "SOLO",
    subjectId: "s1",
    status: "PUBLISHED",
    startsAt: "2026-01-01T00:00:00Z",
    endsAt: "2027-01-01T00:00:00Z",
    maxSubmissions: 3,
    mcqQuestions: [
        {
            id: "q1",
            question: "Mảng bắt đầu từ?",
            options: [
                { key: "A", text: "0" },
                { key: "B", text: "1" },
            ],
            points: 1,
            orderNo: 1,
        },
    ],
}

beforeEach(() => {
    queryMock.mockReset()
    submitTrigger.mockReset()
    submissionMutate.mockReset()
    push.mockReset()
})

describe("ChallengeSubmission — access gate", () => {
    it("renders the enroll CTA on 403 CHALLENGE_COURSE_ACCESS_DENIED and routes to the course", () => {
        queryMock.mockReturnValue({
            challenge: undefined,
            submissions: [],
            isLoading: false,
            error: new RestError("denied", 403, "CHALLENGE_COURSE_ACCESS_DENIED"),
            mutate: submissionMutate,
        })
        render(<ChallengeSubmission />)

        expect(screen.getByText("exercises.challenge.lockedTitle")).toBeTruthy()
        expect(screen.getByText("exercises.challenge.lockedBody")).toBeTruthy()

        fireEvent.click(screen.getByText("reader.enrollCta"))
        // Enroll rule: the COURSE page — never a "VIP"/membership surface.
        expect(push).toHaveBeenCalledWith("/courses/khoa-x")
    })

    it("keeps the generic error state for any other failure (no enroll CTA)", () => {
        queryMock.mockReturnValue({
            challenge: undefined,
            submissions: [],
            isLoading: false,
            error: new RestError("boom", 500),
            mutate: submissionMutate,
        })
        render(<ChallengeSubmission />)

        expect(screen.getByText("exercises.challenge.error")).toBeTruthy()
        expect(screen.queryByText("exercises.challenge.lockedTitle")).toBeNull()
        expect(screen.queryByText("reader.enrollCta")).toBeNull()
    })

    it("submits an MCQ answer set as {payloadType:'MCQ', answers} when access is granted", async () => {
        queryMock.mockReturnValue({
            challenge: mcqChallenge,
            submissions: [],
            isLoading: false,
            error: undefined,
            mutate: submissionMutate,
        })
        submitTrigger.mockResolvedValue({ id: "sub-1" })
        render(<ChallengeSubmission />)

        expect(screen.getByText("exercises.challenge.submitTitle")).toBeTruthy()
        fireEvent.click(screen.getByText("0"))
        fireEvent.click(screen.getByText("exercises.challenge.submit"))

        await waitFor(() =>
            expect(submitTrigger).toHaveBeenCalledWith({
                id: "ch-1",
                request: { payloadType: "MCQ", answers: { q1: ["A"] } },
            }),
        )
        await waitFor(() => expect(submissionMutate).toHaveBeenCalled())
    })

    it("submits a CODE challenge as {payloadType:'CODE', code, language}", async () => {
        queryMock.mockReturnValue({
            challenge: { ...mcqChallenge, type: "CODE", mcqQuestions: [] },
            submissions: [],
            isLoading: false,
            error: undefined,
            mutate: submissionMutate,
        })
        submitTrigger.mockResolvedValue({ id: "sub-1" })
        render(<ChallengeSubmission />)

        fireEvent.change(screen.getByPlaceholderText("exercises.challenge.codePlaceholder"), {
            target: { value: "print(1)" },
        })
        fireEvent.click(screen.getByText("exercises.challenge.submit"))

        await waitFor(() =>
            expect(submitTrigger).toHaveBeenCalledWith({
                id: "ch-1",
                request: { payloadType: "CODE", code: "print(1)", language: "python" },
            }),
        )
    })

    it("submits an ESSAY challenge as {payloadType:'ESSAY', essayText} (trimmed)", async () => {
        queryMock.mockReturnValue({
            challenge: { ...mcqChallenge, type: "ESSAY", mcqQuestions: [] },
            submissions: [],
            isLoading: false,
            error: undefined,
            mutate: submissionMutate,
        })
        submitTrigger.mockResolvedValue({ id: "sub-1" })
        render(<ChallengeSubmission />)

        fireEvent.change(screen.getByPlaceholderText("exercises.challenge.essayPlaceholder"), {
            target: { value: "  Bài luận của tôi.  " },
        })
        fireEvent.click(screen.getByText("exercises.challenge.submit"))

        await waitFor(() =>
            expect(submitTrigger).toHaveBeenCalledWith({
                id: "ch-1",
                request: { payloadType: "ESSAY", essayText: "Bài luận của tôi." },
            }),
        )
    })
})

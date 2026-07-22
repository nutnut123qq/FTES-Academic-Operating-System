import React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { RestError } from "@/modules/api/rest/client"
import type {
    QuizAttemptResultView,
    QuizAttemptStartView,
    QuizSummaryView,
} from "@/modules/api/rest/course"

/**
 * Component — the in-lesson quiz block (learn-exercises-wire task 2.4 quality loop).
 * Pins the taking flow (start → pick answers → submit → score + pass state), the
 * countdown auto-submit at zero, and the 403 `COURSE_ACCESS_DENIED` → enroll CTA
 * (route to the COURSE, never a "VIP" surface).
 */

const quizzesMock = vi.fn()
const attemptsMutate = vi.fn()
const attemptsData = vi.fn()
const startTrigger = vi.fn()
const submitTrigger = vi.fn()
const push = vi.fn()

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
        cn: (...args: Array<unknown>) => args.filter(Boolean).join(" "),
    }
})

vi.mock("@phosphor-icons/react", () => ({
    CheckCircleIcon: () => <span />,
    CheckSquareIcon: () => <span />,
    CircleIcon: () => <span />,
    ClockIcon: () => <span />,
    ListChecksIcon: () => <span />,
    LockSimpleIcon: () => <span />,
    SquareIcon: () => <span />,
    XCircleIcon: () => <span />,
}))

vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("@/modules/toast/hooks", () => ({
    useRestWithToast: () => async <T,>(action: () => Promise<T>) => {
        try {
            return await action()
        } catch {
            return null
        }
    },
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetLessonQuizzesSwr", () => ({
    useGetLessonQuizzesSwr: () => quizzesMock(),
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetMyQuizAttemptsSwr", () => ({
    useGetMyQuizAttemptsSwr: () => ({ data: attemptsData(), mutate: attemptsMutate }),
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePostStartQuizAttemptSwr", () => ({
    usePostStartQuizAttemptSwr: () => ({ trigger: startTrigger, isMutating: false }),
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePostSubmitQuizAttemptSwr", () => ({
    usePostSubmitQuizAttemptSwr: () => ({ trigger: submitTrigger, isMutating: false }),
}))

import { LessonQuizBlock } from "./index"

const quiz = (over: Partial<QuizSummaryView> = {}): QuizSummaryView => ({
    id: "quiz-1",
    lessonId: "les-1",
    title: "Quiz chương 1",
    description: null,
    passScorePercent: 70,
    timeLimitSeconds: null,
    maxAttempts: 3,
    questionCount: 1,
    status: null,
    myAttemptCount: 0,
    myBestPercent: null,
    myPassed: null,
    ...over,
})

const startView = (over: Partial<QuizAttemptStartView> = {}): QuizAttemptStartView => ({
    attemptId: "att-1",
    attemptNo: 1,
    timeLimitSeconds: null,
    questions: [
        {
            id: "q1",
            question: "2 + 2 = ?",
            type: "SINGLE_CHOICE",
            options: [
                { key: "A", text: "4" },
                { key: "B", text: "5" },
            ],
            points: 1,
            sortOrder: 1,
        },
    ],
    ...over,
})

const resultView: QuizAttemptResultView = {
    attemptId: "att-1",
    scorePoints: 1,
    scorePercent: "80",
    passed: true,
}

beforeEach(() => {
    quizzesMock.mockReturnValue({ data: [quiz()], error: undefined })
    attemptsData.mockReturnValue([])
    attemptsMutate.mockReset()
    startTrigger.mockReset()
    submitTrigger.mockReset()
    push.mockReset()
})

afterEach(() => {
    vi.useRealTimers()
})

describe("LessonQuizBlock", () => {
    it("renders nothing when the lesson has no quizzes", () => {
        quizzesMock.mockReturnValue({ data: [], error: undefined })
        const { container } = render(<LessonQuizBlock lessonId="les-1" courseId="khoa-1" />)
        expect(container.innerHTML).toBe("")
    })

    it("shows the enroll CTA on a 403 COURSE_ACCESS_DENIED and routes to the course", () => {
        quizzesMock.mockReturnValue({
            data: undefined,
            error: new RestError("denied", 403, "COURSE_ACCESS_DENIED"),
        })
        render(<LessonQuizBlock lessonId="les-1" courseId="khoa-1" />)

        expect(screen.getByText("exercises.quiz.lockedTitle")).toBeTruthy()
        fireEvent.click(screen.getByText("reader.enrollCta"))
        // Enroll = the COURSE page, never a "VIP"/membership surface.
        expect(push).toHaveBeenCalledWith("/courses/khoa-1")
    })

    it("takes a quiz: start → pick an answer → submit → score + pass state", async () => {
        startTrigger.mockResolvedValue(startView())
        submitTrigger.mockResolvedValue(resultView)
        // earlier attempt scored 60 — distinct from the fresh result's 80
        attemptsData.mockReturnValue([
            {
                attemptId: "att-0",
                attemptNo: 1,
                startedAt: "2026-07-20T00:00:00Z",
                submittedAt: "2026-07-20T00:05:00Z",
                scorePoints: 1,
                scorePercent: "60",
                passed: false,
            },
        ])
        render(<LessonQuizBlock lessonId="les-1" courseId="khoa-1" />)

        fireEvent.click(screen.getByText("exercises.quiz.start"))
        await waitFor(() => expect(screen.getByText("2 + 2 = ?")).toBeTruthy())
        expect(startTrigger).toHaveBeenCalledWith("quiz-1")

        fireEvent.click(screen.getByText("4"))
        fireEvent.click(screen.getByText("exercises.quiz.submit"))

        // Result phase: the submitted answers reached the BE and the score renders.
        await waitFor(() =>
            expect(screen.getByText('exercises.quiz.scoreLine:{"percent":80}')).toBeTruthy(),
        )
        expect(submitTrigger).toHaveBeenCalledWith({
            attemptId: "att-1",
            request: { answers: { q1: ["A"] } },
        })
        expect(screen.getByText("exercises.quiz.passedResult")).toBeTruthy()
        // History revalidated so best/attempt counters advance.
        expect(attemptsMutate).toHaveBeenCalled()
        expect(screen.getByText('exercises.quiz.attemptLine:{"number":1}')).toBeTruthy()
    })

    it("auto-submits when the countdown reaches zero", async () => {
        startTrigger.mockResolvedValue(startView({ timeLimitSeconds: 1 }))
        submitTrigger.mockResolvedValue({ ...resultView, passed: false, scorePercent: "0" })
        render(<LessonQuizBlock lessonId="les-1" courseId="khoa-1" />)

        vi.useFakeTimers()
        fireEvent.click(screen.getByText("exercises.quiz.start"))
        // flush the start trigger → taking phase, countdown armed at 1s
        await act(async () => {})
        expect(screen.getByText("2 + 2 = ?")).toBeTruthy()

        // tick to zero → the block submits by itself (no click)
        await act(async () => {
            vi.advanceTimersByTime(1000)
        })
        await act(async () => {})

        expect(submitTrigger).toHaveBeenCalledWith({
            attemptId: "att-1",
            request: { answers: {} },
        })
        expect(screen.getByText("exercises.quiz.autoSubmitted")).toBeTruthy()
        expect(screen.getByText("exercises.quiz.failedResult")).toBeTruthy()
    })
})

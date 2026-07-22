import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AssignmentView, CourseSubmissionView } from "@/modules/api/rest/course"

/**
 * Component — the in-lesson assignment block (learn-exercises-wire task 3.3 quality
 * loop). Pins the GitHub-URL submit flow: the client-side `https://` gate (mirrors the
 * BE `@Pattern`) that never fires a doomed request, the successful submit + history
 * revalidation, the pending/graded status rows, and the max-submissions lock.
 */

const assignmentsMock = vi.fn()
const submissionsData = vi.fn()
const submissionsMutate = vi.fn()
const submitTrigger = vi.fn()

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
    ClipboardTextIcon: () => <span />,
    LockSimpleIcon: () => <span />,
}))

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
vi.mock("@/hooks/swr/api/rest/queries/useGetLessonAssignmentsSwr", () => ({
    useGetLessonAssignmentsSwr: () => assignmentsMock(),
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetMyAssignmentSubmissionsSwr", () => ({
    useGetMyAssignmentSubmissionsSwr: () => ({ data: submissionsData(), mutate: submissionsMutate }),
    isSubmissionPending: (submission: { status: string }) =>
        submission.status === "SUBMITTED" || submission.status === "GRADING",
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePostSubmitAssignmentSwr", () => ({
    usePostSubmitAssignmentSwr: () => ({ trigger: submitTrigger, isMutating: false }),
}))

import { LessonAssignmentBlock } from "./index"

const assignment = (over: Partial<AssignmentView> = {}): AssignmentView => ({
    id: "asg-1",
    lessonId: "les-1",
    title: "Nộp project",
    question: "Đẩy code lên GitHub",
    criteria: "",
    fileExtension: "",
    maxSubmissions: 3,
    free: false,
    sortOrder: 1,
    ...over,
})

const submission = (over: Partial<CourseSubmissionView> = {}): CourseSubmissionView => ({
    id: "sub-1",
    submissionAttempt: 1,
    status: "SUBMITTED",
    overallGrade: null,
    aiScore: null,
    evaluation: "",
    submittedAt: "2026-07-20T00:00:00Z",
    ...over,
})

beforeEach(() => {
    assignmentsMock.mockReturnValue({ data: [assignment()] })
    submissionsData.mockReturnValue([])
    submissionsMutate.mockReset()
    submitTrigger.mockReset()
})

describe("LessonAssignmentBlock", () => {
    it("renders nothing when the lesson has no assignments", () => {
        assignmentsMock.mockReturnValue({ data: [] })
        const { container } = render(<LessonAssignmentBlock lessonId="les-1" />)
        expect(container.innerHTML).toBe("")
    })

    it("blocks a non-https URL client-side and never fires the request", async () => {
        render(<LessonAssignmentBlock lessonId="les-1" />)

        const input = screen.getByPlaceholderText("exercises.assignment.urlPlaceholder")
        fireEvent.change(input, { target: { value: "http://github.com/me/repo" } })
        fireEvent.blur(input)

        // Validation message surfaces; the mirrored BE gate keeps the wire silent.
        await waitFor(() => expect(screen.getByText("exercises.assignment.urlInvalid")).toBeTruthy())
        fireEvent.click(screen.getByText("exercises.assignment.submit"))
        expect(submitTrigger).not.toHaveBeenCalled()
    })

    it("submits a https URL, clears the field and revalidates the history", async () => {
        submitTrigger.mockResolvedValue(submission())
        render(<LessonAssignmentBlock lessonId="les-1" />)

        const input = screen.getByPlaceholderText("exercises.assignment.urlPlaceholder")
        fireEvent.change(input, { target: { value: "https://github.com/me/repo" } })
        fireEvent.click(screen.getByText("exercises.assignment.submit"))

        await waitFor(() =>
            expect(submitTrigger).toHaveBeenCalledWith({
                assignmentId: "asg-1",
                request: { githubSubmissionUrl: "https://github.com/me/repo" },
            }),
        )
        await waitFor(() => expect((input as HTMLInputElement).value).toBe(""))
        expect(submissionsMutate).toHaveBeenCalled()
    })

    it("shows a pending row while grading and the AI score once graded", () => {
        submissionsData.mockReturnValue([
            submission({ id: "sub-1", submissionAttempt: 1, status: "SUBMITTED" }),
            submission({
                id: "sub-2",
                submissionAttempt: 2,
                status: "GRADED",
                aiScore: "8.5",
                evaluation: "Tốt",
            }),
        ])
        render(<LessonAssignmentBlock lessonId="les-1" />)

        expect(screen.getByText("exercises.assignment.status.submitted")).toBeTruthy()
        expect(screen.getByText("exercises.assignment.pendingHint")).toBeTruthy()
        expect(screen.getByText("exercises.assignment.status.graded")).toBeTruthy()
        expect(screen.getByText('exercises.assignment.aiScore:{"score":"8.5"}')).toBeTruthy()
        expect(screen.getByText("Tốt")).toBeTruthy()
    })

    it("locks the form once every attempt is used", () => {
        assignmentsMock.mockReturnValue({ data: [assignment({ maxSubmissions: 1 })] })
        submissionsData.mockReturnValue([submission()])
        render(<LessonAssignmentBlock lessonId="les-1" />)

        expect(screen.getByText('exercises.assignment.maxReached:{"max":1}')).toBeTruthy()
        expect(screen.queryByPlaceholderText("exercises.assignment.urlPlaceholder")).toBeNull()
    })
})

import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AssignmentView, CourseSubmissionView } from "@/modules/api/rest/course"

/**
 * Component — the in-lesson assignment block (learn-exercises-wire task 3.3 quality
 * loop + exercise-submission-methods). Pins BOTH first-class submission methods: the
 * GitHub-URL flow (client-side `https://` gate mirroring the BE `@Pattern`, submit +
 * history revalidation, pending/graded rows, max-submissions lock) AND the file-upload
 * flow (extension whitelist gate, multipart submit), plus the tab switch when the
 * author allows both.
 */

const assignmentsMock = vi.fn()
const submissionsData = vi.fn()
const submissionsMutate = vi.fn()
const submitTrigger = vi.fn()
const submitFileTrigger = vi.fn()

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, params?: Record<string, unknown>) =>
        params ? `${key}:${JSON.stringify(params)}` : key,
    useLocale: () => "vi",
}))

vi.mock("@heroui/react", () => {
    const TabsCtx = React.createContext<{
        selectedKey?: string
        onSelectionChange?: (key: string) => void
            }>({})
    const Typography = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>
    Typography.Heading = ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>
    const Tabs = ({
        children,
        selectedKey,
        onSelectionChange,
    }: {
        children?: React.ReactNode
        selectedKey?: string
        onSelectionChange?: (key: string) => void
    }) => (
        <TabsCtx.Provider value={{ selectedKey, onSelectionChange }}>{children}</TabsCtx.Provider>
    )
    Tabs.ListContainer = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    Tabs.List = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    Tabs.Tab = ({ children, id }: { children?: React.ReactNode, id: string }) => {
        const ctx = React.useContext(TabsCtx)
        return (
            <button type="button" onClick={() => ctx.onSelectionChange?.(id)}>
                {children}
            </button>
        )
    }
    return {
        Typography,
        Tabs,
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
        // strip `variant` so it never reaches the DOM <input> (heroui-only prop)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        Input: ({ variant, ...rest }: { variant?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
            <input {...rest} />
        ),
        cn: (...args: Array<unknown>) => args.filter(Boolean).join(" "),
    }
})

vi.mock("@phosphor-icons/react", () => ({
    ClipboardTextIcon: () => <span />,
    LockSimpleIcon: () => <span />,
    FileArrowUpIcon: () => <span />,
    UploadSimpleIcon: () => <span />,
    WarningCircleIcon: () => <span />,
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
vi.mock("@/hooks/swr/api/rest/mutations/usePostSubmitAssignmentFileSwr", () => ({
    usePostSubmitAssignmentFileSwr: () => ({ trigger: submitFileTrigger, isMutating: false }),
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
    submitFileTrigger.mockReset()
})

describe("LessonAssignmentBlock", () => {
    it("renders nothing when the lesson has no assignments", () => {
        assignmentsMock.mockReturnValue({ data: [] })
        const { container } = render(<LessonAssignmentBlock lessonId="les-1" />)
        expect(container.innerHTML).toBe("")
    })

    it("defaults to the GitHub form (no submissionMethod) with no file tab", () => {
        render(<LessonAssignmentBlock lessonId="les-1" />)
        expect(screen.getByPlaceholderText("exercises.assignment.urlPlaceholder")).toBeTruthy()
        // No tabs, no file CTA on the back-compat GitHub-only default.
        expect(screen.queryByText("exercises.assignment.tabFile")).toBeNull()
        expect(screen.queryByText("exercises.assignment.fileCta")).toBeNull()
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
        expect(screen.getByText("exercises.assignment.aiScore:{\"score\":\"8.5\"}")).toBeTruthy()
        expect(screen.getByText("Tốt")).toBeTruthy()
    })

    it("locks the form once every attempt is used", () => {
        assignmentsMock.mockReturnValue({ data: [assignment({ maxSubmissions: 1 })] })
        submissionsData.mockReturnValue([submission()])
        render(<LessonAssignmentBlock lessonId="les-1" />)

        expect(screen.getByText("exercises.assignment.maxReached:{\"max\":1}")).toBeTruthy()
        expect(screen.queryByPlaceholderText("exercises.assignment.urlPlaceholder")).toBeNull()
    })

    it("offers both tabs when submissionMethod is BOTH and switches to the file form", () => {
        assignmentsMock.mockReturnValue({ data: [assignment({ submissionMethod: "BOTH" })] })
        render(<LessonAssignmentBlock lessonId="les-1" />)

        // Both tabs present; GitHub is the default surface.
        expect(screen.getByText("exercises.assignment.tabGithub")).toBeTruthy()
        expect(screen.getByText("exercises.assignment.tabFile")).toBeTruthy()
        expect(screen.getByPlaceholderText("exercises.assignment.urlPlaceholder")).toBeTruthy()
        expect(screen.queryByText("exercises.assignment.fileCta")).toBeNull()

        // Switch to the upload tab → file surface replaces the URL form.
        fireEvent.click(screen.getByText("exercises.assignment.tabFile"))
        expect(screen.getByText("exercises.assignment.fileCta")).toBeTruthy()
        expect(screen.queryByPlaceholderText("exercises.assignment.urlPlaceholder")).toBeNull()
    })

    it("submits a file (FILE method) via the multipart endpoint and revalidates", async () => {
        submitFileTrigger.mockResolvedValue(submission())
        assignmentsMock.mockReturnValue({ data: [assignment({ submissionMethod: "FILE", fileExtension: ".py" })] })
        render(<LessonAssignmentBlock lessonId="les-1" />)

        // FILE-only → no GitHub input, straight to the file surface.
        expect(screen.queryByPlaceholderText("exercises.assignment.urlPlaceholder")).toBeNull()
        const input = screen.getByLabelText("exercises.assignment.fileLabel") as HTMLInputElement
        const file = new File(["print(1)"], "solution.py", { type: "text/x-python" })
        fireEvent.change(input, { target: { files: [file] } })

        fireEvent.click(screen.getByText("exercises.assignment.submitFile"))
        await waitFor(() =>
            expect(submitFileTrigger).toHaveBeenCalledWith({ assignmentId: "asg-1", file }),
        )
        expect(submissionsMutate).toHaveBeenCalled()
    })

    it("resets the file input value after a pick so the same file can be re-selected", () => {
        assignmentsMock.mockReturnValue({ data: [assignment({ submissionMethod: "FILE", fileExtension: ".py" })] })
        render(<LessonAssignmentBlock lessonId="les-1" />)

        const input = screen.getByLabelText("exercises.assignment.fileLabel") as HTMLInputElement
        const file = new File(["print(1)"], "solution.py", { type: "text/x-python" })
        fireEvent.change(input, { target: { files: [file] } })

        // The picked name is surfaced (state holds the File), but the <input> value is
        // cleared — so re-picking the SAME file on a resubmission fires a fresh change.
        expect(screen.getByText("solution.py")).toBeTruthy()
        expect(input.value).toBe("")
    })

    it("rejects a file outside the extension whitelist and never fires the request", () => {
        assignmentsMock.mockReturnValue({ data: [assignment({ submissionMethod: "FILE", fileExtension: "py, zip" })] })
        render(<LessonAssignmentBlock lessonId="les-1" />)

        const input = screen.getByLabelText("exercises.assignment.fileLabel") as HTMLInputElement
        const file = new File(["nope"], "solution.txt", { type: "text/plain" })
        fireEvent.change(input, { target: { files: [file] } })

        expect(screen.getByText("exercises.assignment.fileWrongType:{\"extensions\":\".py, .zip\"}")).toBeTruthy()
        fireEvent.click(screen.getByText("exercises.assignment.submitFile"))
        expect(submitFileTrigger).not.toHaveBeenCalled()
    })
})

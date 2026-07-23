import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { UseAiToolJobReturn } from "../hooks/useAiToolJob"

/**
 * Component — the four job tool pages (`ai-hub-live-tools` tasks 3.2/3.3/3.5):
 * summary / flashcards / quiz / debug. The shell, feedback panel, job hook, and
 * REST submits are mocked; the `LearningInput` module keeps its REAL pure helpers
 * (`learningInputBody` / `isLearningInputReady`) with only the component stubbed,
 * so each test pins the page's own wiring:
 *  - the submit body each page composes (source fragment + its parameters +
 *    `language` from the locale) reaches the right `submit*Job`,
 *  - each result type renders from a worker-schema fixture (summary tldr/key
 *    points/glossary/read-min, flashcards flip, quiz in-place grading + score,
 *    debug markdown — both the `{output,model}` wrapper and a bare string).
 *
 * `t` echoes the key (params appended as `#v1,v2`), so assertions key off ids.
 */

vi.mock("next-intl", () => ({
    useTranslations:
        () =>
            (key: string, params?: Record<string, unknown>) =>
                params ? `${key}#${Object.values(params).join(",")}` : key,
    useLocale: () => "vi",
}))

// HeroUI → trivial renderers; TextArea stays a real <textarea> so typing works.
vi.mock("@heroui/react", () => {
    const Passthrough = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    return {
        Button: ({
            children,
            onPress,
            isDisabled,
        }: {
            children: React.ReactNode
            onPress?: () => void
            isDisabled?: boolean
        }) => (
            <button type="button" onClick={onPress} disabled={isDisabled}>
                {children}
            </button>
        ),
        Chip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
        Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
        TextField: Passthrough,
        TextArea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
            <textarea {...props} />
        ),
        Dropdown: Passthrough,
        DropdownTrigger: Passthrough,
        DropdownPopover: Passthrough,
        DropdownMenu: Passthrough,
        // Expose the collection `id` so the picker-id fix is assertable.
        DropdownItem: ({ children, id }: { children: React.ReactNode; id?: string }) => (
            <div data-item-id={id}>{children}</div>
        ),
        cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
    }
})

vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <span />
    return {
        CaretDownIcon: Icon,
        BookOpenIcon: Icon,
        TextAaIcon: Icon,
        CheckCircleIcon: Icon,
        XCircleIcon: Icon,
    }
})

// Shell + feedback are their own tests' concern — passthrough / silent here.
vi.mock("./AiToolShell", () => ({
    AiToolShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    AiToolModelNote: ({ model }: { model?: string }) =>
        model ? <div data-testid="model-note">{model}</div> : null,
}))
vi.mock("./AiToolResult", () => ({
    AiJobFeedback: () => null,
}))

// Keep the REAL resolveLearningInputRef/isLearningInputReady — stub only the
// component: a "seed" button that picks a lesson source (the raw-text path no
// longer exists — the BE learning guard needs a lessonId/storageKey reference),
// exercising the genuine lessonId body mapping without touching the upload pipeline.
vi.mock("./LearningInput", async (importOriginal) => {
    const original = await importOriginal<typeof import("./LearningInput")>()
    return {
        ...original,
        LearningInput: ({
            value,
            onChange,
        }: {
            value: import("./LearningInput").LearningInputValue
            onChange: (value: import("./LearningInput").LearningInputValue) => void
        }) => (
            <button
                type="button"
                data-testid="seed-input"
                onClick={() =>
                    onChange({
                        ...value,
                        mode: "lesson",
                        lessonId: "lesson-123",
                        lessonLabel: "Bài học ôn tập",
                    })
                }
            >
                seed
            </button>
        ),
    }
})

// The real LearningInput module still imports its lesson-picker hook — silence it.
vi.mock("@/hooks/swr/api/graphql/queries/useQueryMyLearnedLessonsSwr", () => ({
    useQueryMyLearnedLessonsSwr: () => ({ data: [], isLoading: false }),
}))

vi.mock("@/components/reuseable/MarkdownContent", () => ({
    MarkdownContent: ({ markdown }: { markdown: string }) => (
        <div data-testid="markdown">{markdown}</div>
    ),
}))

const submitSummaryJob = vi.fn()
const submitFlashcardsJob = vi.fn()
const submitQuizJob = vi.fn()
const submitCodeReviewJob = vi.fn()
vi.mock("@/modules/api/rest/ai", () => ({
    submitSummaryJob: (...a: Array<unknown>) => submitSummaryJob(...a),
    submitFlashcardsJob: (...a: Array<unknown>) => submitFlashcardsJob(...a),
    submitQuizJob: (...a: Array<unknown>) => submitQuizJob(...a),
    submitCodeReviewJob: (...a: Array<unknown>) => submitCodeReviewJob(...a),
}))

// The job orchestrator — `run` executes the page's submit factory so the composed
// body reaches the mocked submit fn; `poll.result` serves the render fixtures.
let jobState: UseAiToolJobReturn<unknown>
vi.mock("../hooks/useAiToolJob", () => ({
    useAiToolJob: () => jobState,
}))

import { SummaryTool } from "./SummaryTool"
import { FlashcardsTool } from "./FlashcardsTool"
import { QuizTool } from "./QuizTool"
import { DebugTool } from "./DebugTool"

const makeJob = (result?: unknown): UseAiToolJobReturn<unknown> => ({
    run: vi.fn(async (submit: () => Promise<{ jobId: string; status: string }>) => {
        await submit()
    }),
    reset: vi.fn(),
    isSubmitting: false,
    submitError: undefined,
    isQuota: false,
    jobId: result === undefined ? null : "job-1",
    poll: {
        job: undefined,
        status: result === undefined ? undefined : "COMPLETED",
        result,
        isRunning: false,
        isComplete: result !== undefined,
        isFailed: false,
        isStale: false,
        error: undefined,
        isLoading: false,
        refresh: vi.fn(),
    },
    isBusy: false,
})

beforeEach(() => {
    jobState = makeJob()
    submitSummaryJob.mockResolvedValue({ jobId: "job-1", status: "PENDING" })
    submitFlashcardsJob.mockResolvedValue({ jobId: "job-1", status: "PENDING" })
    submitQuizJob.mockResolvedValue({ jobId: "job-1", status: "PENDING" })
    submitCodeReviewJob.mockResolvedValue({ jobId: "job-1", status: "PENDING" })
})

afterEach(() => {
    vi.clearAllMocks()
})

const seedAndRun = () => {
    fireEvent.click(screen.getByTestId("seed-input"))
    fireEvent.click(screen.getByText("run"))
}

describe("SummaryTool", () => {
    it("submits the picked lesson reference (lessonId) with the locale", async () => {
        render(<SummaryTool />)
        seedAndRun()
        await waitFor(() =>
            expect(submitSummaryJob).toHaveBeenCalledWith({
                lessonId: "lesson-123",
                language: "vi",
            }),
        )
    })

    it("blocks the run until a source exists", () => {
        render(<SummaryTool />)
        fireEvent.click(screen.getByText("run"))
        expect(submitSummaryJob).not.toHaveBeenCalled()
    })

    it("renders tldr + key points + glossary + read-min + model from a fixture", () => {
        jobState = makeJob({
            tldr: "Java là ngôn ngữ hướng đối tượng.",
            key_points: ["JVM chạy bytecode", "GC tự dọn bộ nhớ"],
            glossary: [{ term: "JVM", definition: "Máy ảo Java" }],
            estimated_read_min: 3,
            model: "openrouter/test-model",
        })
        render(<SummaryTool />)
        expect(screen.getByText("Java là ngôn ngữ hướng đối tượng.")).toBeTruthy()
        expect(screen.getByText("JVM chạy bytecode")).toBeTruthy()
        expect(screen.getByText("GC tự dọn bộ nhớ")).toBeTruthy()
        expect(screen.getByText("JVM")).toBeTruthy()
        expect(screen.getByText("Máy ảo Java")).toBeTruthy()
        expect(screen.getByText("summary.readMin#3")).toBeTruthy()
        expect(screen.getByTestId("model-note").textContent).toBe("openrouter/test-model")
    })
})

describe("FlashcardsTool", () => {
    it("submits the source with the picked cardCount and locale", async () => {
        render(<FlashcardsTool />)
        fireEvent.click(screen.getByText("15"))
        seedAndRun()
        await waitFor(() =>
            expect(submitFlashcardsJob).toHaveBeenCalledWith({
                lessonId: "lesson-123",
                cardCount: 15,
                language: "vi",
            }),
        )
    })

    it("renders cards front-first and flips to the back on click", () => {
        jobState = makeJob({
            cards: [{ front: "JVM là gì?", back: "Máy ảo chạy bytecode", hint: "nghĩ runtime" }],
            model: "m1",
        })
        render(<FlashcardsTool />)
        expect(screen.getByText("JVM là gì?")).toBeTruthy()
        expect(screen.queryByText("Máy ảo chạy bytecode")).toBeNull()
        expect(screen.getByText("hint#nghĩ runtime")).toBeTruthy()

        fireEvent.click(screen.getByText("JVM là gì?").closest("button") as HTMLElement)
        expect(screen.getByText("Máy ảo chạy bytecode")).toBeTruthy()
        expect(screen.queryByText("JVM là gì?")).toBeNull()
    })
})

describe("QuizTool", () => {
    it("submits the source with questionCount + difficulty + locale", async () => {
        render(<QuizTool />)
        fireEvent.click(screen.getByText("quiz.difficulties.hard"))
        seedAndRun()
        await waitFor(() =>
            expect(submitQuizJob).toHaveBeenCalledWith({
                lessonId: "lesson-123",
                questionCount: 5,
                difficulty: "hard",
                language: "vi",
            }),
        )
    })

    it("grades in place (letter + text `correct` shapes) and totals the score", () => {
        jobState = makeJob({
            questions: [
                {
                    question: "JVM chạy gì?",
                    options: ["Mã nguồn", "Bytecode"],
                    correct: "B", // letter shape
                    explanation: "JVM thực thi bytecode.",
                },
                {
                    question: "DB nào là quan hệ?",
                    options: ["Redis", "PostgreSQL"],
                    correct: "PostgreSQL", // exact-text shape
                },
            ],
        })
        render(<QuizTool />)

        // Q1: pick the correct option (letter "B" → index 1).
        fireEvent.click(screen.getByText("Bytecode"))
        expect(screen.getByText("correct")).toBeTruthy()
        expect(screen.getByText("JVM thực thi bytecode.")).toBeTruthy()

        // Q2: pick the wrong option (correct is the exact text "PostgreSQL").
        fireEvent.click(screen.getByText("Redis"))
        expect(screen.getByText("incorrect")).toBeTruthy()

        // All answered → score line: 1 correct of 2.
        expect(screen.getByText("score#1,2")).toBeTruthy()
    })

    it("locks a question after it is answered (no re-grade)", () => {
        jobState = makeJob({
            questions: [
                { question: "Q", options: ["A", "B"], correct: 0 },
            ],
        })
        render(<QuizTool />)
        fireEvent.click(screen.getByText("A"))
        expect(screen.getByText("correct")).toBeTruthy()
        // Options are disabled once answered — clicking the other changes nothing.
        fireEvent.click(screen.getByText("B"))
        expect(screen.getByText("correct")).toBeTruthy()
        expect(screen.queryByText("incorrect")).toBeNull()
    })
})

describe("DebugTool", () => {
    it("submits the trimmed code + language + question", () => {
        render(<DebugTool />)
        fireEvent.change(screen.getByPlaceholderText("debug.codePlaceholder"), {
            target: { value: "  const x = 1  " },
        })
        fireEvent.click(screen.getByText("run"))
        expect(submitCodeReviewJob).toHaveBeenCalledWith({
            code: "const x = 1",
            language: "python",
            question: "",
        })
    })

    it("gives each language option a real collection id (picker-id fix)", () => {
        const { container } = render(<DebugTool />)
        // The value the picker feeds to onAction is the `id`, not the React `key`.
        const python = container.querySelector('[data-item-id="python"]')
        const sql = container.querySelector('[data-item-id="sql"]')
        expect(python?.textContent).toBe("python")
        expect(sql?.textContent).toBe("sql")
    })

    it("renders a wrapped {output, model} result through the markdown renderer", () => {
        jobState = makeJob({ output: "## Review\nDùng prepared statement.", model: "m2" })
        render(<DebugTool />)
        expect(screen.getByTestId("markdown").textContent).toBe(
            "## Review\nDùng prepared statement.",
        )
        expect(screen.getByTestId("model-note").textContent).toBe("m2")
    })

    it("accepts a bare markdown string result (raw passthrough, no model note)", () => {
        jobState = makeJob("## Bare markdown review")
        render(<DebugTool />)
        expect(screen.getByTestId("markdown").textContent).toBe("## Bare markdown review")
        expect(screen.queryByTestId("model-note")).toBeNull()
    })
})

import React from "react"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Component — {@link ResourceAiQa} (resource document-QA, "Hỏi AI về tài liệu"):
 *
 *  - one turn = one `askDocumentQa` request (no streaming): the answer renders as
 *    markdown with its citations (quote-less entries dropped) + the model caption;
 *  - a soft `{processing: true}` turns the bubble into the "đang xử lý" notice with
 *    a "Thử lại" that resends the EXACT same question into the SAME turn (the BE
 *    already refunded the quota, and there is no auto-poll);
 *  - the error table maps 429/quota → `quotaHit`, `AI_MODEL_NOT_ALLOWED` → picker
 *    reset + `modelNotAllowed`, `AI_DOCUMENT_ACCESS_DENIED` → `accessDenied` and
 *    anything else (502/503) → the generic `error` — all IN-THREAD, never a toast;
 *  - the model picker sends the id from the item's `id` PROP (the react-aria trap)
 *    and no `model` field at all until something is picked.
 *
 * HeroUI/phosphor/markdown are mocked to trivial renderers; `useTranslations`
 * echoes its key so assertions read as the i18n contract.
 */

const h = vi.hoisted(() => {
    /**
     * Stand-in for the REST error the client throws. Declared INSIDE `vi.hoisted`
     * so the (hoisted) `vi.mock` factory can reference it without a TDZ crash —
     * a top-level `class` would still be uninitialised when the factory runs.
     */
    class MockRestError extends Error {
        status: number
        errorCode?: string
        constructor(message: string, status: number, errorCode?: string) {
            super(message)
            this.name = "RestError"
            this.status = status
            this.errorCode = errorCode
        }
    }
    return {
        /** `askDocumentQa` mock — each test queues its own resolution. */
        ask: vi.fn(),
        /** Last `onAction` handed to the mocked DropdownMenu (the picker). */
        onAction: undefined as ((key: string) => void) | undefined,
        RestError: MockRestError,
        /** Catalog returned by the models hook. */
        catalog: {
            models: [
                { id: "openai/gpt-a", label: "GPT A" },
                { id: "vendor/down-model", label: "Down", status: "down" },
            ],
            defaults: { chat: "openai/gpt-a" },
        } as unknown,
    }
})

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}(${Object.values(values).join(",")})` : key,
}))

vi.mock("@phosphor-icons/react", () => ({
    CaretUpIcon: () => <span />,
    PaperPlaneTiltIcon: () => <span />,
    SparkleIcon: () => <span />,
}))

vi.mock("@heroui/react", () => {
    const strip = (rest: Record<string, unknown>) => {
        const {
            variant,
            size,
            className,
            isIconOnly,
            isPending,
            isDisabled,
            color,
            type,
            weight,
            truncate,
            hideScrollBar,
            placement,
            disabledKeys,
            textValue,
            ...dom
        } = rest
        void variant
        void size
        void className
        void isIconOnly
        void isPending
        void color
        void type
        void weight
        void truncate
        void hideScrollBar
        void placement
        void disabledKeys
        void textValue
        return { dom, isDisabled: Boolean(isDisabled) }
    }
    const Button = ({
        children,
        onPress,
        ...rest
    }: {
        children?: React.ReactNode
        onPress?: () => void
        [k: string]: unknown
    }) => {
        const { dom, isDisabled } = strip(rest)
        return (
            <button type="button" disabled={isDisabled} onClick={() => onPress?.()} {...dom}>
                {children}
            </button>
        )
    }
    const Typography = ({ children, ...rest }: { children?: React.ReactNode; [k: string]: unknown }) => {
        const { dom } = strip(rest)
        return <span {...dom}>{children}</span>
    }
    const ScrollShadow = ({ children }: { children?: React.ReactNode; [k: string]: unknown }) => (
        <div>{children}</div>
    )
    const Dropdown = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    const DropdownTrigger = ({ children }: { children?: React.ReactNode; [k: string]: unknown }) => (
        <div>{children}</div>
    )
    const DropdownPopover = ({ children }: { children?: React.ReactNode; [k: string]: unknown }) => (
        <div>{children}</div>
    )
    const DropdownMenu = ({
        children,
        onAction,
        disabledKeys,
    }: {
        children?: React.ReactNode
        onAction?: (key: string) => void
        disabledKeys?: Array<string>
        [k: string]: unknown
    }) => {
        h.onAction = onAction
        return <div data-testid="model-menu" data-disabled={(disabledKeys ?? []).join(",")}>{children}</div>
    }
    /**
     * Mirrors the react-aria contract under test: the collection key comes from the
     * `id` PROP (React strips `key`), so the item forwards `id` to `onAction`.
     */
    const DropdownItem = ({
        children,
        id,
    }: {
        children?: React.ReactNode
        id?: string
        [k: string]: unknown
    }) => (
        <button type="button" data-testid={`model-${id}`} onClick={() => h.onAction?.(String(id))}>
            {children}
        </button>
    )
    const cn = (...args: Array<unknown>) => args.filter(Boolean).join(" ")
    return {
        Button,
        Typography,
        ScrollShadow,
        Dropdown,
        DropdownTrigger,
        DropdownPopover,
        DropdownMenu,
        DropdownItem,
        cn,
    }
})

vi.mock("@/components/blocks/feed/ChatBubble", () => ({
    ChatBubble: ({ role, children }: { role: string; children?: React.ReactNode }) => (
        <div data-testid="chat-bubble" data-role={role}>
            {children}
        </div>
    ),
}))

vi.mock("@/components/reuseable/MarkdownContent", () => ({
    MarkdownContent: ({ markdown }: { markdown: string }) => <div data-testid="markdown">{markdown}</div>,
}))

// signed-in: the guard runs the action straight through
vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({
        authenticated: true,
        requireAuth: () => true,
        guard:
            <Args extends Array<unknown>>(action: (...args: Args) => void) =>
            (...args: Args) =>
                action(...args),
    }),
}))

vi.mock("@/hooks/swr/api/rest/queries/useGetAiCatalogModelsSwr", () => ({
    useGetAiCatalogModelsSwr: () => ({ data: h.catalog, error: undefined, isLoading: false }),
}))

// the component AND the shared `isQuotaError` helper both read this class → one identity
vi.mock("@/modules/api/rest/client", () => ({ RestError: h.RestError }))

vi.mock("@/modules/api/rest/ai", () => ({
    askDocumentQa: (body: unknown) => h.ask(body),
    isFreeModel: (model: { id: string }) => model.id.endsWith(":free"),
    isModelDown: (model: { status?: string }) => model.status === "down",
    getJob: vi.fn(),
}))

import { ResourceAiQa } from "./index"

/** Type a question into the composer and press send. */
const askQuestion = (question: string) => {
    fireEvent.change(screen.getByLabelText("placeholder"), { target: { value: question } })
    fireEvent.click(screen.getByLabelText("send"))
}

beforeEach(() => {
    h.ask.mockReset()
    h.onAction = undefined
})

afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

describe("ResourceAiQa — một lượt = một request", () => {
    it("hiển thị câu trả lời, trích dẫn (bỏ item thiếu quote) và caption model", async () => {
        h.ask.mockResolvedValue({
            answer: "## Tóm tắt\nNội dung chính",
            citations: [
                { quote: "trích dẫn một", page: 2 },
                { quote: "", page: 3 },
                { page: 4 },
                { quote: "trích dẫn hai" },
            ],
            model: "openai/gpt-a",
        })
        render(<ResourceAiQa documentId="res-1" />)

        askQuestion("Tài liệu này nói về gì?")

        expect(await screen.findByTestId("markdown")).toHaveProperty(
            "textContent",
            "## Tóm tắt\nNội dung chính",
        )
        // câu hỏi giữ nguyên trong bubble user
        expect(screen.getByText("Tài liệu này nói về gì?")).toBeTruthy()
        // caption + đúng 2 trích dẫn có quote, đánh số lại 1..2
        expect(screen.getByText("citations")).toBeTruthy()
        expect(screen.getByText("[1] trích dẫn một")).toBeTruthy()
        expect(screen.getByText("[2] trích dẫn hai")).toBeTruthy()
        expect(screen.queryByText(/\[3\]/)).toBeNull()
        expect(screen.getByText("answeredBy(openai/gpt-a)")).toBeTruthy()
    })

    it("mặc định KHÔNG gửi field model", async () => {
        h.ask.mockResolvedValue({ answer: "ok" })
        render(<ResourceAiQa documentId="res-1" />)

        askQuestion("Câu hỏi")

        await waitFor(() => expect(h.ask).toHaveBeenCalledTimes(1))
        expect(h.ask.mock.calls[0][0]).toEqual({ documentId: "res-1", question: "Câu hỏi" })
    })
})

describe("ResourceAiQa — tài liệu đang xử lý", () => {
    it("processing → nút Thử lại resend ĐÚNG câu hỏi vào cùng lượt (không auto-poll)", async () => {
        h.ask.mockResolvedValueOnce({ answer: "", processing: true })
        render(<ResourceAiQa documentId="res-1" />)

        askQuestion("Chương 3 nói gì?")

        expect(await screen.findByText("processing")).toBeTruthy()
        await waitFor(() => expect(h.ask).toHaveBeenCalledTimes(1))
        // KHÔNG auto-poll: sau khi hiện notice vẫn đúng 1 request
        expect(h.ask).toHaveBeenCalledTimes(1)

        h.ask.mockResolvedValueOnce({ answer: "Chương 3 nói về con trỏ", model: "openai/gpt-a" })
        fireEvent.click(screen.getByText("retry"))

        await waitFor(() => expect(h.ask).toHaveBeenCalledTimes(2))
        expect(h.ask.mock.calls[1][0]).toEqual({ documentId: "res-1", question: "Chương 3 nói gì?" })
        expect(await screen.findByTestId("markdown")).toHaveProperty(
            "textContent",
            "Chương 3 nói về con trỏ",
        )
        // vẫn 2 bong bóng (user + assistant): retry ghi đè lượt cũ, không đẻ lượt mới
        expect(screen.getAllByTestId("chat-bubble")).toHaveLength(2)
    })
})

describe("ResourceAiQa — bảng lỗi (in-thread)", () => {
    it.each<[string, Error, string]>([
        ["429 quota", new h.RestError("too many", 429), "quotaHit"],
        ["quota code", new h.RestError("x", 400, "AI_QUOTA_EXCEEDED"), "quotaHit"],
        ["model bị chặn", new h.RestError("x", 400, "AI_MODEL_NOT_ALLOWED"), "modelNotAllowed"],
        ["không có quyền", new h.RestError("x", 403, "AI_DOCUMENT_ACCESS_DENIED"), "accessDenied"],
        ["provider 502", new h.RestError("bad gateway", 502, "AI_DOCUMENT_QA_FAILED"), "error"],
        ["service 503", new h.RestError("down", 503, "AI_CONTENT_DOWN"), "error"],
    ])("%s → %s", async (_label, thrown, expected) => {
        h.ask.mockRejectedValue(thrown)
        render(<ResourceAiQa documentId="res-1" />)

        askQuestion("Câu hỏi")

        expect(await screen.findByText(expected)).toBeTruthy()
    })

    it("AI_MODEL_NOT_ALLOWED reset picker về mặc định (lượt sau không gửi model)", async () => {
        h.ask.mockRejectedValueOnce(new h.RestError("x", 400, "AI_MODEL_NOT_ALLOWED"))
        render(<ResourceAiQa documentId="res-1" />)

        fireEvent.click(screen.getByTestId("model-openai/gpt-a"))
        askQuestion("Câu hỏi 1")

        expect(await screen.findByText("modelNotAllowed")).toBeTruthy()
        expect(h.ask.mock.calls[0][0]).toMatchObject({ model: "openai/gpt-a" })

        h.ask.mockResolvedValueOnce({ answer: "ok" })
        askQuestion("Câu hỏi 2")

        await waitFor(() => expect(h.ask).toHaveBeenCalledTimes(2))
        expect(h.ask.mock.calls[1][0]).toEqual({ documentId: "res-1", question: "Câu hỏi 2" })
    })
})

describe("ResourceAiQa — model picker", () => {
    it("chọn model gửi đúng id từ prop `id` (bẫy react-aria) và model down bị disable", async () => {
        h.ask.mockResolvedValue({ answer: "ok" })
        render(<ResourceAiQa documentId="res-1" />)

        expect(screen.getByTestId("model-menu").getAttribute("data-disabled")).toBe("vendor/down-model")

        fireEvent.click(screen.getByTestId("model-openai/gpt-a"))
        askQuestion("Câu hỏi")

        await waitFor(() => expect(h.ask).toHaveBeenCalledTimes(1))
        expect(h.ask.mock.calls[0][0]).toEqual({
            documentId: "res-1",
            question: "Câu hỏi",
            model: "openai/gpt-a",
        })
    })
})

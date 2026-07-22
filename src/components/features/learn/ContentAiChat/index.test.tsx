import React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { AiModelCatalog, AiSessionView } from "@/modules/api/rest/ai"
import { useOverlayStore } from "@/hooks/zustand/overlay/store"

/**
 * Component — {@link ContentAiChat}: (1) passage-context prepend on send
 * (lesson-ai-chat-fixes task 1.3): the message SENT to the BE carries the FULL
 * selected passage + a marked reference-data block with the containing
 * paragraph, while the user bubble keeps only the truncated display; and
 * (2) the composer model picker (task 2.6): default from the catalog, the
 * active model riding the session + stream call, store-backed persistence
 * across remounts, degrade on a broken catalog, `AI_MODEL_NOT_ALLOWED`
 * resetting to the default, and the `answeredBy` caption from the SSE `done`
 * event. Heavy primitives (HeroUI, phosphor, markdown) are mocked to trivial
 * renderers; the REAL overlay store carries selection/model so the wiring under
 * test is the one production uses. `t` echoes `key(values…)`.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}(${Object.values(values).join(",")})` : key,
}))

vi.mock("next/navigation", () => ({
    useParams: () => ({ contentId: "content-1" }),
}))

// Model catalog SWR — controllable per test (data + error).
const h = vi.hoisted(() => ({
    catalog: { data: undefined, error: undefined } as { data?: AiModelCatalog; error?: Error },
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetAiCatalogModelsSwr", () => ({
    useGetAiCatalogModelsSwr: () => h.catalog,
}))

// REST AI module — session + SSE stream are spies; helpers keep their contract.
vi.mock("@/modules/api/rest/ai", () => ({
    createSession: vi.fn(),
    sendSessionMessageStream: vi.fn(),
    isFreeModel: () => false,
    isModelDown: (model: { status?: string }) => model.status === "down",
}))

vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <span />
    return { CaretUpIcon: Icon, PaperPlaneTiltIcon: Icon, QuotesIcon: Icon, SparkleIcon: Icon }
})

vi.mock("@heroui/react", () => {
    const passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    const Button = ({
        children,
        onPress,
        isDisabled,
        ...rest
    }: {
        children?: React.ReactNode
        onPress?: () => void
        isDisabled?: boolean
        [k: string]: unknown
    }) => {
        const { isIconOnly, variant, size, isPending, ...dom } = rest
        void isIconOnly
        void variant
        void size
        void isPending
        return (
            <button type="button" disabled={isDisabled} onClick={onPress} {...dom}>
                {children}
            </button>
        )
    }
    const CloseButton = ({ onPress, ...rest }: { onPress?: () => void; [k: string]: unknown }) => {
        const { className, ...dom } = rest
        void className
        return <button type="button" onClick={onPress} {...dom} />
    }
    const ScrollShadow = React.forwardRef<
        HTMLDivElement,
        { children?: React.ReactNode; hideScrollBar?: boolean; className?: string }
    >(({ children }, ref) => <div ref={ref}>{children}</div>)
    ScrollShadow.displayName = "ScrollShadow"
    const Typography = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>
    const cn = (...args: Array<unknown>) => args.filter(Boolean).join(" ")
    return {
        Button,
        CloseButton,
        Dropdown: passthrough,
        DropdownItem: passthrough,
        DropdownMenu: passthrough,
        DropdownPopover: passthrough,
        DropdownTrigger: passthrough,
        ScrollShadow,
        Typography,
        cn,
    }
})

vi.mock("@/components/blocks/feed/ChatBubble", () => ({
    ChatBubble: ({ role, children }: { role: string; children?: React.ReactNode }) => (
        <div data-testid={`bubble-${role}`}>{children}</div>
    ),
}))

vi.mock("@/components/reuseable/MarkdownContent", () => ({
    MarkdownContent: ({ markdown }: { markdown: string }) => <div>{markdown}</div>,
}))

import { createSession, sendSessionMessageStream } from "@/modules/api/rest/ai"
import { ContentAiChat } from "./index"

const createSessionMock = vi.mocked(createSession)
const streamMock = vi.mocked(sendSessionMessageStream)

const CATALOG: AiModelCatalog = {
    models: [
        { id: "prov/model-x", label: "Model X" },
        { id: "prov/model-y" },
    ],
    defaults: { chat: "prov/model-x" },
}

/** Type a question and press send, flushing the async send inside act. */
const typeAndSend = async (text: string) => {
    fireEvent.change(screen.getByPlaceholderText("reader.ai.placeholder"), { target: { value: text } })
    await act(async () => {
        fireEvent.click(screen.getByLabelText("reader.ai.send"))
    })
}

beforeEach(() => {
    h.catalog.data = CATALOG
    h.catalog.error = undefined
    createSessionMock.mockResolvedValue({ id: "sess-1" } as AiSessionView)
    streamMock.mockImplementation(async (_sessionId, _content, handlers) => {
        handlers.onDelta("chunk")
    })
    useOverlayStore.setState({
        contentAiSelection: null,
        contentAiSelectionContext: null,
        contentAiSelectedModel: null,
    })
})

afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

describe("ContentAiChat — passage context prepend (task 1.3)", () => {
    it("sends the FULL passage + marked context block, while the bubble shows only the truncated display", async () => {
        const passage = "P".repeat(150)
        const context = "NGỮ-CẢNH-ĐOẠN-VĂN-BAO-QUANH"
        useOverlayStore.setState({ contentAiSelection: passage, contentAiSelectionContext: context })
        render(<ContentAiChat />)

        await typeAndSend("Câu hỏi của em?")

        // the BE-bound message: full passage quote + question + reference-data block
        expect(streamMock.mock.calls[0][1]).toBe(
            `reader.ai.aboutPassage(${passage}) Câu hỏi của em?\n\n[reader.ai.passageContext: ${context}]`,
        )
        // the user bubble renders the display form only: truncated quote, no context block
        const bubble = screen.getByTestId("bubble-user")
        expect(bubble.textContent).toContain(`${"P".repeat(120)}…`)
        expect(bubble.textContent).not.toContain("P".repeat(121))
        expect(bubble.textContent).not.toContain(context)
        expect(bubble.textContent).not.toContain("reader.ai.passageContext")
        // the selection is cleared after sending
        expect(useOverlayStore.getState().contentAiSelection).toBeNull()
    })

    it("keeps the passage quote but omits the context block when no paragraph context was captured", async () => {
        useOverlayStore.setState({ contentAiSelection: "đoạn ngắn", contentAiSelectionContext: null })
        render(<ContentAiChat />)

        await typeAndSend("Giải thích?")

        expect(streamMock.mock.calls[0][1]).toBe("reader.ai.aboutPassage(đoạn ngắn) Giải thích?")
    })

    it("sends the raw question untouched when nothing is selected", async () => {
        render(<ContentAiChat />)

        await typeAndSend("Câu hỏi trần")

        expect(streamMock.mock.calls[0][1]).toBe("Câu hỏi trần")
        expect(screen.getByTestId("bubble-user").textContent).toBe("Câu hỏi trần")
    })
})

describe("ContentAiChat — model picker (task 2.6)", () => {
    it("defaults the picker to the catalog default and rides it on the session + stream call", async () => {
        render(<ContentAiChat />)

        // label = short name (part after the slash)
        expect(screen.getByText("model-x")).toBeTruthy()

        await typeAndSend("hi")

        expect(createSessionMock).toHaveBeenCalledWith({
            feature: "TUTOR_CHAT",
            contextRef: { lessonId: "content-1" },
            model: "prov/model-x",
        })
        expect(streamMock.mock.calls[0][3]).toBe("prov/model-x")
    })

    it("a picked model rides the body and survives a remount (store-backed)", async () => {
        useOverlayStore.setState({ contentAiSelectedModel: "prov/model-y" })
        const { unmount } = render(<ContentAiChat />)

        // "model-y" renders in the trigger AND as the (unlabelled) catalog item
        expect(screen.getAllByText("model-y").length).toBeGreaterThanOrEqual(2)
        await typeAndSend("hi")
        expect(streamMock.mock.calls[0][3]).toBe("prov/model-y")

        unmount()
        render(<ContentAiChat />)
        expect(screen.getAllByText("model-y").length).toBeGreaterThanOrEqual(2)
    })

    it("degrades when the catalog errors: picker hidden, chat still sends with NO model", async () => {
        h.catalog.data = undefined
        h.catalog.error = new Error("catalog down")
        render(<ContentAiChat />)

        expect(screen.queryByText("model-x")).toBeNull()

        await typeAndSend("hi")

        expect(createSessionMock).toHaveBeenCalledWith({
            feature: "TUTOR_CHAT",
            contextRef: { lessonId: "content-1" },
        })
        expect(streamMock.mock.calls[0][3]).toBeUndefined()
    })

    it("hides the picker on an EMPTY catalog too (no model sent)", async () => {
        h.catalog.data = { models: [], defaults: {} }
        render(<ContentAiChat />)

        expect(screen.queryByText("model-x")).toBeNull()

        await typeAndSend("hi")

        expect(streamMock.mock.calls[0][3]).toBeUndefined()
    })

    it("AI_MODEL_NOT_ALLOWED resets the picker to the default and shows the translated notice", async () => {
        useOverlayStore.setState({ contentAiSelectedModel: "prov/model-y" })
        streamMock.mockImplementation(async (_sessionId, _content, handlers) => {
            handlers.onError?.("AI_MODEL_NOT_ALLOWED")
        })
        render(<ContentAiChat />)

        await typeAndSend("hi")

        expect(useOverlayStore.getState().contentAiSelectedModel).toBeNull()
        expect(screen.getByText("reader.ai.modelNotAllowed")).toBeTruthy()
        // the picker falls back to the catalog default
        expect(screen.getByText("model-x")).toBeTruthy()
    })

    it("captions the assistant bubble with modelUsed from the SSE done event", async () => {
        streamMock.mockImplementation(async (_sessionId, _content, handlers) => {
            handlers.onDelta("Xin chào")
            handlers.onDone?.({ modelUsed: "prov/model-x" })
        })
        render(<ContentAiChat />)

        await typeAndSend("hi")

        const bubble = screen.getByTestId("bubble-assistant")
        expect(bubble.textContent).toContain("Xin chào")
        expect(bubble.textContent).toContain("reader.ai.answeredBy(prov/model-x)")
    })

    it("renders NO caption when the done event carries no modelUsed", async () => {
        streamMock.mockImplementation(async (_sessionId, _content, handlers) => {
            handlers.onDelta("Xin chào")
            handlers.onDone?.({ usage: { tokens: 3 } })
        })
        render(<ContentAiChat />)

        await typeAndSend("hi")

        expect(screen.getByTestId("bubble-assistant").textContent).not.toContain("reader.ai.answeredBy")
    })
})

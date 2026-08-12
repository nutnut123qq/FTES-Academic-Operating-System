import React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { AiModelCatalog, AiSessionView } from "@/modules/api/rest/ai"
import { EMPTY_CONTENT_AI_CONVERSATION, useOverlayStore } from "@/hooks/zustand/overlay/store"

/**
 * Component — {@link ContentAiChat}: (1) passage-context prepend on send
 * (lesson-ai-chat-fixes task 1.3): the message SENT to the BE carries the FULL
 * selected passage + a marked reference-data block with the containing
 * paragraph, while the user bubble keeps only the truncated display;
 * (2) the composer model picker (task 2.6): default from the catalog, the
 * active model riding the session + stream call, store-backed persistence
 * across remounts, degrade on a broken catalog, `AI_MODEL_NOT_ALLOWED`
 * resetting to the default, and the `answeredBy` caption from the SSE `done`
 * event; and (3) CONVERSATION SURVIVAL — the panel's hosts unmount it on every
 * close, so the thread, the composer draft and the session id must survive an
 * unmount/remount and may only be cleared by a real lesson change.
 *
 * Heavy primitives (HeroUI, phosphor, markdown) are mocked to trivial
 * renderers; the REAL overlay store carries selection/model/conversation so the
 * wiring under test is the one production uses. `t` echoes `key(values…)`.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}(${Object.values(values).join(",")})` : key,
}))

// The open lesson — controllable per test so a REAL lesson change can be simulated.
vi.mock("next/navigation", () => ({
    useParams: () => ({ contentId: h.contentId }),
}))

// Model catalog SWR — controllable per test (data + error).
const h = vi.hoisted(() => ({
    catalog: { data: undefined, error: undefined } as { data?: AiModelCatalog; error?: Error },
    contentId: "content-1" as string | undefined,
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

    // Model picker (Dropdown) — faithful to react-aria's collection: the node key
    // comes from the `id` PROP, NOT React's `key` (React strips `key`, so it never
    // reaches the collection). A missing `id` falls back to an auto `react-aria-N`
    // key and `onAction`/`disabledKeys` fire with THAT — the exact shape of the
    // AI_MODEL_NOT_ALLOWED bug. The mock derives its click key from `id` with the
    // same fallback so the picker test catches a regression (a bare `key` prop
    // would send `react-aria-N`, not the model id).
    const MenuActionContext = React.createContext<((key: string) => void) | undefined>(undefined)
    const MenuDisabledContext = React.createContext<Array<string>>([])
    let autoKeySeq = 0
    const DropdownMenu = ({
        children,
        onAction,
        disabledKeys,
    }: {
        children?: React.ReactNode
        onAction?: (key: string) => void
        disabledKeys?: Iterable<string>
    }) => (
        <MenuActionContext.Provider value={onAction}>
            <MenuDisabledContext.Provider value={Array.from(disabledKeys ?? [])}>
                <div role="menu">{children}</div>
            </MenuDisabledContext.Provider>
        </MenuActionContext.Provider>
    )
    const DropdownItem = ({
        children,
        id,
        textValue,
    }: {
        children?: React.ReactNode
        id?: string
        textValue?: string
    }) => {
        const nodeKey = id ?? `react-aria-${++autoKeySeq}`
        const onAction = React.useContext(MenuActionContext)
        const disabled = React.useContext(MenuDisabledContext).includes(nodeKey)
        return (
            <button
                type="button"
                role="menuitem"
                aria-label={textValue}
                disabled={disabled}
                onClick={() => onAction?.(nodeKey)}
            >
                {children}
            </button>
        )
    }
    return {
        Button,
        CloseButton,
        Dropdown: passthrough,
        DropdownItem,
        DropdownMenu,
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
    h.contentId = "content-1"
    createSessionMock.mockResolvedValue({ id: "sess-1" } as AiSessionView)
    streamMock.mockImplementation(async (_sessionId, _content, handlers) => {
        handlers.onDelta("chunk")
    })
    useOverlayStore.setState({
        contentAiSelection: null,
        contentAiSelectionContext: null,
        contentAiSelectedModel: null,
        // the conversation is store-backed now (that IS the fix), so it outlives a
        // `cleanup()` — every test starts from a blank one on purpose
        contentAiConversation: EMPTY_CONTENT_AI_CONVERSATION,
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

describe("ContentAiChat — the conversation survives the panel closing", () => {
    /** The composer textarea (the draft input). */
    const composer = () => screen.getByPlaceholderText("reader.ai.placeholder") as HTMLTextAreaElement

    it("keeps the thread AND the half-typed draft across unmount → remount (close → re-open)", async () => {
        const { unmount } = render(<ContentAiChat />)

        await typeAndSend("Câu hỏi đã gửi")
        // …then start typing the NEXT question without sending it
        fireEvent.change(composer(), { target: { value: "câu hỏi đang gõ dở" } })

        // clicking outside / Escape / the mascot toggle all UNMOUNT the panel
        unmount()
        render(<ContentAiChat />)

        // the whole thread is still there — question AND streamed answer
        expect(screen.getByTestId("bubble-user").textContent).toBe("Câu hỏi đã gửi")
        expect(screen.getByTestId("bubble-assistant").textContent).toContain("chunk")
        // …and so is the unsent draft
        expect(composer().value).toBe("câu hỏi đang gõ dở")
    })

    it("re-uses the SAME BE session after a remount instead of opening a new one", async () => {
        const { unmount } = render(<ContentAiChat />)
        await typeAndSend("lần 1")

        unmount()
        render(<ContentAiChat />)
        await typeAndSend("lần 2")

        expect(createSessionMock).toHaveBeenCalledTimes(1)
        expect(streamMock.mock.calls.map((call) => call[0])).toEqual(["sess-1", "sess-1"])
    })

    it("MOUNTING does not clear anything — the regression that reintroduces the bug", () => {
        // a conversation already in the store for THIS lesson (as if the panel had just closed)
        useOverlayStore.setState({
            contentAiConversation: {
                contentId: "content-1",
                messages: [{ role: "user", content: "đã hỏi", display: "đã hỏi" }],
                draft: "đang gõ",
                sessionId: "sess-1",
                isStreaming: false,
            },
        })

        // mount, unmount, mount again — a reset-on-mount effect would eat it on any of these
        const first = render(<ContentAiChat />)
        first.unmount()
        render(<ContentAiChat />)

        const conversation = useOverlayStore.getState().contentAiConversation
        expect(conversation.messages).toHaveLength(1)
        expect(conversation.draft).toBe("đang gõ")
        expect(conversation.sessionId).toBe("sess-1")
        expect(screen.getByTestId("bubble-user").textContent).toBe("đã hỏi")
        expect(composer().value).toBe("đang gõ")
    })

    it("a REAL lesson change clears the thread, the draft and the session id", async () => {
        const { unmount } = render(<ContentAiChat />)
        await typeAndSend("hỏi ở bài 1")
        fireEvent.change(composer(), { target: { value: "nháp bài 1" } })
        expect(useOverlayStore.getState().contentAiConversation.messages).toHaveLength(2)

        // the learner opens a DIFFERENT lesson
        unmount()
        h.contentId = "content-2"
        render(<ContentAiChat />)

        expect(screen.queryByTestId("bubble-user")).toBeNull()
        expect(composer().value).toBe("")
        const conversation = useOverlayStore.getState().contentAiConversation
        expect(conversation.contentId).toBe("content-2")
        expect(conversation.messages).toEqual([])
        expect(conversation.sessionId).toBeNull()

        // …and the next send opens a FRESH session grounded on the new lesson
        await typeAndSend("hỏi ở bài 2")
        expect(createSessionMock).toHaveBeenLastCalledWith({
            feature: "TUTOR_CHAT",
            contextRef: { lessonId: "content-2" },
            model: "prov/model-x",
        })
    })

    it("does not resurrect the old thread when the learner comes BACK to the first lesson", async () => {
        const { unmount } = render(<ContentAiChat />)
        await typeAndSend("hỏi ở bài 1")

        // bài 1 → bài 2 → bài 1
        unmount()
        h.contentId = "content-2"
        const second = render(<ContentAiChat />)
        second.unmount()
        h.contentId = "content-1"
        render(<ContentAiChat />)

        expect(screen.queryByTestId("bubble-user")).toBeNull()
        expect(useOverlayStore.getState().contentAiConversation.messages).toEqual([])
    })

    it("a stream that finishes AFTER the panel closed still lands in the thread", async () => {
        // hold the stream open so it is still in flight when the panel unmounts
        let deliver: ((text: string) => void) | undefined
        let release: (() => void) | undefined
        streamMock.mockImplementation(
            (_sessionId, _content, handlers) =>
                new Promise<void>((resolve) => {
                    deliver = handlers.onDelta
                    release = resolve
                }),
        )
        const { unmount } = render(<ContentAiChat />)
        await typeAndSend("hỏi rồi bấm ra ngoài")

        unmount()
        // the SSE keeps writing into the store while nothing is mounted
        await act(async () => {
            deliver?.("câu trả lời đến muộn")
            release?.()
        })

        render(<ContentAiChat />)
        expect(screen.getByTestId("bubble-assistant").textContent).toContain("câu trả lời đến muộn")
        expect(useOverlayStore.getState().contentAiConversation.isStreaming).toBe(false)
    })

    it("drops a late stream chunk that arrives after the learner moved to another lesson", async () => {
        let deliver: ((text: string) => void) | undefined
        let release: (() => void) | undefined
        streamMock.mockImplementation(
            (_sessionId, _content, handlers) =>
                new Promise<void>((resolve) => {
                    deliver = handlers.onDelta
                    release = resolve
                }),
        )
        const { unmount } = render(<ContentAiChat />)
        await typeAndSend("hỏi ở bài 1")

        unmount()
        h.contentId = "content-2"
        render(<ContentAiChat />)

        await act(async () => {
            deliver?.("trả lời của bài 1")
            release?.()
        })

        // bài 2's fresh thread is untouched by bài 1's orphaned stream
        expect(screen.queryByTestId("bubble-assistant")).toBeNull()
        expect(useOverlayStore.getState().contentAiConversation.messages).toEqual([])
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

    it("selecting a model from the picker sends that REAL model id — never a react-aria-* auto key", async () => {
        render(<ContentAiChat />)

        // Pick the second catalog model from the menu. Its item is labelled by its
        // textValue (= the model id, since it carries no display label). The mock
        // fires onAction with the DropdownItem's `id` prop — so this only lands on
        // "prov/model-y" if the component sets `id`; a bare `key` yields react-aria-N.
        act(() => {
            fireEvent.click(screen.getByLabelText("prov/model-y"))
        })

        // the store holds the REAL model id, not an auto-generated collection key
        expect(useOverlayStore.getState().contentAiSelectedModel).toBe("prov/model-y")

        await typeAndSend("hi")

        const sentModel = streamMock.mock.calls[0][3]
        expect(sentModel).toBe("prov/model-y")
        expect(sentModel).not.toMatch(/^react-aria-/)
        expect(createSessionMock).toHaveBeenCalledWith({
            feature: "TUTOR_CHAT",
            contextRef: { lessonId: "content-1" },
            model: "prov/model-y",
        })
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

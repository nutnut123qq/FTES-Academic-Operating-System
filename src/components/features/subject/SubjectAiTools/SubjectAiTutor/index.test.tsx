import React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { AiModelCatalog, AiSessionView } from "@/modules/api/rest/ai"
import { useSubjectAiStore } from "@/hooks/zustand/subjectAi"

/**
 * Component — {@link SubjectAiTutor} on the REAL backend wiring:
 * (1) the first send lazily creates a `TUTOR_CHAT` session grounded on the
 * subject (`contextRef: {subjectId}` = the subject UUID, never the route code —
 * the BE parses it with `UUID.fromString` and silently drops the grounding on a
 * non-UUID) and streams over SSE, reusing that session
 * for later turns; and (2) the composer model picker sends the REAL catalog model
 * id (the react-aria collection key comes from the `id` PROP — a bare `key` would
 * send `react-aria-N` and earn a 400 `AI_MODEL_NOT_ALLOWED`).
 *
 * Heavy primitives (HeroUI, phosphor, markdown, the sibling in-panel views) are
 * mocked to trivial renderers; the REAL zustand store carries the open session +
 * picked model so the wiring under test is the production one. `t` echoes
 * `key(values…)`.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}(${Object.values(values).join(",")})` : key,
}))

// Model catalog SWR — controllable per test (data + error).
const h = vi.hoisted(() => ({
    catalog: { data: undefined, error: undefined } as {
        data?: AiModelCatalog
        error?: Error
    },
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetAiCatalogModelsSwr", () => ({
    useGetAiCatalogModelsSwr: () => h.catalog,
}))

// Transcript SWR — the thread starts empty (a fresh conversation).
vi.mock("./useSubjectTutorSwr", () => ({
    useAiSessionMessagesSwr: () => ({ data: undefined, isLoading: false }),
    useTutorSessionsInfiniteSwr: () => ({ data: [], mutate: vi.fn() }),
    TUTOR_SESSIONS_PAGE_SIZE: 20,
}))

// Auth guard — signed in, so `guard` is a passthrough.
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

// REST AI module — session + SSE stream are spies; helpers keep their contract.
vi.mock("@/modules/api/rest/ai", () => ({
    createSession: vi.fn(),
    sendSessionMessageStream: vi.fn(),
    archiveSession: vi.fn(),
    isFreeModel: () => false,
    isModelDown: (model: { status?: string }) => model.status === "down",
}))

vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <span />
    return {
        CaretUpIcon: Icon,
        ChatCircleIcon: Icon,
        GearIcon: Icon,
        PaperPlaneTiltIcon: Icon,
        SparkleIcon: Icon,
    }
})

vi.mock("@/components/reuseable/MarkdownContent", () => ({
    MarkdownContent: ({ markdown }: { markdown: string }) => <div>{markdown}</div>,
}))

vi.mock("../ToolSurfaceHeader", () => ({
    ToolSurfaceHeader: ({
        title,
        trailing,
    }: {
        title: string
        trailing?: React.ReactNode
    }) => (
        <div>
            <h2>{title}</h2>
            {trailing}
        </div>
    ),
}))

vi.mock("./TutorConversations", () => ({
    TutorConversations: () => <div data-testid="conversations" />,
}))

vi.mock("./TutorSettings", () => ({
    TutorSettings: () => <div data-testid="settings" />,
}))

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
    const Typography = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>
    const cn = (...args: Array<unknown>) => args.filter(Boolean).join(" ")

    // Model picker (Dropdown) — faithful to react-aria's collection: the node key
    // comes from the `id` PROP, NOT React's `key` (React strips `key`, so it never
    // reaches the collection).
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
        Dropdown: passthrough,
        DropdownItem,
        DropdownMenu,
        DropdownPopover: passthrough,
        DropdownTrigger: passthrough,
        Typography,
        cn,
    }
})

import { createSession, sendSessionMessageStream } from "@/modules/api/rest/ai"
import { SubjectAiTutor } from "./index"

const createSessionMock = vi.mocked(createSession)
const streamMock = vi.mocked(sendSessionMessageStream)

// The route segment is the subject CODE; the session grounding must carry the real
// UUID (`contextRef.subjectId` is parsed BE-side with `UUID.fromString`), so the two
// are deliberately different values here.
const SUBJECT_ID = "PRF192"
const SUBJECT_UUID = "0f8b4b2e-6b6a-4a2f-9c1d-1f3f5a7b9c11"

const CATALOG: AiModelCatalog = {
    models: [{ id: "prov/model-x", label: "Model X" }, { id: "prov/model-y" }],
    defaults: { chat: "prov/model-x" },
}

const renderTutor = () =>
    render(
        <SubjectAiTutor
            subjectId={SUBJECT_ID}
            subjectUuid={SUBJECT_UUID}
            subjectCode="PRF192"
            subjectName="Lập trình C"
            onBack={() => {}}
        />,
    )

/** Type a question and press send, flushing the async send inside act. */
const typeAndSend = async (text: string) => {
    fireEvent.change(screen.getByPlaceholderText("subjects.aiTools.tutor.placeholder"), {
        target: { value: text },
    })
    await act(async () => {
        fireEvent.click(screen.getByLabelText("subjects.aiTools.tutor.send"))
    })
}

beforeEach(() => {
    h.catalog.data = CATALOG
    h.catalog.error = undefined
    createSessionMock.mockResolvedValue({ id: "sess-1" } as AiSessionView)
    streamMock.mockImplementation(async (_sessionId, _content, handlers) => {
        handlers.onDelta("Đáp án")
        handlers.onDone?.({ messageId: "m-1", modelUsed: "prov/model-x" })
    })
    useSubjectAiStore.setState({ currentSessionBySubject: {}, model: null })
})

afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

describe("SubjectAiTutor — lazy session + real SSE stream", () => {
    it("creates the TUTOR_CHAT session grounded on the subject only on the FIRST send, then streams into it", async () => {
        renderTutor()

        // nothing is created just by opening the tutor (no empty sessions persisted)
        expect(createSessionMock).not.toHaveBeenCalled()

        await typeAndSend("Giải thích con trỏ?")

        expect(createSessionMock).toHaveBeenCalledTimes(1)
        expect(createSessionMock).toHaveBeenCalledWith({
            feature: "TUTOR_CHAT",
            contextRef: { subjectId: SUBJECT_UUID },
            model: "prov/model-x",
        })
        // grounding id is the UUID — the route code would be swallowed BE-side
        // (`UUID.fromString` in a try/catch → no subject line, no error)
        const contextRef = createSessionMock.mock.calls[0][0].contextRef as {
            subjectId?: string
        }
        expect(contextRef.subjectId).not.toBe(SUBJECT_ID)
        expect(streamMock).toHaveBeenCalledTimes(1)
        expect(streamMock.mock.calls[0][0]).toBe("sess-1")
        expect(streamMock.mock.calls[0][1]).toBe("Giải thích con trỏ?")
        // the open session is mirrored in the view-cache store
        expect(useSubjectAiStore.getState().currentSessionBySubject[SUBJECT_ID]).toBe("sess-1")
        // the streamed answer landed in the thread
        expect(screen.getByText("Đáp án")).toBeTruthy()

        await typeAndSend("Còn mảng thì sao?")

        // second turn REUSES the session — no second create
        expect(createSessionMock).toHaveBeenCalledTimes(1)
        expect(streamMock).toHaveBeenCalledTimes(2)
        expect(streamMock.mock.calls[1][0]).toBe("sess-1")
    })

    it("surfaces a translated error (and drops the empty answer bubble) when the stream errors", async () => {
        streamMock.mockImplementation(async (_sessionId, _content, handlers) => {
            handlers.onError?.("AI_QUOTA_EXCEEDED")
        })
        renderTutor()

        await typeAndSend("Hỏi khi hết quota")

        expect(screen.getByText("subjects.aiTools.tutor.quotaHit")).toBeTruthy()
        expect(screen.queryByText("subjects.aiTools.tutor.thinking")).toBeNull()
    })
})

describe("SubjectAiTutor — composer model picker", () => {
    it("defaults to the catalog default and rides it on the session + stream call", async () => {
        renderTutor()

        // trigger label = short name (part after the slash)
        expect(screen.getAllByText("model-x").length).toBeGreaterThanOrEqual(1)

        await typeAndSend("hi")

        expect(streamMock.mock.calls[0][3]).toBe("prov/model-x")
    })

    it("sends the REAL picked model id — never a react-aria-* auto key", async () => {
        renderTutor()

        // The mock fires onAction with the DropdownItem's `id` prop — this only
        // lands on "prov/model-y" if the component sets `id`; a bare `key` would
        // yield react-aria-N (the AI_MODEL_NOT_ALLOWED bug shape).
        act(() => {
            fireEvent.click(screen.getByLabelText("prov/model-y"))
        })

        expect(useSubjectAiStore.getState().model).toBe("prov/model-y")

        await typeAndSend("hi")

        const sentModel = streamMock.mock.calls[0][3]
        expect(sentModel).toBe("prov/model-y")
        expect(sentModel).not.toMatch(/^react-aria-/)
        expect(createSessionMock).toHaveBeenCalledWith({
            feature: "TUTOR_CHAT",
            contextRef: { subjectId: SUBJECT_UUID },
            model: "prov/model-y",
        })
    })

    it("degrades on an empty/errored catalog: picker hidden, chat still sends with NO model", async () => {
        h.catalog.data = undefined
        h.catalog.error = new Error("catalog down")
        renderTutor()

        expect(screen.queryByText("model-x")).toBeNull()

        await typeAndSend("hi")

        expect(createSessionMock).toHaveBeenCalledWith({
            feature: "TUTOR_CHAT",
            contextRef: { subjectId: SUBJECT_UUID },
        })
        expect(streamMock.mock.calls[0][3]).toBeUndefined()
    })

    it("AI_MODEL_NOT_ALLOWED resets the picker back to the catalog default", async () => {
        streamMock.mockImplementation(async (_sessionId, _content, handlers) => {
            handlers.onError?.("AI_MODEL_NOT_ALLOWED")
        })
        useSubjectAiStore.setState({ model: "prov/model-y" })
        renderTutor()

        await typeAndSend("hi")

        expect(useSubjectAiStore.getState().model).toBeNull()
        expect(screen.getByText("subjects.aiTools.tutor.modelNotAllowed")).toBeTruthy()
    })
})

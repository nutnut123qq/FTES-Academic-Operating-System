"use client"

import React from "react"
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownTrigger,
    Typography,
    cn,
} from "@heroui/react"
import {
    CaretUpIcon,
    ChatCircleIcon,
    GearIcon,
    PaperPlaneTiltIcon,
    SparkleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useGetAiCatalogModelsSwr } from "@/hooks/swr/api/rest/queries/useGetAiCatalogModelsSwr"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import {
    useSubjectAiStore,
    type SubjectAiMessage,
} from "@/hooks/zustand/subjectAi"
import { RestError } from "@/modules/api/rest/client"
import {
    createSession,
    isFreeModel,
    isModelDown,
    isModelLocked,
    sendSessionMessageStream,
} from "@/modules/api/rest/ai"

import { ToolSurfaceHeader } from "../ToolSurfaceHeader"
import { TutorConversations } from "./TutorConversations"
import { TutorSettings } from "./TutorSettings"
import { useAiSessionMessagesSwr } from "./useSubjectTutorSwr"

/** Props for {@link SubjectAiTutor}. */
export interface SubjectAiTutorProps {
    /**
     * The `[subjectId]` route segment — a subject CODE (`PRF192`). Used for the
     * view-cache keys (open session per subject), NEVER as the grounding id.
     */
    subjectId: string
    /**
     * The REAL subject UUID (`Subject.uuid`). This is what the session's
     * `contextRef.subjectId` must carry: the BE `SessionService.resolveSubject`
     * runs `UUID.fromString(...)` and swallows the exception, so a code here
     * silently drops the subject grounding (no "Môn học: …" system line, no
     * error).
     */
    subjectUuid: string
    /**
     * Subject code (e.g. `PRF192`) — kept for the parent call site; the answer is
     * grounded BE-side from `contextRef.subjectId`, so nothing is injected into
     * the prompt client-side.
     */
    subjectCode?: string
    subjectName: string
    onBack: () => void
}

/** In-panel view state — never a modal/drawer stacked over the surface. */
type TutorView = "chat" | "conversations" | "settings"

/** Client-side id for an in-flight turn (the BE assigns the persisted ids). */
const newId = () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/** Short display name for a model id (`openai/gpt-oss-120b` → `gpt-oss-120b`). */
const shortModelName = (id: string): string => {
    const slash = id.lastIndexOf("/")
    return slash === -1 ? id : id.slice(slash + 1)
}

/**
 * Maps an SSE `error` code / HTTP status to the i18n key of the message shown
 * under the thread. Codes come from `SessionController` (`AI_QUOTA_EXCEEDED`,
 * `AI_MODEL_NOT_ALLOWED`, `AI_SESSION_BUSY`, `AI_PROVIDER_UNAVAILABLE`,
 * `COURSE_ACCESS_DENIED`, `AI_FEATURE_FORBIDDEN`, `AI_SESSION_NOT_FOUND`) or from
 * the stream helper as `HTTP_<status>` when the request never became a stream.
 */
const errorKeyFor = (code: string): string => {
    switch (code) {
        case "AI_MODEL_NOT_ALLOWED":
            return "subjects.aiTools.tutor.modelNotAllowed"
        case "AI_QUOTA_EXCEEDED":
        case "AI_LESSON_CHAT_LIMIT_EXCEEDED":
        case "HTTP_429":
            return "subjects.aiTools.tutor.quotaHit"
        case "HTTP_401":
            return "subjects.aiTools.tutor.signInRequired"
        case "AI_FEATURE_FORBIDDEN":
        case "COURSE_ACCESS_DENIED":
        case "HTTP_403":
            return "subjects.aiTools.tutor.forbidden"
        case "AI_SESSION_BUSY":
            return "subjects.aiTools.tutor.sessionBusy"
        case "AI_SESSION_NOT_FOUND":
        case "HTTP_404":
            return "subjects.aiTools.tutor.sessionGone"
        default:
            return "subjects.aiTools.tutor.streamError"
    }
}

/** Same mapping for a thrown REST error (session create / non-stream failures). */
const errorKeyForRest = (error: unknown): string => {
    if (error instanceof RestError) {
        return errorKeyFor(error.errorCode ?? `HTTP_${error.status}`)
    }
    return "subjects.aiTools.tutor.streamError"
}

/**
 * Subject AI Tutor chat surface, wired to the REAL backend: a lazily-created
 * `TUTOR_CHAT` session grounded on the subject (`contextRef: {subjectId}` = the
 * subject UUID, NOT the route code), the
 * answer streamed over SSE (`delta`/`done`/`error`/`quota`), a composer-in-box
 * (flat input + [model picker · settings · send]) whose picker is fed by the
 * `/ai/models` catalog, plus in-panel conversations/settings views.
 *
 * The zustand store is only a view cache (open session per subject + picked
 * model); sessions, transcripts and deletion are owned by the BE.
 */
export const SubjectAiTutor = ({
    subjectId,
    subjectUuid,
    subjectName,
    onBack,
}: SubjectAiTutorProps) => {
    const t = useTranslations()
    const { guard } = useRequireAuth()
    const headingRef = React.useRef<HTMLHeadingElement>(null)
    const threadEndRef = React.useRef<HTMLDivElement>(null)

    const currentSessionId = useSubjectAiStore(
        (s) => s.currentSessionBySubject[subjectId] ?? null,
    )
    const setCurrentSession = useSubjectAiStore((s) => s.setCurrentSession)
    const model = useSubjectAiStore((s) => s.model)
    const setModel = useSubjectAiStore((s) => s.setModel)

    // Model catalog (GET /ai/models). Empty/errored catalog → the picker hides and
    // no `model` is sent, so the BE answers with its own `defaults.chat` (degrade).
    const modelsSwr = useGetAiCatalogModelsSwr()
    const catalogModels = modelsSwr.data?.models ?? []
    const hasCatalog = !modelsSwr.error && catalogModels.length > 0
    // Down AND spend-gated (locked) models stay listed but cannot be picked (locked → 403 on use).
    const disabledModelKeys = catalogModels
        .filter((catalogModel) => isModelDown(catalogModel) || isModelLocked(catalogModel))
        .map((catalogModel) => String(catalogModel.id))
    // Prefer the catalog chat default only when free/unlocked; the ai-service ships a spend-gated
    // default (gpt-4o-mini) that 403s free users, so fall back to gpt-oss (free) otherwise.
    const catalogChatDefault = modelsSwr.data?.defaults?.chat
    const catalogDefaultUsable = catalogModels.some(
        (m) => String(m.id) === catalogChatDefault && !isModelDown(m) && !(m as { locked?: boolean }).locked,
    )
    const defaultChatModel = catalogDefaultUsable ? catalogChatDefault : "openai/gpt-oss-120b"
    /** Model actually sent: the picked one, else the catalog default (when a catalog exists). */
    const activeModel = hasCatalog ? (model ?? defaultChatModel) : undefined

    const [view, setView] = React.useState<TutorView>("chat")
    const [draft, setDraft] = React.useState("")
    const [messages, setMessages] = React.useState<Array<SubjectAiMessage>>([])
    const [isStreaming, setIsStreaming] = React.useState(false)
    const [streamError, setStreamError] = React.useState<string | null>(null)
    const [lastQuestion, setLastQuestion] = React.useState("")

    /** Open session id, readable synchronously inside `send` (store is the mirror). */
    const sessionIdRef = React.useRef<string | null>(currentSessionId)
    /** Session whose transcript already hydrated the thread (hydrate once per session). */
    const hydratedRef = React.useRef<string | null>(null)
    /** Aborts the in-flight SSE stream (BE releases its Redis session lock on disconnect). */
    const abortRef = React.useRef<AbortController | null>(null)

    const messagesSwr = useAiSessionMessagesSwr(currentSessionId)

    React.useEffect(() => {
        headingRef.current?.focus()
    }, [])

    React.useEffect(() => {
        threadEndRef.current?.scrollIntoView({ block: "end" })
    }, [messages, isStreaming])

    // abort any live stream when the surface unmounts
    React.useEffect(() => () => abortRef.current?.abort(), [])

    // Hydrate the thread from the BE transcript ONCE per session. The ref is also
    // stamped right after a lazy create so this never clobbers the turn just sent.
    React.useEffect(() => {
        if (!currentSessionId || hydratedRef.current === currentSessionId) {
            return
        }
        const rows = messagesSwr.data
        if (!rows) {
            return
        }
        hydratedRef.current = currentSessionId
        setMessages(
            rows.map((row) => ({
                id: row.id,
                role: row.role?.toUpperCase() === "USER" ? "user" : "assistant",
                content: row.content ?? "",
                ...(row.modelUsed ? { modelUsed: row.modelUsed } : {}),
            })),
        )
    }, [currentSessionId, messagesSwr.data])

    /** Stop a live stream and drop the empty assistant placeholder it left behind. */
    const finish = React.useCallback((errorKey?: string) => {
        setIsStreaming(false)
        if (!errorKey) {
            return
        }
        setStreamError(errorKey)
        setMessages((prev) => {
            const last = prev[prev.length - 1]
            return last && last.role === "assistant" && !last.content
                ? prev.slice(0, -1)
                : prev
        })
    }, [])

    const sendQuestion = React.useCallback(
        async (question: string) => {
            const trimmed = question.trim()
            if (!trimmed || isStreaming) {
                return
            }

            setDraft("")
            setStreamError(null)
            setLastQuestion(trimmed)
            const answerId = newId()
            setMessages((prev) => [
                ...prev,
                { id: newId(), role: "user", content: trimmed },
                { id: answerId, role: "assistant", content: "" },
            ])
            setIsStreaming(true)

            /** Append one streamed chunk to the pending assistant turn. */
            const appendDelta = (delta: string) => {
                setMessages((prev) =>
                    prev.map((message) =>
                        message.id === answerId
                            ? { ...message, content: message.content + delta }
                            : message,
                    ),
                )
            }
            /** Stamp the serving model from the SSE `done` payload. */
            const onDone = (data: unknown) => {
                const modelUsed = (data as { modelUsed?: unknown } | null)?.modelUsed
                if (typeof modelUsed !== "string" || !modelUsed) {
                    return
                }
                setMessages((prev) =>
                    prev.map((message) =>
                        message.id === answerId ? { ...message, modelUsed } : message,
                    ),
                )
            }
            /** A rejected model resets the picker to the catalog default. */
            const onError = (code: string) => {
                if (code === "AI_MODEL_NOT_ALLOWED") {
                    setModel(null)
                }
                finish(errorKeyFor(code))
            }

            try {
                // Lazy session: created only on the first send so no empty session is
                // ever persisted. `contextRef.subjectId` is what the BE resolves for
                // subject grounding (SessionService#buildContextMessage) — and it
                // resolves it as a UUID (`UUID.fromString`, exception swallowed), so
                // the route CODE must never be sent here: it would cost the grounding
                // silently. Hence `subjectUuid`, not `subjectId`.
                if (!sessionIdRef.current) {
                    const session = await createSession({
                        feature: "TUTOR_CHAT",
                        contextRef: { subjectId: subjectUuid },
                        ...(activeModel ? { model: activeModel } : {}),
                    })
                    sessionIdRef.current = session.id
                    // mark as hydrated BEFORE the store update so the transcript effect
                    // cannot wipe the turn currently streaming
                    hydratedRef.current = session.id
                    setCurrentSession(subjectId, session.id)
                }

                abortRef.current?.abort()
                const controller = new AbortController()
                abortRef.current = controller
                await sendSessionMessageStream(
                    sessionIdRef.current,
                    trimmed,
                    {
                        onDelta: appendDelta,
                        onDone,
                        onError,
                        onQuota: () => finish("subjects.aiTools.tutor.quotaHit"),
                        signal: controller.signal,
                    },
                    activeModel,
                )
                setIsStreaming(false)
            } catch (error) {
                // an abort (view switch / unmount) is not an error worth surfacing
                if (error instanceof DOMException && error.name === "AbortError") {
                    setIsStreaming(false)
                    return
                }
                finish(errorKeyForRest(error))
            }
        },
        [
            activeModel,
            finish,
            isStreaming,
            setCurrentSession,
            setModel,
            subjectId,
            subjectUuid,
        ],
    )

    /** Guest → the sign-in modal opens and nothing is sent (house auth guard). */
    const send = guard((question: string) => {
        void sendQuestion(question)
    })

    /** Leave the live turn behind when the open conversation changes. */
    const switchSession = (sessionId: string | null) => {
        abortRef.current?.abort()
        abortRef.current = null
        setIsStreaming(false)
        setStreamError(null)
        setMessages([])
        // reset EXPLICITLY here (not in an effect on [sessionId]) — a lazy create
        // also changes the session id and would wipe the turn being sent. Clearing
        // the hydrate marker lets the picked session's transcript load.
        hydratedRef.current = null
        sessionIdRef.current = sessionId
        setCurrentSession(subjectId, sessionId)
        setView("chat")
    }

    // suggested first prompts (subject-scoped)
    const suggestions = [
        t("subjects.aiTools.tutor.suggestions.explain", { subject: subjectName }),
        t("subjects.aiTools.tutor.suggestions.plan", { subject: subjectName }),
        t("subjects.aiTools.tutor.suggestions.example"),
    ]

    if (view === "conversations") {
        return (
            <TutorConversations
                subjectUuid={subjectUuid}
                activeSessionId={currentSessionId}
                onBack={() => setView("chat")}
                onNew={() => switchSession(null)}
                onSwitch={(id) => switchSession(id)}
                onDeleted={(id) => {
                    if (id === currentSessionId) {
                        switchSession(null)
                        setView("conversations")
                    }
                }}
            />
        )
    }

    if (view === "settings") {
        return (
            <TutorSettings
                subjectUuid={subjectUuid}
                modelLabel={
                    activeModel
                        ? shortModelName(activeModel)
                        : t("subjects.aiTools.tutor.modelDefault")
                }
                onBack={() => setView("chat")}
                onCleared={() => switchSession(null)}
            />
        )
    }

    return (
        <div className="flex h-full flex-col gap-3 p-6">
            <ToolSurfaceHeader
                title={t("subjects.aiTools.tools.tutor.title")}
                onBack={onBack}
                backLabel={t("common.back")}
                headingRef={headingRef}
                trailing={
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="tertiary"
                            isIconOnly
                            aria-label={t("subjects.aiTools.tutor.conversations")}
                            onPress={() => setView("conversations")}
                        >
                            <ChatCircleIcon
                                className="size-5"
                                aria-hidden
                                focusable="false"
                            />
                        </Button>
                        <Button
                            size="sm"
                            variant="tertiary"
                            isIconOnly
                            aria-label={t("subjects.aiTools.tutor.settings")}
                            onPress={() => setView("settings")}
                        >
                            <GearIcon
                                className="size-5"
                                aria-hidden
                                focusable="false"
                            />
                        </Button>
                    </div>
                }
            />

            {/* thread */}
            <div
                aria-live="polite"
                className="flex min-h-64 flex-1 flex-col gap-3 overflow-y-auto"
            >
                {messages.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                        <SparkleIcon
                            className="size-8 text-accent"
                            aria-hidden
                            focusable="false"
                        />
                        <Typography type="body-sm" color="muted">
                            {messagesSwr.isLoading
                                ? t("subjects.aiTools.tutor.loadingThread")
                                : t("subjects.aiTools.tutor.emptyHint", {
                                    subject: subjectName,
                                })}
                        </Typography>
                        <div className="flex flex-wrap justify-center gap-2">
                            {suggestions.map((prompt) => (
                                <Button
                                    key={prompt}
                                    size="sm"
                                    variant="secondary"
                                    isDisabled={isStreaming}
                                    onPress={() => send(prompt)}
                                >
                                    {prompt}
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                                "max-w-[85%] rounded-large px-4 py-2",
                                message.role === "user"
                                    ? "self-end bg-accent/10 text-foreground"
                                    : "self-start border border-separator",
                            )}
                        >
                            {message.role === "assistant" ? (
                                message.content ? (
                                    <div className="flex flex-col gap-1">
                                        <MarkdownContent markdown={message.content} />
                                        {message.modelUsed ? (
                                            <Typography type="body-xs" color="muted">
                                                {t("subjects.aiTools.tutor.answeredBy", {
                                                    model: shortModelName(
                                                        message.modelUsed,
                                                    ),
                                                })}
                                            </Typography>
                                        ) : null}
                                    </div>
                                ) : (
                                    <Typography type="body-sm" color="muted">
                                        {t("subjects.aiTools.tutor.thinking")}
                                    </Typography>
                                )
                            ) : (
                                <Typography type="body-sm">{message.content}</Typography>
                            )}
                        </div>
                    ))
                )}

                {streamError ? (
                    <div className="flex items-center gap-2 self-start">
                        <Typography type="body-sm" className="text-danger">
                            {t(streamError)}
                        </Typography>
                        <Button
                            size="sm"
                            variant="secondary"
                            isDisabled={isStreaming || !lastQuestion}
                            onPress={() => send(lastQuestion)}
                        >
                            {t("subjects.aiTools.retry")}
                        </Button>
                    </div>
                ) : null}
                <div ref={threadEndRef} />
            </div>

            {/* composer-in-box: flat input on top, controls row below, all in ONE box */}
            <div className="flex flex-col gap-2 rounded-2xl border border-default bg-surface px-3 py-2 focus-within:border-accent">
                <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault()
                            send(draft)
                        }
                    }}
                    rows={1}
                    placeholder={t("subjects.aiTools.tutor.placeholder")}
                    aria-label={t("subjects.aiTools.tutor.placeholder")}
                    className="resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                />
                <div className="flex items-center gap-2">
                    {/* model picker — opens UPWARD (composer sits at the panel bottom);
                        hidden while the catalog is empty/errored (chat still works) */}
                    {hasCatalog ? (
                        <Dropdown>
                            <DropdownTrigger className="cursor-pointer">
                                <div className="flex items-center gap-1 text-sm text-muted">
                                    <SparkleIcon
                                        className="size-4"
                                        aria-hidden
                                        focusable="false"
                                    />
                                    <span className="max-w-40 truncate">
                                        {activeModel
                                            ? shortModelName(activeModel)
                                            : t("subjects.aiTools.tutor.modelDefault")}
                                    </span>
                                    <CaretUpIcon
                                        className="size-4"
                                        aria-hidden
                                        focusable="false"
                                    />
                                </div>
                            </DropdownTrigger>
                            <DropdownPopover placement="top start" className="min-w-56">
                                <DropdownMenu
                                    aria-label={t("subjects.aiTools.tutor.modelLabel")}
                                    disabledKeys={disabledModelKeys}
                                    onAction={(key) => setModel(String(key))}
                                >
                                    {catalogModels
                                        .filter((catalogModel) => !!catalogModel.id)
                                        .map((catalogModel) => (
                                            <DropdownItem
                                                // react-aria reads the collection key from the `id`
                                                // PROP (React strips `key`) — without `id` the item
                                                // key is an auto `react-aria-N`, which would be sent
                                                // as the model → 400 AI_MODEL_NOT_ALLOWED.
                                                key={String(catalogModel.id)}
                                                id={String(catalogModel.id)}
                                                textValue={
                                                    catalogModel.label ?? catalogModel.id
                                                }
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <span>
                                                        {catalogModel.label ??
                                                            shortModelName(catalogModel.id)}
                                                    </span>
                                                    {/* pricing_hint is an OBJECT — never render it */}
                                                    {isModelDown(catalogModel) ? (
                                                        <Typography
                                                            type="body-xs"
                                                            color="muted"
                                                        >
                                                            {t(
                                                                "subjects.aiTools.tutor.modelUnavailable",
                                                            )}
                                                        </Typography>
                                                    ) : isModelLocked(catalogModel) ? (
                                                        <Typography
                                                            type="body-xs"
                                                            color="muted"
                                                        >
                                                            🔒
                                                        </Typography>
                                                    ) : isFreeModel(catalogModel) ? (
                                                        <Typography
                                                            type="body-xs"
                                                            color="muted"
                                                        >
                                                            {t(
                                                                "subjects.aiTools.tutor.modelFree",
                                                            )}
                                                        </Typography>
                                                    ) : null}
                                                </div>
                                            </DropdownItem>
                                        ))}
                                </DropdownMenu>
                            </DropdownPopover>
                        </Dropdown>
                    ) : null}
                    <div className="flex-1" />
                    <Button
                        size="sm"
                        variant="tertiary"
                        isIconOnly
                        aria-label={t("subjects.aiTools.tutor.settings")}
                        onPress={() => setView("settings")}
                    >
                        <GearIcon
                            className="size-5"
                            aria-hidden
                            focusable="false"
                        />
                    </Button>
                    <Button
                        size="sm"
                        variant="primary"
                        isIconOnly
                        isPending={isStreaming}
                        aria-label={t("subjects.aiTools.tutor.send")}
                        isDisabled={!draft.trim() || isStreaming}
                        onPress={() => send(draft)}
                    >
                        <PaperPlaneTiltIcon
                            className="size-5"
                            aria-hidden
                            focusable="false"
                        />
                    </Button>
                </div>
            </div>
        </div>
    )
}

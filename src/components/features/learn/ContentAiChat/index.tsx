"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import {
    Button,
    CloseButton,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownTrigger,
    ScrollShadow,
    Typography,
    cn,
} from "@heroui/react"
import {
    CaretUpIcon,
    PaperPlaneTiltIcon,
    QuotesIcon,
    SparkleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { ChatBubble } from "@/components/blocks/feed/ChatBubble"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useGetAiCatalogModelsSwr } from "@/hooks/swr/api/rest/queries/useGetAiCatalogModelsSwr"
import { useContentAiSelectedModel, useContentAiSelection } from "@/hooks/zustand/overlay/hooks"
import { createSession, isFreeModel, isModelDown, sendSessionMessageStream } from "@/modules/api/rest/ai"

/** BE default chat model when the catalog omits `defaults.chat`. */
const FALLBACK_CHAT_MODEL = "openai/gpt-oss-120b"

/** Short display name for a model id (`openai/gpt-oss-120b` → `gpt-oss-120b`). */
const shortModelName = (id: string): string => {
    const slash = id.lastIndexOf("/")
    return slash === -1 ? id : id.slice(slash + 1)
}

/** Generic starter questions in the empty chat (keys under reader.ai.suggestions). */
const SUGGESTION_KEYS = ["summarize", "hardest", "example", "remember"] as const

/** Scoped quick-asks shown when a lesson passage is selected. */
const SELECTION_SUGGESTION_KEYS = ["explain", "example", "simplify"] as const

/** One turn in the content-AI conversation. */
interface ChatMessage {
    role: "user" | "assistant"
    /** The message text (assistant content may be markdown). */
    content: string
    /** What to show in the bubble (user turns hide the prepended quote context). */
    display: string
    /** Model that served this assistant answer (from the SSE `done` event); rendered as a caption. */
    modelUsed?: string
}

/** Props for {@link ContentAiChat}. */
export interface ContentAiChatProps {
    className?: string
}

/** Cap a passage for the "about this passage" quote label. */
const truncate = (text: string) => (text.length > 120 ? `${text.slice(0, 120)}…` : text)

/**
 * Content-AI chat thread + composer (StarCI port). The body of the ask-AI
 * popover/drawer: a suggestion list in the empty state, a selected-passage
 * context banner with scoped quick-asks, a ChatBubble thread and a composer.
 *
 * When a passage is selected (via {@link import("../LessonReader/ContentAiSelectionAsk").ContentAiSelectionAsk}),
 * the message SENT to the BE carries the full selected passage plus the containing
 * paragraph as a marked reference-data block, while the user bubble keeps showing only
 * the truncated-quote label + question. The answer is a mocked reply (a real BE streams
 * token-by-token over a socket — see the content-ai rules); the streaming UI is
 * wired to an obvious mock so the swap is a one-liner.
 *
 * @param props - {@link ContentAiChatProps}
 */
export const ContentAiChat = ({ className }: ContentAiChatProps) => {
    const t = useTranslations("learn")
    const { selection, selectionContext, setSelection } = useContentAiSelection()
    const { selectedModel, setSelectedModel } = useContentAiSelectedModel()
    const { contentId } = useParams<{ contentId?: string }>()

    // Model catalog (GET /ai/models). The picker hides on empty/errored catalog while
    // chat keeps working with no `model` field sent (BE grades with its own default).
    const modelsSwr = useGetAiCatalogModelsSwr()
    const catalogModels = modelsSwr.data?.models ?? []
    const hasCatalog = !modelsSwr.error && catalogModels.length > 0
    // Down models stay listed (so the user sees why) but can't be picked.
    const disabledModelKeys = catalogModels.filter(isModelDown).map((model) => String(model.id))
    const defaultChatModel = modelsSwr.data?.defaults?.chat ?? FALLBACK_CHAT_MODEL
    /** The model to actually send: the picked one, else the catalog default (when a catalog exists). */
    const activeModel = hasCatalog ? (selectedModel ?? defaultChatModel) : undefined

    const [messages, setMessages] = useState<Array<ChatMessage>>([])
    const [input, setInput] = useState("")
    const [isStreaming, setIsStreaming] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    /** Reused TUTOR_CHAT session id — created lazily on the first send. */
    const sessionIdRef = useRef<string | null>(null)
    /** Aborts the in-flight SSE stream on unmount. */
    const abortRef = useRef<AbortController | null>(null)

    // follow the thread to the bottom as turns append / the answer streams
    useEffect(() => {
        const element = scrollRef.current
        if (element) {
            element.scrollTop = element.scrollHeight
        }
    }, [messages])

    // abort any in-flight stream on unmount (BE releases its Redis lock on client disconnect)
    useEffect(() => () => abortRef.current?.abort(), [])

    /** Send a question; stream the real AI tutor answer over SSE (TUTOR_CHAT session). */
    const onSend = useCallback(
        async (preset?: string) => {
            const raw = (preset ?? input).trim()
            if (!raw || isStreaming) {
                return
            }
            // When a passage is selected, two forms diverge:
            //  - `display` (the user bubble): the truncated-quote label + question — unchanged UI.
            //  - `sent` (the message that actually reaches the BE): the FULL selected passage
            //    (already capped at 600 chars by ContentAiSelectionAsk) + question, plus the
            //    containing paragraph as a clearly-marked REFERENCE-DATA block (not an
            //    instruction) so the model can ground a short selection without weakening the
            //    BE prompt-injection posture.
            const display = selection ? `${t("reader.ai.aboutPassage", { passage: truncate(selection) })} ${raw}` : raw
            const sent = selection
                ? `${t("reader.ai.aboutPassage", { passage: selection })} ${raw}` +
                  (selectionContext ? `\n\n[${t("reader.ai.passageContext")}: ${selectionContext}]` : "")
                : raw
            setMessages((prev) => [
                ...prev,
                { role: "user", content: sent, display },
                { role: "assistant", content: "", display: "" },
            ])
            setInput("")
            setSelection(null)
            setIsStreaming(true)

            // append each streamed chunk to the (last) assistant turn
            const appendDelta = (delta: string) => {
                setMessages((prev) => {
                    const next = [...prev]
                    const last = next[next.length - 1]
                    if (last && last.role === "assistant") {
                        const content = last.content + delta
                        next[next.length - 1] = { ...last, content, display: content }
                    }
                    return next
                })
            }
            // finish the turn; surface a fallback only when nothing streamed
            const finish = (fallback?: string) => {
                if (fallback) {
                    setMessages((prev) => {
                        const next = [...prev]
                        const last = next[next.length - 1]
                        if (last && last.role === "assistant" && !last.content) {
                            next[next.length - 1] = { ...last, content: fallback, display: fallback }
                        }
                        return next
                    })
                }
                setIsStreaming(false)
            }
            // stamp the serving model onto the (last) assistant turn from the `done` event
            const onDone = (data: unknown) => {
                const modelUsed = (data as { modelUsed?: unknown } | null)?.modelUsed
                if (typeof modelUsed !== "string" || !modelUsed) {
                    return
                }
                setMessages((prev) => {
                    const next = [...prev]
                    const last = next[next.length - 1]
                    if (last && last.role === "assistant") {
                        next[next.length - 1] = { ...last, modelUsed }
                    }
                    return next
                })
            }
            // a rejected model resets the picker to the default and shows a translated notice
            const onError = (code: string) => {
                if (code === "AI_MODEL_NOT_ALLOWED") {
                    setSelectedModel(null)
                    finish(t("reader.ai.modelNotAllowed"))
                } else {
                    finish(t("reader.ai.error"))
                }
            }

            try {
                // Lazy TUTOR_CHAT session, grounded on the lesson when a contentId is present.
                if (!sessionIdRef.current) {
                    const session = await createSession({
                        feature: "TUTOR_CHAT",
                        ...(contentId ? { contextRef: { lessonId: contentId } } : {}),
                        ...(activeModel ? { model: activeModel } : {}),
                    })
                    sessionIdRef.current = session.id
                }
                const controller = new AbortController()
                abortRef.current = controller
                await sendSessionMessageStream(
                    sessionIdRef.current,
                    sent,
                    {
                        onDelta: appendDelta,
                        onDone,
                        onError,
                        onQuota: () => finish(t("reader.ai.quotaHit")),
                        signal: controller.signal,
                    },
                    activeModel,
                )
                finish()
            } catch {
                finish(t("reader.ai.error"))
            }
        },
        [input, isStreaming, selection, selectionContext, setSelection, t, contentId, activeModel, setSelectedModel],
    )

    return (
        <div className={cn("flex h-full flex-col gap-3", className)}>
            {/* thread — self-bounded scroll region (never scrolls the page/popover) */}
            <ScrollShadow ref={scrollRef} hideScrollBar className="max-h-[55vh] min-h-0 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-3">
                    {messages.length === 0 && !selection ? (
                        <div className="flex flex-col gap-2">
                            <Typography type="body-sm" color="muted">
                                {t("reader.ai.hint")}
                            </Typography>
                            {SUGGESTION_KEYS.map((key) => (
                                <Button
                                    key={key}
                                    variant="secondary"
                                    size="sm"
                                    className="justify-start text-start"
                                    onPress={() => void onSend(t(`reader.ai.suggestions.${key}`))}
                                >
                                    {t(`reader.ai.suggestions.${key}`)}
                                </Button>
                            ))}
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <ChatBubble key={index} role={message.role}>
                                {message.role === "assistant" ? (
                                    message.content === "" ? (
                                        <Typography type="body-sm" color="muted">
                                            {t("reader.ai.thinking")}
                                        </Typography>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            <MarkdownContent markdown={message.content} />
                                            {message.modelUsed ? (
                                                <Typography type="body-xs" color="muted">
                                                    {t("reader.ai.answeredBy", {
                                                        model: message.modelUsed,
                                                    })}
                                                </Typography>
                                            ) : null}
                                        </div>
                                    )
                                ) : (
                                    <Typography type="body-sm">{message.display}</Typography>
                                )}
                            </ChatBubble>
                        ))
                    )}
                </div>
            </ScrollShadow>

            {/* selected-passage context banner + scoped quick-asks */}
            {selection ? (
                <div className="flex flex-col gap-2 rounded-xl border border-default px-3 py-2">
                    <div className="flex items-start gap-2">
                        <QuotesIcon aria-hidden focusable="false" className="mt-0.5 size-4 shrink-0 text-muted" />
                        <Typography type="body-sm" color="muted" className="line-clamp-2 min-w-0 flex-1">
                            {selection}
                        </Typography>
                        <CloseButton
                            aria-label={t("reader.ai.clearSelection")}
                            className="shrink-0 text-muted hover:bg-default"
                            onPress={() => setSelection(null)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {SELECTION_SUGGESTION_KEYS.map((key) => (
                            <Button
                                key={key}
                                variant="secondary"
                                size="sm"
                                onPress={() => void onSend(t(`reader.ai.quickAsks.${key}`))}
                            >
                                {t(`reader.ai.quickAsks.${key}`)}
                            </Button>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* composer — a single bounded box: flat input on top, a controls row
                (model picker · send) BELOW, all inside the one box (composer-in-box rule) */}
            <div className="flex flex-col gap-2 rounded-2xl bg-default px-3 py-2 focus-within:ring-2 focus-within:ring-accent">
                <textarea
                    rows={1}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={t("reader.ai.placeholder")}
                    aria-label={t("reader.ai.placeholder")}
                    className="max-h-24 min-h-6 w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault()
                            void onSend()
                        }
                    }}
                />
                <div className="flex items-center gap-2">
                    {/* model picker — opens UPWARD (composer sits at the panel bottom);
                        hidden while the catalog is empty/errored (chat still works, no model sent) */}
                    {hasCatalog ? (
                        <Dropdown>
                            <DropdownTrigger className="cursor-pointer">
                                <div className="flex items-center gap-1 text-sm text-muted">
                                    <SparkleIcon aria-hidden focusable="false" className="size-4 text-accent" />
                                    <span className="max-w-40 truncate">
                                        {shortModelName(activeModel ?? defaultChatModel)}
                                    </span>
                                    <CaretUpIcon aria-hidden focusable="false" className="size-4" />
                                </div>
                            </DropdownTrigger>
                            <DropdownPopover placement="top start" className="min-w-56">
                                <DropdownMenu
                                    aria-label={t("reader.ai.modelLabel")}
                                    disabledKeys={disabledModelKeys}
                                    onAction={(key) => setSelectedModel(String(key))}
                                >
                                    {catalogModels
                                        .filter((catalogModel) => !!catalogModel.id)
                                        .map((catalogModel) => (
                                            <DropdownItem
                                                key={String(catalogModel.id)}
                                                textValue={catalogModel.label ?? catalogModel.id}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <span>{catalogModel.label ?? shortModelName(catalogModel.id)}</span>
                                                    {/* pricing_hint is an OBJECT — never render it directly;
                                                        show the free / unavailable signal instead. */}
                                                    {isModelDown(catalogModel) ? (
                                                        <Typography type="body-xs" color="muted">
                                                            {t("codeGrading.unavailableTag")}
                                                        </Typography>
                                                    ) : isFreeModel(catalogModel) ? (
                                                        <Typography type="body-xs" color="muted">
                                                            {t("codeGrading.freeTag")}
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
                        isIconOnly
                        size="sm"
                        variant="primary"
                        isPending={isStreaming}
                        aria-label={t("reader.ai.send")}
                        isDisabled={input.trim() === ""}
                        onPress={() => void onSend()}
                    >
                        <PaperPlaneTiltIcon aria-hidden focusable="false" className="size-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default ContentAiChat

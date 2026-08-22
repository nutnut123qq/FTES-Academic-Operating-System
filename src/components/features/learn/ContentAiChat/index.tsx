"use client"

import React, { useCallback, useEffect, useRef } from "react"
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
import {
    useContentAiConversation,
    useContentAiSelectedModel,
    useContentAiSelection,
} from "@/hooks/zustand/overlay/hooks"
import { createSession, isFreeModel, isModelDown, isModelLocked, sendSessionMessageStream } from "@/modules/api/rest/ai"

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

/** Props for {@link ContentAiChat}. */
export interface ContentAiChatProps {
    className?: string
    /**
     * Full-screen host (the FAB's "mở rộng" mode). When true the thread drops its
     * docked `max-h-[55vh]` cap and just flexes to fill the tall container, so the
     * conversation uses the whole screen. The component itself is UNCHANGED between
     * modes (same instance) — only the scroll region's height ceiling differs. (The
     * conversation is store-backed now, so even a remount would keep it; the stable
     * tree position is still worth keeping for scroll position + focus.)
     */
    expanded?: boolean
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
 * the truncated-quote label + question. The answer streams token-by-token over SSE
 * (`sendSessionMessageStream`) into a lazily-created TUTOR_CHAT session.
 *
 * ★ STATELESS about the conversation. The thread, the composer draft, the session id and
 * the streaming flag all live in the overlay store
 * ({@link import("@/hooks/zustand/overlay/hooks").useContentAiConversation}), because every
 * host of this panel unmounts it on close. Both hosts — the FAB popover/drawer and the
 * selection-anchored panel — therefore share ONE conversation per lesson, which is what a
 * learner expects from a single lesson tutor.
 *
 * @param props - {@link ContentAiChatProps}
 */
export const ContentAiChat = ({ className, expanded = false }: ContentAiChatProps) => {
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
    // Disable both down models AND spend-gated (locked) models so a free user can't pick one and 403.
    const disabledModelKeys = catalogModels
        .filter((model) => isModelDown(model) || isModelLocked(model))
        .map((model) => String(model.id))
    // Prefer the catalog chat default only when it is free/unlocked. The ai-service catalog ships a
    // spend-gated default (gpt-4o-mini) that 403s free users, so fall back to gpt-oss (free) otherwise.
    const catalogChatDefault = modelsSwr.data?.defaults?.chat
    const catalogDefaultUsable = catalogModels.some(
        (m) => String(m.id) === catalogChatDefault && !isModelDown(m) && !(m as { locked?: boolean }).locked,
    )
    const defaultChatModel = catalogDefaultUsable ? (catalogChatDefault as string) : FALLBACK_CHAT_MODEL
    /** The model to actually send: the picked one, else the catalog default (when a catalog exists). */
    const activeModel = hasCatalog ? (selectedModel ?? defaultChatModel) : undefined

    // ★ The conversation lives in the OVERLAY STORE, not in this component. The popover /
    // bottom-sheet that hosts this panel UNMOUNTS it on every close (click-outside, Escape,
    // the mascot toggle), so component state lost the thread, the half-typed question and
    // the session id each time. Store-backed, all of it survives close→reopen; only a real
    // lesson change clears it (`useContentAiLessonReset`, guarded on the lesson the
    // conversation already carries — never on mount).
    const {
        messages,
        draft: input,
        sessionId,
        isStreaming,
        setDraft: setInput,
        setMessages,
        setSessionId,
        setStreaming: setIsStreaming,
    } = useContentAiConversation(contentId ?? null)
    const scrollRef = useRef<HTMLDivElement>(null)

    // follow the thread to the bottom as turns append / the answer streams (also on
    // re-open: the restored thread lands scrolled to the newest turn)
    useEffect(() => {
        const element = scrollRef.current
        if (element) {
            element.scrollTop = element.scrollHeight
        }
    }, [messages])

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
                // Reused across closes now that the id lives in the store, so re-opening the
                // panel continues the SAME BE conversation instead of starting a new one.
                let activeSessionId = sessionId
                if (!activeSessionId) {
                    const session = await createSession({
                        feature: "TUTOR_CHAT",
                        ...(contentId ? { contextRef: { lessonId: contentId } } : {}),
                        ...(activeModel ? { model: activeModel } : {}),
                    })
                    activeSessionId = session.id
                    setSessionId(activeSessionId)
                }
                // NO AbortController: an in-flight stream deliberately OUTLIVES this panel.
                // Closing the chat used to abort it, so re-opening showed a half-written
                // answer — the very loss the store lift exists to stop. The handlers write
                // into the store, which is alive whether or not the panel is mounted, so the
                // answer finishes in the background and is complete when the learner comes
                // back. Writes are lesson-scoped, so a delta arriving after the learner has
                // moved to another lesson is dropped rather than pasted into the new thread.
                await sendSessionMessageStream(
                    activeSessionId,
                    sent,
                    {
                        onDelta: appendDelta,
                        onDone,
                        onError,
                        onQuota: () => finish(t("reader.ai.quotaHit")),
                    },
                    activeModel,
                )
                finish()
            } catch {
                finish(t("reader.ai.error"))
            }
        },
        [
            input,
            isStreaming,
            selection,
            selectionContext,
            setSelection,
            t,
            contentId,
            activeModel,
            setSelectedModel,
            sessionId,
            setInput,
            setMessages,
            setSessionId,
            setIsStreaming,
        ],
    )

    return (
        <div className={cn("flex h-full flex-col gap-3", className)}>
            {/* thread — self-bounded scroll region (never scrolls the page/popover). Docked:
                capped at 55vh so the popover stays compact; expanded (full-screen): no cap, just
                flex to fill the tall container. */}
            <ScrollShadow
                ref={scrollRef}
                hideScrollBar
                className={cn("min-h-0 flex-1 overflow-y-auto", expanded ? undefined : "max-h-[55vh]")}
            >
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
                                                // `key` is React's reconciliation key and is stripped by React —
                                                // it never reaches the collection. HeroUI/react-aria read the
                                                // collection node key from the `id` PROP (Document.setProps:
                                                // `id ?? react-aria-${n}`), and `onAction`/`disabledKeys` are keyed
                                                // by it. Without `id` the item gets an auto `react-aria-N` key, which
                                                // is what would be sent as the model → BE 400 AI_MODEL_NOT_ALLOWED.
                                                key={String(catalogModel.id)}
                                                id={String(catalogModel.id)}
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
                                                    ) : isModelLocked(catalogModel) ? (
                                                        <Typography type="body-xs" color="muted">
                                                            🔒
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

"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownTrigger,
    ScrollShadow,
    Typography,
    cn,
} from "@heroui/react"
import { CaretUpIcon, PaperPlaneTiltIcon, SparkleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { ChatBubble } from "@/components/blocks/feed/ChatBubble"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { isQuotaError } from "@/components/features/ai-platform/hooks/useAiToolJob"
import { useGetAiCatalogModelsSwr } from "@/hooks/swr/api/rest/queries/useGetAiCatalogModelsSwr"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { RestError } from "@/modules/api/rest/client"
import { askDocumentQa, isFreeModel, isModelDown } from "@/modules/api/rest/ai"
import type { DocumentQaCitation } from "@/modules/api/rest/ai"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Starter questions in the empty thread (keys under `resourceHub.aiQa.suggestions`). */
const SUGGESTION_KEYS = ["summarize", "keyPoints", "terms"] as const

/** Short display name for a model id (`openai/gpt-oss-120b` → `gpt-oss-120b`). */
const shortModelName = (id: string): string => {
    const slash = id.lastIndexOf("/")
    return slash === -1 ? id : id.slice(slash + 1)
}

/**
 * What an assistant turn is showing:
 *  - `pending`   — request in flight ("Đang tìm câu trả lời…").
 *  - `answer`    — a real answer (markdown + citations + model caption).
 *  - `processing` — the document is still being indexed/OCR'd (BE refunded the
 *    quota) → soft notice + a free "Thử lại" that resends the SAME question.
 *  - `notice`    — a mapped, non-retryable rejection (quota / model / access).
 *  - `error`     — a generic failure (502/503/network).
 */
type QaTurnKind = "pending" | "answer" | "processing" | "notice" | "error"

/** One turn in the document-QA thread. */
export interface ResourceQaMessage {
    role: "user" | "assistant"
    /** Bubble text — markdown for an answer, a translated line for a notice/error. */
    content: string
    /** Citations of an answer (already stripped of quote-less entries). */
    citations?: Array<DocumentQaCitation>
    /** Model that actually served the answer (`model` in the response). */
    modelUsed?: string
    /** Assistant-turn state; user turns leave it undefined. */
    kind?: QaTurnKind
    /** The question this assistant turn answers — the exact text a retry resends. */
    question?: string
}

/** Props for {@link ResourceAiQa}. */
export interface ResourceAiQaProps extends WithClassNames<undefined> {
    /**
     * Resource id used as `documentId` for `POST /api/v1/ai/document-qa` (the BE
     * resolves the current version's file + gates read access by it).
     */
    documentId: string
}

/**
 * "Hỏi đáp AI về tài liệu" — the document-QA thread on a resource detail page.
 *
 * NOT streamed: every turn is exactly one `POST /ai/document-qa` request that
 * answers with `{answer, citations[], model}` (or a soft `{processing: true}`
 * while the document is still being indexed/OCR'd — quota is refunded BE-side,
 * so the "Thử lại" button costs nothing and there is deliberately NO auto-poll).
 *
 * Errors are rendered IN-THREAD (never a toast): quota → `quotaHit`, a rejected
 * model resets the picker + notice, a forbidden document → `accessDenied`, and
 * anything else (502/503) → the generic error line. Guests are sent to the sign-in
 * modal by `useRequireAuth().guard` instead of firing an unauthenticated request.
 *
 * @param props - {@link ResourceAiQaProps}
 */
export const ResourceAiQa = ({ documentId, className }: ResourceAiQaProps) => {
    const t = useTranslations("resourceHub.aiQa")
    const { guard } = useRequireAuth()

    // Model catalog (GET /ai/models). The picker hides on an empty/errored catalog;
    // the ask keeps working with NO `model` field (the BE resolves its own default).
    const modelsSwr = useGetAiCatalogModelsSwr()
    const catalogModels = modelsSwr.data?.models ?? []
    const hasCatalog = !modelsSwr.error && catalogModels.length > 0
    // Down models stay listed (so the user sees why) but can't be picked.
    const disabledModelKeys = catalogModels.filter(isModelDown).map((model) => String(model.id))
    const catalogDefaultModel = modelsSwr.data?.defaults?.document_qa ?? modelsSwr.data?.defaults?.chat

    /**
     * The picked model — LOCAL state on purpose (this thread is not the lesson
     * tutor chat, so it must not share the global content-AI model). `null` means
     * "send no `model` field at all" and let the BE pick the DOCUMENT_QA default.
     */
    const [selectedModel, setSelectedModel] = useState<string | null>(null)
    const [messages, setMessages] = useState<Array<ResourceQaMessage>>([])
    const [input, setInput] = useState("")
    const [isAsking, setIsAsking] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // follow the thread to the bottom as turns append
    useEffect(() => {
        const element = scrollRef.current
        if (element) {
            element.scrollTop = element.scrollHeight
        }
    }, [messages])

    /** Patch the assistant turn at `index` (the placeholder appended by the send). */
    const fillTurn = useCallback((index: number, patch: Partial<ResourceQaMessage>) => {
        setMessages((prev) => prev.map((message, i) => (i === index ? { ...message, ...patch } : message)))
    }, [])

    /**
     * Run one document-QA request and resolve the assistant turn at `index`.
     * Shared by a fresh send and by the "Thử lại" of a `processing` turn.
     */
    const runAsk = useCallback(
        async (question: string, index: number) => {
            setIsAsking(true)
            try {
                const response = await askDocumentQa({
                    documentId,
                    question,
                    // omit entirely when nothing is picked — BE default beats a guessed id
                    ...(selectedModel ? { model: selectedModel } : {}),
                })
                if (response?.processing) {
                    // not indexed yet — soft state, quota already refunded → retry is free
                    fillTurn(index, { kind: "processing", content: "", citations: undefined, modelUsed: undefined })
                    return
                }
                fillTurn(index, {
                    kind: "answer",
                    content: response?.answer ?? "",
                    // defensive: ai-service may pass through a citation with no quote
                    citations: (response?.citations ?? []).filter((citation) => !!citation?.quote),
                    modelUsed: response?.model,
                })
            } catch (error) {
                const code = error instanceof RestError ? error.errorCode : undefined
                const status = error instanceof RestError ? error.status : 0
                if (isQuotaError(error)) {
                    fillTurn(index, { kind: "notice", content: t("quotaHit") })
                } else if (code === "AI_MODEL_NOT_ALLOWED") {
                    // the picked model left the allowlist → fall back to the BE default
                    setSelectedModel(null)
                    fillTurn(index, { kind: "notice", content: t("modelNotAllowed") })
                } else if (code === "AI_DOCUMENT_ACCESS_DENIED" || status === 403) {
                    fillTurn(index, { kind: "notice", content: t("accessDenied") })
                } else {
                    fillTurn(index, { kind: "error", content: t("error") })
                }
            } finally {
                setIsAsking(false)
            }
        },
        [documentId, selectedModel, fillTurn, t],
    )

    /** Append the user turn + a pending assistant turn, then ask. */
    const send = useCallback(
        (raw?: string) => {
            const question = (raw ?? input).trim()
            if (question === "" || isAsking) {
                return
            }
            // the placeholder assistant turn lands right after the user turn
            const assistantIndex = messages.length + 1
            setMessages((prev) => [
                ...prev,
                { role: "user", content: question },
                { role: "assistant", content: "", kind: "pending", question },
            ])
            setInput("")
            void runAsk(question, assistantIndex)
        },
        [input, isAsking, messages.length, runAsk],
    )

    /** Resend the SAME question of a `processing` turn (BE refunded it — free). */
    const retry = useCallback(
        (index: number) => {
            const question = messages[index]?.question
            if (!question || isAsking) {
                return
            }
            fillTurn(index, { kind: "pending", content: "" })
            void runAsk(question, index)
        },
        [messages, isAsking, fillTurn, runAsk],
    )

    // guests never fire the request — the sign-in modal opens with the AI-QA context
    const guardedSend = guard((raw?: string) => send(raw), "auth.context.aiQa")
    const guardedRetry = guard((index: number) => retry(index), "auth.context.aiQa")

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            {/* thread — self-bounded scroll region (never scrolls the page) */}
            <ScrollShadow ref={scrollRef} hideScrollBar className="max-h-[55vh] min-h-0 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-3">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-start gap-2">
                            <Typography type="body-sm" color="muted">
                                {t("hint")}
                            </Typography>
                            {SUGGESTION_KEYS.map((key) => (
                                <Button
                                    key={key}
                                    variant="secondary"
                                    size="sm"
                                    className="justify-start text-start"
                                    isDisabled={isAsking}
                                    onPress={() => guardedSend(t(`suggestions.${key}`))}
                                >
                                    {t(`suggestions.${key}`)}
                                </Button>
                            ))}
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <ChatBubble key={index} role={message.role}>
                                {message.role === "user" ? (
                                    <Typography type="body-sm">{message.content}</Typography>
                                ) : message.kind === "pending" ? (
                                    <Typography type="body-sm" color="muted">
                                        {t("thinking")}
                                    </Typography>
                                ) : message.kind === "processing" ? (
                                    <div className="flex flex-col items-start gap-2">
                                        <Typography type="body-sm" color="muted">
                                            {t("processing")}
                                        </Typography>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            isDisabled={isAsking}
                                            onPress={() => guardedRetry(index)}
                                        >
                                            {t("retry")}
                                        </Button>
                                    </div>
                                ) : message.kind === "answer" ? (
                                    <div className="flex flex-col gap-2">
                                        <MarkdownContent markdown={message.content} />
                                        {message.citations && message.citations.length > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                <Typography type="body-xs" color="muted">
                                                    {t("citations")}
                                                </Typography>
                                                {message.citations.map((citation, citationIndex) => (
                                                    <div
                                                        key={citationIndex}
                                                        className="rounded-xl border border-default px-2 py-1"
                                                    >
                                                        <Typography
                                                            type="body-xs"
                                                            color="muted"
                                                            className="line-clamp-2"
                                                        >
                                                            {`[${citationIndex + 1}] ${citation.quote}`}
                                                        </Typography>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}
                                        {message.modelUsed ? (
                                            <Typography type="body-xs" color="muted">
                                                {t("answeredBy", { model: message.modelUsed })}
                                            </Typography>
                                        ) : null}
                                    </div>
                                ) : (
                                    // notice (quota / model / access) + generic error — in-thread, never a toast
                                    <Typography type="body-sm" color="muted">
                                        {message.content}
                                    </Typography>
                                )}
                            </ChatBubble>
                        ))
                    )}
                </div>
            </ScrollShadow>

            {/* composer — ONE bounded box: flat textarea on top, a controls row
                (model picker · send) BELOW, all inside the same box (composer-in-box rule) */}
            <div className="flex flex-col gap-2 rounded-2xl bg-default px-3 py-2 focus-within:ring-2 focus-within:ring-accent">
                <textarea
                    id="resource-ai-qa-input"
                    rows={1}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={t("placeholder")}
                    aria-label={t("placeholder")}
                    className="max-h-24 min-h-6 w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault()
                            guardedSend()
                        }
                    }}
                />
                <div className="flex items-center gap-2">
                    {/* model picker — opens UPWARD (the composer sits at the bottom of the box);
                        hidden while the catalog is empty/errored (asking still works, no model sent) */}
                    {hasCatalog ? (
                        <Dropdown>
                            <DropdownTrigger className="cursor-pointer">
                                <div className="flex items-center gap-1 text-sm text-muted">
                                    <SparkleIcon aria-hidden focusable="false" className="size-4 text-accent" />
                                    <span className="max-w-40 truncate">
                                        {selectedModel
                                            ? shortModelName(selectedModel)
                                            : catalogDefaultModel
                                              ? shortModelName(catalogDefaultModel)
                                              : t("modelLabel")}
                                    </span>
                                    <CaretUpIcon aria-hidden focusable="false" className="size-4" />
                                </div>
                            </DropdownTrigger>
                            <DropdownPopover placement="top start" className="min-w-56">
                                <DropdownMenu
                                    aria-label={t("modelLabel")}
                                    disabledKeys={disabledModelKeys}
                                    onAction={(key) => setSelectedModel(String(key))}
                                >
                                    {catalogModels
                                        .filter((catalogModel) => !!catalogModel.id)
                                        .map((catalogModel) => (
                                            <DropdownItem
                                                // TRAP: `key` is React's reconciliation key and is stripped by
                                                // React — it never reaches the collection. HeroUI/react-aria read
                                                // the collection node key from the `id` PROP (`id ?? react-aria-${n}`)
                                                // and `onAction`/`disabledKeys` are keyed by it. Without `id` the
                                                // item gets an auto `react-aria-N` key, which is what would be sent
                                                // as the model → BE 400 AI_MODEL_NOT_ALLOWED.
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
                                                            {t("unavailableTag")}
                                                        </Typography>
                                                    ) : isFreeModel(catalogModel) ? (
                                                        <Typography type="body-xs" color="muted">
                                                            {t("freeTag")}
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
                        isPending={isAsking}
                        aria-label={t("send")}
                        isDisabled={input.trim() === ""}
                        onPress={() => guardedSend()}
                    >
                        <PaperPlaneTiltIcon aria-hidden focusable="false" className="size-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default ResourceAiQa

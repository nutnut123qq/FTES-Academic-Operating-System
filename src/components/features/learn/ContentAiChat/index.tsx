"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
    Button,
    CloseButton,
    ScrollShadow,
    Typography,
    cn,
} from "@heroui/react"
import { PaperPlaneTiltIcon, QuotesIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { ChatBubble } from "@/components/blocks/feed/ChatBubble"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useContentAiSelection } from "@/hooks/zustand/overlay/hooks"

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
 * the question is PREPENDED with the quote so the thread stays coherent while the
 * bubble shows only the question. The answer is a mocked reply (a real BE streams
 * token-by-token over a socket — see the content-ai rules); the streaming UI is
 * wired to an obvious mock so the swap is a one-liner.
 *
 * @param props - {@link ContentAiChatProps}
 */
export const ContentAiChat = ({ className }: ContentAiChatProps) => {
    const t = useTranslations("learn")
    const { selection, setSelection } = useContentAiSelection()

    const [messages, setMessages] = useState<Array<ChatMessage>>([])
    const [input, setInput] = useState("")
    const [isStreaming, setIsStreaming] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const streamTimerRef = useRef<number | null>(null)

    // follow the thread to the bottom as turns append / the answer streams
    useEffect(() => {
        const element = scrollRef.current
        if (element) {
            element.scrollTop = element.scrollHeight
        }
    }, [messages])

    useEffect(() => () => {
        if (streamTimerRef.current) {
            window.clearInterval(streamTimerRef.current)
        }
    }, [])

    /** Send a question; mock-stream the tutor reply token-by-token. */
    const onSend = useCallback(
        (preset?: string) => {
            const raw = (preset ?? input).trim()
            if (!raw || isStreaming) {
                return
            }
            // when a passage is selected, prepend the quote (shown in the bubble too)
            const display = selection ? `${t("reader.ai.aboutPassage", { passage: truncate(selection) })} ${raw}` : raw
            setMessages((prev) => [
                ...prev,
                { role: "user", content: display, display },
                { role: "assistant", content: "", display: "" },
            ])
            setInput("")
            setSelection(null)
            setIsStreaming(true)

            // MOCK streaming: reveal the canned reply a few words at a time. Swap this
            // block for the socket `onDelta` handler when the BE lands.
            const reply = t("reader.ai.stubReply")
            const words = reply.split(" ")
            let index = 0
            streamTimerRef.current = window.setInterval(() => {
                index += 1
                const chunk = words.slice(0, index).join(" ")
                setMessages((prev) => {
                    const next = [...prev]
                    const last = next[next.length - 1]
                    if (last && last.role === "assistant") {
                        next[next.length - 1] = { ...last, content: chunk, display: chunk }
                    }
                    return next
                })
                if (index >= words.length) {
                    if (streamTimerRef.current) {
                        window.clearInterval(streamTimerRef.current)
                        streamTimerRef.current = null
                    }
                    setIsStreaming(false)
                }
            }, 40)
        },
        [input, isStreaming, selection, setSelection, t],
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
                                    onPress={() => onSend(t(`reader.ai.suggestions.${key}`))}
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
                                        <MarkdownContent markdown={message.content} />
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
                                onPress={() => onSend(t(`reader.ai.quickAsks.${key}`))}
                            >
                                {t(`reader.ai.quickAsks.${key}`)}
                            </Button>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* composer — a single bounded box: flat input + a send control */}
            <div className="flex items-end gap-2 rounded-2xl bg-default px-3 py-2 focus-within:ring-2 focus-within:ring-accent">
                <textarea
                    rows={1}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={t("reader.ai.placeholder")}
                    aria-label={t("reader.ai.placeholder")}
                    className="max-h-24 min-h-6 w-full flex-1 resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault()
                            onSend()
                        }
                    }}
                />
                <Button
                    isIconOnly
                    size="sm"
                    variant="primary"
                    isPending={isStreaming}
                    aria-label={t("reader.ai.send")}
                    isDisabled={input.trim() === ""}
                    onPress={() => onSend()}
                >
                    <PaperPlaneTiltIcon aria-hidden focusable="false" className="size-5" />
                </Button>
            </div>
        </div>
    )
}

export default ContentAiChat

"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button, Input, TextField, Typography, cn } from "@heroui/react"
import {
    PaperPlaneTiltIcon,
    QuotesIcon,
    SparkleIcon,
    XIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { FloatingActionButton } from "@/components/blocks/buttons/FloatingActionButton"
import { useContentAiChatOverlayState, useContentAiSelection } from "@/hooks/zustand/overlay/hooks"

/** One chat message. */
interface AiMessage {
    id: string
    role: "user" | "assistant"
    text: string
}

/** Props for {@link ContentAiPanel}. */
export interface ContentAiPanelProps {
    /** Locked lessons suppress the AI entry entirely (gate matches select-none body). */
    isLocked: boolean
}

/**
 * Per-lesson AI tutor (priority 2, stub). A floating action button opens a right
 * side panel: a thread, a selection-context banner (when the learner asked about
 * a highlighted passage), quick-ask chips and a composer. Answers are a canned
 * stub — a real BE streams over socket.io (see the content-ai rules).
 *
 * The selected passage arrives via the overlay store (set by
 * `ContentAiSelectionAsk`); it is PREPENDED as a quote to the sent question and
 * cleared after send. Hidden entirely on locked (premium) lessons.
 */
export const ContentAiPanel = ({ isLocked }: ContentAiPanelProps) => {
    const t = useTranslations("learn")
    const { isOpen, open, close } = useContentAiChatOverlayState()
    const { selection, setSelection } = useContentAiSelection()

    const [messages, setMessages] = useState<Array<AiMessage>>([])
    const [draft, setDraft] = useState("")
    const threadRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight })
    }, [messages])

    if (isLocked) {
        return null
    }

    const ask = (question: string) => {
        const body = question.trim()
        if (body === "") {
            return
        }
        // Prepend the highlighted passage as a quote so the thread stays coherent.
        const display = selection ? t("reader.ai.aboutPassage", { passage: truncate(selection) }) + " " + body : body
        const userMessage: AiMessage = { id: `u-${Date.now()}`, role: "user", text: display }
        const reply: AiMessage = {
            id: `a-${Date.now()}`,
            role: "assistant",
            // ponytail: canned stub — a real BE streams a grounded answer.
            text: t("reader.ai.stubReply"),
        }
        setMessages((prev) => [...prev, userMessage, reply])
        setDraft("")
        setSelection(null)
    }

    const quickAsks = ["explain", "example", "simplify"] as const

    return (
        <>
            <FloatingActionButton onPress={open} ariaLabel={t("reader.ai.open")}>
                <SparkleIcon aria-hidden focusable="false" weight="fill" />
            </FloatingActionButton>

            {isOpen ? (
                <>
                    {/* scrim */}
                    <button
                        type="button"
                        aria-label={t("reader.ai.close")}
                        className="fixed inset-0 z-40 bg-black/40"
                        onClick={close}
                    />
                    <aside
                        role="dialog"
                        aria-label={t("reader.ai.title")}
                        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-separator bg-background shadow-xl"
                    >
                        {/* header */}
                        <div className="flex items-center gap-2 border-b border-separator p-4">
                            <SparkleIcon aria-hidden focusable="false" weight="fill" className="size-5 text-accent" />
                            <Typography type="body" weight="semibold" className="flex-1">
                                {t("reader.ai.title")}
                            </Typography>
                            <Button isIconOnly variant="ghost" aria-label={t("reader.ai.close")} onPress={close}>
                                <XIcon aria-hidden focusable="false" className="size-5" />
                            </Button>
                        </div>

                        {/* thread */}
                        <div ref={threadRef} className="min-h-0 flex-1 overflow-y-auto p-4">
                            {messages.length === 0 ? (
                                <div className="flex flex-col gap-3">
                                    <Typography type="body-sm" color="muted">
                                        {t("reader.ai.intro")}
                                    </Typography>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={cn(
                                                "max-w-[85%] rounded-2xl px-3 py-2",
                                                message.role === "user"
                                                    ? "self-end bg-accent/15 text-foreground"
                                                    : "self-start bg-default/60 text-foreground",
                                            )}
                                        >
                                            <Typography type="body-sm">{message.text}</Typography>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* selection banner + quick asks */}
                        <div className="flex flex-col gap-2 border-t border-separator p-4">
                            {selection ? (
                                <div className="flex items-start gap-2 rounded-2xl bg-default/60 px-3 py-2">
                                    <QuotesIcon aria-hidden focusable="false" className="mt-0.5 size-4 shrink-0 text-muted" />
                                    <Typography type="body-xs" color="muted" className="line-clamp-2 min-w-0 flex-1">
                                        {selection}
                                    </Typography>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="ghost"
                                        aria-label={t("reader.ai.clearSelection")}
                                        onPress={() => setSelection(null)}
                                    >
                                        <XIcon aria-hidden focusable="false" className="size-4" />
                                    </Button>
                                </div>
                            ) : null}

                            <div className="flex flex-wrap gap-2">
                                {quickAsks.map((key) => (
                                    <Button
                                        key={key}
                                        size="sm"
                                        variant="secondary"
                                        onPress={() => ask(t(`reader.ai.quickAsks.${key}`))}
                                    >
                                        {t(`reader.ai.quickAsks.${key}`)}
                                    </Button>
                                ))}
                            </div>

                            {/* composer */}
                            <div className="flex items-end gap-2">
                                <TextField variant="primary" className="flex-1">
                                    <Input
                                        value={draft}
                                        onChange={(event) => setDraft(event.target.value)}
                                        placeholder={t("reader.ai.placeholder")}
                                        aria-label={t("reader.ai.placeholder")}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" && !event.shiftKey) {
                                                event.preventDefault()
                                                ask(draft)
                                            }
                                        }}
                                    />
                                </TextField>
                                <Button
                                    isIconOnly
                                    variant="primary"
                                    aria-label={t("reader.ai.send")}
                                    isDisabled={draft.trim() === ""}
                                    onPress={() => ask(draft)}
                                >
                                    <PaperPlaneTiltIcon aria-hidden focusable="false" className="size-5" />
                                </Button>
                            </div>
                        </div>
                    </aside>
                </>
            ) : null}
        </>
    )
}

/** Cap a passage for the "about this passage" quote label. */
const truncate = (text: string) => (text.length > 80 ? `${text.slice(0, 80)}…` : text)

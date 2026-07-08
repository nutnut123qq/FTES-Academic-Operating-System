"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ChatCircleIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { markConversationRead } from "@/modules/api/rest/chat"
import {
    useQueryConversationMessagesSwr,
    useQueryConversationsSwr,
    useSendChatMessage,
} from "../hooks/useQueryConversationsSwr"

/** Loading skeleton for the conversation list — mirrors the row anatomy. */
const ConversationListSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex items-center gap-3 rounded-2xl p-3">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-3 w-24 rounded-full" />
                    <Skeleton className="h-3 w-full rounded-full" />
                </div>
            </div>
        ))}
    </div>
)

/** Loading skeleton for the message thread — mirrors alternating bubble rows. */
const MessageThreadSkeleton = () => (
    <div className="flex flex-1 flex-col gap-3 p-4">
        {[
            { mine: false, w: "w-3/5" },
            { mine: true, w: "w-2/5" },
            { mine: false, w: "w-1/2" },
            { mine: true, w: "w-3/5" },
        ].map((bubble, index) => (
            <div key={index} className={`flex flex-col gap-1 ${bubble.mine ? "items-end" : "items-start"}`}>
                <Skeleton className={`h-9 rounded-large ${bubble.w}`} />
                <Skeleton className="h-3 w-10 rounded-full" />
            </div>
        ))}
    </div>
)

/**
 * Chat shell (§8) — the `/chat` messaging surface. Two panes in one scroll
 * context: left = conversation list (clickable rows, selected highlighted), right
 * = message thread (mine right / others left) + a composer row. Feature owns data
 * (mock) + selection; tokens own the look. Each data-backed pane runs the house
 * async switch (skeleton mirroring layout → empty → error with retry).
 * ponytail: plain composer input + no real send (mock), hand-rolled bubbles.
 */
export const ChatShell = () => {
    const t = useTranslations("chat")
    const { conversations, isLoading, error, mutate } = useQueryConversationsSwr()
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const {
        messages,
        isLoading: messagesLoading,
        error: messagesError,
        mutate: mutateMessages,
    } = useQueryConversationMessagesSwr(selectedId)
    const { send, isSending } = useSendChatMessage(selectedId)
    const [draft, setDraft] = useState("")

    const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null

    // Mark the open conversation read once its thread has loaded and it still has unread —
    // clears the badge (and undoes the self-send bump). Deps are primitives so this can't loop;
    // after `mutate()` refetches, `selectedUnread` drops to 0 and the effect early-returns.
    const lastMessageId = messages.length > 0 ? messages[messages.length - 1]?.id ?? null : null
    const selectedUnread = selected?.unread ?? 0
    const markedReadRef = useRef<string | null>(null)
    useEffect(() => {
        if (!selectedId || !lastMessageId || selectedUnread === 0) return
        const key = `${selectedId}:${lastMessageId}`
        if (markedReadRef.current === key) return
        markedReadRef.current = key
        void markConversationRead(selectedId, { lastReadMessageId: lastMessageId })
            .then(() => mutate())
            .catch(() => {
                markedReadRef.current = null
            })
    }, [selectedId, lastMessageId, selectedUnread, mutate])

    // Real send → clear composer, then refetch the thread + list (last-message/unread).
    const handleSend = async () => {
        const ok = await send(draft)
        if (!ok) return
        setDraft("")
        await Promise.all([mutateMessages(), mutate()])
    }

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-0">
                <Typography type="h4" weight="bold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,20rem)_1fr]">
                {/* conversation list */}
                <div className="flex flex-col gap-3 rounded-3xl border border-separator p-3">
                    <AsyncContent
                        isLoading={isLoading && conversations.length === 0}
                        skeleton={<ConversationListSkeleton />}
                        isEmpty={conversations.length === 0}
                        emptyContent={{
                            title: t("conversationsEmpty"),
                            icon: <ChatCircleIcon aria-hidden focusable="false" className="size-8 text-muted" />,
                        }}
                        error={conversations.length === 0 ? error : undefined}
                        errorContent={{
                            title: t("conversationsError"),
                            onRetry: () => void mutate(),
                            retryLabel: t("retry"),
                        }}
                    >
                        {conversations.map((conversation) => {
                            const isSelected = conversation.id === selectedId
                            return (
                                <button
                                    key={conversation.id}
                                    type="button"
                                    onClick={() => setSelectedId(conversation.id)}
                                    className={`flex items-center gap-3 rounded-2xl p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                                        isSelected ? "bg-accent/10" : "hover:bg-default/40"
                                    }`}
                                >
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                                        {conversation.avatarInitials}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <Typography type="body-sm" weight="medium" truncate>
                                            {conversation.name}
                                        </Typography>
                                        <Typography type="body-xs" color="muted" className="truncate">
                                            {conversation.lastMessage}
                                        </Typography>
                                    </div>
                                    {conversation.unread > 0 ? (
                                        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                                            {conversation.unread}
                                        </div>
                                    ) : null}
                                </button>
                            )
                        })}
                    </AsyncContent>
                </div>

                {/* message thread + composer */}
                <div className="flex min-h-[24rem] flex-col rounded-3xl border border-separator">
                    {selected === null ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                            <ChatCircleIcon aria-hidden focusable="false" className="size-8 text-muted" />
                            <Typography type="body-sm" color="muted">
                                {t("empty")}
                            </Typography>
                        </div>
                    ) : (
                        <>
                            <div className="border-b border-separator p-4">
                                <Typography type="body-sm" weight="medium" truncate>
                                    {selected.name}
                                </Typography>
                            </div>
                            <AsyncContent
                                isLoading={messagesLoading && messages.length === 0}
                                skeleton={<MessageThreadSkeleton />}
                                isEmpty={messages.length === 0}
                                emptyContent={{
                                    title: t("messagesEmpty"),
                                    icon: <ChatCircleIcon aria-hidden focusable="false" className="size-8 text-muted" />,
                                }}
                                error={messages.length === 0 ? messagesError : undefined}
                                errorContent={{
                                    title: t("messagesError"),
                                    onRetry: () => void mutateMessages(),
                                    retryLabel: t("retry"),
                                }}
                            >
                                <div className="flex flex-1 flex-col gap-3 p-4">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex flex-col gap-1 ${
                                                message.fromMe ? "items-end" : "items-start"
                                            }`}
                                        >
                                            <div
                                                className={`max-w-[75%] rounded-large px-3 py-2 ${
                                                    message.fromMe ? "bg-accent/10" : "bg-default/40"
                                                }`}
                                            >
                                                <Typography type="body-sm">{message.text}</Typography>
                                            </div>
                                            <Typography type="body-xs" color="muted">
                                                {message.time}
                                            </Typography>
                                        </div>
                                    ))}
                                </div>
                            </AsyncContent>
                            {/* composer — real send via chat REST */}
                            <form
                                className="flex items-center gap-2 border-t border-separator p-3"
                                onSubmit={(event) => {
                                    event.preventDefault()
                                    void handleSend()
                                }}
                            >
                                <input
                                    value={draft}
                                    onChange={(event) => setDraft(event.target.value)}
                                    placeholder={t("composerPlaceholder")}
                                    className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
                                />
                                <Button
                                    type="submit"
                                    isIconOnly
                                    aria-label={t("send")}
                                    variant="primary"
                                    isDisabled={isSending || draft.trim().length === 0}
                                >
                                    <PaperPlaneTiltIcon className="size-5" />
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

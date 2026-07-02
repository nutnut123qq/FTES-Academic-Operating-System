"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ChatCircleIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react"
import {
    useQueryConversationMessagesSwr,
    useQueryConversationsSwr,
} from "../hooks/useQueryConversationsSwr"

/**
 * Chat shell (§8) — the `/chat` messaging surface. Two panes in one scroll
 * context: left = conversation list (clickable rows, selected highlighted), right
 * = message thread (mine right / others left) + a composer row. Feature owns data
 * (mock) + selection; tokens own the look. ponytail: plain composer input + no
 * real send (mock), hand-rolled bubbles.
 */
export const ChatShell = () => {
    const t = useTranslations("chat")
    const { conversations } = useQueryConversationsSwr()
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const { messages } = useQueryConversationMessagesSwr(selectedId)

    const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,20rem)_1fr]">
                {/* conversation list */}
                <div className="flex flex-col gap-2 rounded-large border border-separator p-2">
                    {conversations.map((conversation) => {
                        const isSelected = conversation.id === selectedId
                        return (
                            <button
                                key={conversation.id}
                                type="button"
                                onClick={() => setSelectedId(conversation.id)}
                                className={`flex items-center gap-3 rounded-large p-3 text-left transition-colors ${
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
                                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                                        {conversation.unread}
                                    </div>
                                ) : null}
                            </button>
                        )
                    })}
                </div>

                {/* message thread + composer */}
                <div className="flex min-h-[24rem] flex-col rounded-large border border-separator">
                    {selected === null ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
                            <ChatCircleIcon className="size-8 text-muted" />
                            <Typography type="body-sm" color="muted">
                                {t("empty")}
                            </Typography>
                        </div>
                    ) : (
                        <>
                            <div className="border-b border-separator p-4">
                                <Typography type="body-sm" weight="medium">
                                    {selected.name}
                                </Typography>
                            </div>
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
                            {/* composer — mock, no real send */}
                            <div className="flex items-center gap-2 border-t border-separator p-3">
                                <input
                                    placeholder={t("composerPlaceholder")}
                                    className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
                                />
                                <Button isIconOnly aria-label={t("send")} variant="primary">
                                    <PaperPlaneTiltIcon className="size-5" />
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

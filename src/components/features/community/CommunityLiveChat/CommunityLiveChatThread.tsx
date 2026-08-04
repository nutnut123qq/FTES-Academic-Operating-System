"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Button, ScrollShadow, Skeleton, Typography, cn, toast } from "@heroui/react"
import { PaperPlaneTiltIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { ChatBubble } from "@/components/blocks/feed/ChatBubble"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useAppSelector } from "@/redux/hooks"
import { useLiveChatStore } from "@/hooks/zustand/livechat/store"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"
import { useQueryLiveChatRecentSwr } from "@/components/features/community/hooks/useQueryLiveChatRecentSwr"
import { useMutateSendLiveChatSwr } from "@/components/features/community/hooks/useMutateSendLiveChatSwr"
import type { LiveChatMessage } from "@/modules/api/rest/livechat"

/** Props for {@link CommunityLiveChatThread}. */
export interface CommunityLiveChatThreadProps {
    /** Whether the chat surface is open (drives the gated recent seed + SSE ownership). */
    enabled: boolean
    className?: string
}

/** Loading skeleton mirroring the thread layout (a few alternating bubbles + composer). */
const ThreadSkeleton = () => (
    <div className="flex h-full flex-col gap-3">
        <div className="flex min-h-0 flex-1 flex-col gap-3">
            {[0, 1, 2, 3].map((row) => (
                <div key={row} className={cn("flex", row % 2 === 0 ? "justify-start" : "justify-end")}>
                    <div className="flex max-w-[85%] flex-col gap-1.5 rounded-2xl bg-surface-secondary px-3 py-2">
                        <Skeleton className="h-3 w-24 rounded-full" />
                        <Skeleton className="h-3 w-40 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
        <Skeleton className="h-16 w-full rounded-2xl" />
    </div>
)

/** One message row: author + markdown body + a relative-time "hoạt động" caption. */
const MessageRow = ({
    message,
    fromMe,
    locale,
    youLabel,
}: {
    message: LiveChatMessage
    fromMe: boolean
    locale: string
    youLabel: string
}) => (
    <ChatBubble role={fromMe ? "user" : "assistant"}>
        <div className="flex flex-col gap-1">
            <Typography
                type="body-xs"
                weight="semibold"
                className={fromMe ? "text-muted" : "text-accent"}
            >
                {fromMe ? youLabel : message.displayName}
            </Typography>
            <MarkdownContent markdown={message.text} />
            <Typography type="body-xs" color="muted">
                {formatRelativeTime(new Date(message.ts).toISOString(), locale)}
            </Typography>
        </div>
    </ChatBubble>
)

/**
 * The live-chat thread + composer. Renders from the {@link useLiveChatStore} live
 * list (seeded by `GET /recent`, grown by the SSE stream); the composer sends with
 * an optimistic append. `fromMe` is decided by `state.user.user?.id`. Wrapped in
 * {@link AsyncContent} with a layout-mirroring skeleton for the first paint. Height
 * is owned by the container (RailPanel / popover); the thread fills it and scrolls
 * inside its own region.
 *
 * @param props - {@link CommunityLiveChatThreadProps}
 */
export const CommunityLiveChatThread = ({ enabled, className }: CommunityLiveChatThreadProps) => {
    const t = useTranslations("communityLiveChat")
    const locale = useLocale()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useAppSelector((state) => state.user.user?.id)
    const active = enabled && authenticated

    const { isLoading, error } = useQueryLiveChatRecentSwr(active)
    const messages = useLiveChatStore((state) => state.messages)
    const { send } = useMutateSendLiveChatSwr()

    const [input, setInput] = useState("")
    const [sending, setSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // follow the thread to the bottom as messages append
    useEffect(() => {
        const element = scrollRef.current
        if (element) {
            element.scrollTop = element.scrollHeight
        }
    }, [messages])

    const onSend = useCallback(async () => {
        const text = input.trim()
        if (!text || sending) {
            return
        }
        setSending(true)
        setInput("")
        const ok = await send(text)
        setSending(false)
        if (!ok) {
            setInput(text)
            toast.danger(t("sendFailed"))
        }
    }, [input, sending, send, t])

    // Signed-out viewers can't join (every endpoint is authenticated) — invite them in.
    if (enabled && !authenticated) {
        return (
            <div className={cn("flex items-center justify-center py-6", className)}>
                <Typography type="body-sm" color="muted" className="text-center">
                    {t("signInRequired")}
                </Typography>
            </div>
        )
    }

    return (
        <div className={cn("flex h-full flex-col gap-3", className)}>
            <AsyncContent
                isLoading={active && isLoading && messages.length === 0}
                skeleton={<ThreadSkeleton />}
                error={messages.length === 0 ? error : undefined}
                errorContent={{ title: t("loadError") }}
                isEmpty={messages.length === 0}
                emptyContent={{ title: t("empty") }}
            >
                {/* thread — self-bounded scroll region (never scrolls the page/popover) */}
                <ScrollShadow
                    ref={scrollRef}
                    hideScrollBar
                    className="max-h-[52vh] min-h-0 flex-1 overflow-y-auto"
                >
                    <div className="flex flex-col gap-3">
                        {messages.map((message) => (
                            <MessageRow
                                key={message.id}
                                message={message}
                                fromMe={!!viewerId && message.userId === viewerId}
                                locale={locale}
                                youLabel={t("you")}
                            />
                        ))}
                    </div>
                </ScrollShadow>
            </AsyncContent>

            {/* composer — a single bounded box: flat textarea + send button (composer-in-box) */}
            <div className="flex flex-col gap-2 rounded-2xl bg-default px-3 py-2 focus-within:ring-2 focus-within:ring-accent">
                <textarea
                    rows={1}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={t("placeholder")}
                    aria-label={t("placeholder")}
                    disabled={!authenticated}
                    className="max-h-24 min-h-6 w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault()
                            void onSend()
                        }
                    }}
                />
                <div className="flex items-center gap-2">
                    <div className="flex-1" />
                    <Button
                        isIconOnly
                        size="sm"
                        variant="primary"
                        isPending={sending}
                        aria-label={t("send")}
                        isDisabled={input.trim() === "" || !authenticated}
                        onPress={() => void onSend()}
                    >
                        <PaperPlaneTiltIcon aria-hidden focusable="false" className="size-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

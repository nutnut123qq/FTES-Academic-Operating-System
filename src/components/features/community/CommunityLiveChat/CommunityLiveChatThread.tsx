"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Button, ScrollShadow, Skeleton, Typography, cn, toast } from "@heroui/react"
import { ArrowBendUpLeftIcon, PaperPlaneTiltIcon, XIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { ChatBubble } from "@/components/blocks/feed/ChatBubble"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useAppSelector } from "@/redux/hooks"
import { useLiveChatStore } from "@/hooks/zustand/livechat/store"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"
import { useQueryLiveChatRecentSwr } from "@/components/features/community/hooks/useQueryLiveChatRecentSwr"
import { useQueryLiveChatOnlineSwr } from "@/components/features/community/hooks/useQueryLiveChatOnlineSwr"
import { useMutateSendLiveChatSwr } from "@/components/features/community/hooks/useMutateSendLiveChatSwr"
import { capReplySnippet } from "@/modules/api/rest/livechat"
import type { LiveChatMessage, LiveChatReplyTo } from "@/modules/api/rest/livechat"

/** Props for {@link CommunityLiveChatThread}. */
export interface CommunityLiveChatThreadProps {
    /** Whether the chat surface is open (drives the gated recent seed + SSE ownership). */
    enabled: boolean
    className?: string
}

/** Loading skeleton mirroring the thread region only (the composer is always present). */
const ThreadSkeleton = () => (
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
)

/**
 * A single-line online indicator ABOVE the thread (no card/box): a success dot + the
 * live count ("{n} online") or a generic "Online now" when the count is unknown/zero.
 * The count IS the SSE-patched `online` SWR cache ({@link useQueryLiveChatOnlineSwr}).
 */
const OnlineLine = ({ active }: { active: boolean }) => {
    const t = useTranslations("communityLiveChat")
    const { online, isLoading } = useQueryLiveChatOnlineSwr(active)
    const count = online?.roomOnline ?? 0

    return (
        <div className="flex items-center gap-1.5 px-0.5">
            <span aria-hidden className="size-2 shrink-0 rounded-full bg-success" />
            {active && isLoading && !online ? (
                <Skeleton className="h-3 w-20 rounded-full" />
            ) : (
                <Typography type="body-xs" color="muted" className="whitespace-nowrap">
                    {count > 0 ? t("onlineCount", { count }) : t("onlineNow")}
                </Typography>
            )}
        </div>
    )
}

/** A compact quoted preview of the replied-to message, rendered ABOVE the bubble text. */
const ReplyPreview = ({ replyTo }: { replyTo: LiveChatReplyTo }) => (
    <div className="mb-1 rounded-md border-l-2 border-accent/40 bg-default px-2 py-1">
        <Typography type="body-xs" weight="semibold" className="line-clamp-1 text-accent">
            {replyTo.displayName}
        </Typography>
        <Typography type="body-xs" color="muted" className="line-clamp-1">
            {replyTo.snippet}
        </Typography>
    </div>
)

/**
 * One message row: author + optional reply preview + markdown body. The relative time
 * is NOT rendered inline (it made short rows jump height) — it lives on the bubble's
 * `title` (native hover tooltip). A hover-revealed "reply" icon on the free side of the
 * row hands the message up to `onReply`.
 */
const MessageRow = ({
    message,
    fromMe,
    locale,
    youLabel,
    replyLabel,
    onReply,
}: {
    message: LiveChatMessage
    fromMe: boolean
    locale: string
    youLabel: string
    replyLabel: string
    onReply: (message: LiveChatMessage) => void
}) => (
    <div className="group relative">
        <ChatBubble role={fromMe ? "user" : "assistant"}>
            <div
                className="flex flex-col gap-1"
                title={formatRelativeTime(new Date(message.ts).toISOString(), locale)}
            >
                <Typography
                    type="body-xs"
                    weight="semibold"
                    className={fromMe ? "text-muted" : "text-accent"}
                >
                    {fromMe ? youLabel : message.displayName}
                </Typography>
                {message.replyTo ? <ReplyPreview replyTo={message.replyTo} /> : null}
                <MarkdownContent markdown={message.text} />
            </div>
        </ChatBubble>
        <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={replyLabel}
            onPress={() => onReply(message)}
            className={cn(
                "absolute top-1/2 size-7 min-w-0 -translate-y-1/2 opacity-0 transition-opacity",
                "group-hover:opacity-100 group-focus-within:opacity-100",
                // Touch surfaces (drawer/popover fab) can't hover — keep the reply icon
                // reachable there by revealing it at reduced opacity always-on.
                "[@media(hover:none)]:opacity-70",
                fromMe ? "left-1" : "right-1",
            )}
        >
            <ArrowBendUpLeftIcon aria-hidden focusable="false" className="size-4" />
        </Button>
    </div>
)

/**
 * The live-chat thread + composer. Renders from the {@link useLiveChatStore} live
 * list (seeded by `GET /recent`, grown by the SSE stream); the composer sends with
 * an optimistic append. `fromMe` is decided by `state.user.user?.id`. Wrapped in
 * {@link AsyncContent} with a layout-mirroring skeleton for the first paint.
 *
 * Layout is FIXED-HEIGHT (owned by the caller's `className`, e.g. `h-[420px]` on the
 * rail, `flex-1` inside the mobile drawer): a one-line online indicator on top, the
 * thread scrolls INTERNALLY in the middle (ScrollShadow), and the composer (plus an
 * optional "replying to …" banner) is pinned at the bottom — so short messages never
 * make the box jump.
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
    const [replyTarget, setReplyTarget] = useState<LiveChatReplyTo | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    // follow the thread to the bottom as messages append
    useEffect(() => {
        const element = scrollRef.current
        if (element) {
            element.scrollTop = element.scrollHeight
        }
    }, [messages])

    const onReply = useCallback((message: LiveChatMessage) => {
        setReplyTarget({
            messageId: message.id,
            displayName: message.displayName,
            snippet: capReplySnippet(message.text),
        })
        inputRef.current?.focus()
    }, [])

    const onSend = useCallback(async () => {
        const text = input.trim()
        if (!text || sending) {
            return
        }
        const replyTo = replyTarget
        setSending(true)
        setInput("")
        setReplyTarget(null)
        const ok = await send(text, replyTo)
        setSending(false)
        if (!ok) {
            setInput(text)
            setReplyTarget(replyTo)
            toast.danger(t("sendFailed"))
        }
    }, [input, sending, replyTarget, send, t])

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
        <div className={cn("flex flex-col gap-2", className)}>
            {/* online = a single text line above the thread (no box/card) */}
            <OnlineLine active={active} />

            {/* thread region — fills the fixed height, scrolls internally */}
            <div className="flex min-h-0 flex-1 flex-col">
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
                        className="min-h-0 flex-1 overflow-y-auto"
                    >
                        <div className="flex flex-col gap-3">
                            {messages.map((message) => (
                                <MessageRow
                                    key={message.id}
                                    message={message}
                                    fromMe={!!viewerId && message.userId === viewerId}
                                    locale={locale}
                                    youLabel={t("you")}
                                    replyLabel={t("reply")}
                                    onReply={onReply}
                                />
                            ))}
                        </div>
                    </ScrollShadow>
                </AsyncContent>
            </div>

            {/* "replying to …" banner — sits directly above the composer, cancellable */}
            {replyTarget ? (
                <div className="flex items-center gap-2 rounded-xl bg-default px-3 py-1.5">
                    <div className="min-w-0 flex-1">
                        <Typography type="body-xs" color="muted" className="line-clamp-1">
                            {t("replyingTo", { name: replyTarget.displayName })}
                            {": "}
                            <span className="text-foreground">{replyTarget.snippet}</span>
                        </Typography>
                    </div>
                    <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        aria-label={t("cancelReply")}
                        onPress={() => setReplyTarget(null)}
                        className="size-6 min-w-0 shrink-0"
                    >
                        <XIcon aria-hidden focusable="false" className="size-3.5" />
                    </Button>
                </div>
            ) : null}

            {/* composer — a single bounded box: flat textarea + send button (composer-in-box) */}
            <div className="flex flex-col gap-2 rounded-2xl bg-default px-3 py-2 focus-within:ring-2 focus-within:ring-accent">
                <textarea
                    ref={inputRef}
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

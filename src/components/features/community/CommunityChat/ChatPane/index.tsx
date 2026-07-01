"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
    Button,
    TextArea,
    TextField,
    Typography,
} from "@heroui/react"
import { SealCheckIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ChatBubble } from "@/components/blocks/feed/ChatBubble"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { PublicationEvent } from "@/hooks/socketio/enums/publication-event"
import { SubscriptionEvent } from "@/hooks/socketio/enums/subscription-event"
import { communityChatSocketIoEventEmitter } from "@/hooks/socketio/useCommunityChatSocketIoLifecycle"
import { useCommunityChatSocketIo } from "@/hooks/socketio/useCommunityChatSocketIo"
import { useMutateSendChatMessageSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSendChatMessageSwr"
import { useQueryChatMessagesSwr } from "@/hooks/swr/api/graphql/queries/useQueryChatMessagesSwr"
import { useGraphQLWithToast } from "@/modules/toast/hooks"

/** Props for the {@link ChatPane} feature. */
export interface ChatPaneProps {
    /** Conversation whose messages are shown + sent to. */
    conversationId: string
}

/**
 * One chat conversation pane: a scrollable message list (oldest→newest) + a
 * composer. Joins the conversation's Socket.IO room and refetches on every new
 * message, so messages from others appear in real time.
 *
 * @param props - {@link ChatPaneProps}
 */
export const ChatPane = ({ conversationId }: ChatPaneProps) => {
    const t = useTranslations()
    const [body, setBody] = useState("")
    const runGraphQL = useGraphQLWithToast()
    const socket = useCommunityChatSocketIo()

    const { data, isLoading, error, mutate } = useQueryChatMessagesSwr(conversationId)
    const { trigger: sendMessage, isMutating } = useMutateSendChatMessageSwr()

    // server returns newest-first; render oldest→newest so the latest sits at the bottom
    const messages = useMemo(
        () => [...(data?.items ?? [])].reverse(),
        [data],
    )

    // join the conversation room (and re-join on reconnect)
    useEffect(() => {
        const subscribe = () => {
            socket.emit(PublicationEvent.SubscribeCommunityChat, {
                data: {
                    conversationId,
                },
            })
        }
        if (socket.connected) {
            subscribe()
        }
        socket.on("connect", subscribe)
        return () => {
            socket.off("connect", subscribe)
        }
    }, [socket, conversationId])

    // refetch whenever a realtime message arrives for THIS conversation
    useEffect(() => {
        const handler = (message: { data?: { conversationId?: string } }) => {
            // ignore events for other conversations sharing the same socket
            if (message?.data?.conversationId !== conversationId) {
                return
            }
            void mutate()
        }
        communityChatSocketIoEventEmitter.on(SubscriptionEvent.ChatMessageCreated, handler)
        return () => {
            communityChatSocketIoEventEmitter.off(SubscriptionEvent.ChatMessageCreated, handler)
        }
    }, [conversationId, mutate])

    /** Send the composed message, then clear + refresh. */
    const onSend = useCallback(async () => {
        const trimmed = body.trim()
        if (!trimmed) {
            return
        }
        // toast-wrapped send; action returns the inner GraphQLResponse
        const ok = await runGraphQL(async () => {
            const result = await sendMessage({
                conversationId,
                body: trimmed,
            })
            return result.data!.sendChatMessage
        })
        if (ok) {
            setBody("")
            await mutate()
        }
    }, [body, conversationId, sendMessage, runGraphQL, mutate])

    return (
        <div className="flex flex-col gap-3">
            <AsyncContent
                isLoading={isLoading && messages.length === 0}
                skeleton={(
                    <Typography type="body-xs" color="muted">
                        {t("community.chat.loading")}
                    </Typography>
                )}
                isEmpty={messages.length === 0}
                emptyContent={{ title: t("community.chat.empty") }}
                error={messages.length === 0 ? error : undefined}
                errorContent={{
                    title: t("community.chat.error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("community.retry"),
                }}
            >
                <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
                    {messages.map((message) => (
                        <div key={message.id} className="flex flex-col gap-1">
                            {!message.isMine ? (
                                <div className="flex items-center gap-1">
                                    <UserAvatar
                                        username={message.author.username}
                                        avatar={message.author.avatar}
                                    />
                                    <Typography type="body-xs" color="muted" truncate>
                                        {message.author.displayName || message.author.username}
                                    </Typography>
                                    {message.isFounderAuthor ? (
                                        <SealCheckIcon
                                            weight="fill"
                                            className="size-3.5 shrink-0 text-accent"
                                        />
                                    ) : null}
                                </div>
                            ) : null}
                            <ChatBubble role={message.isMine ? "user" : "assistant"}>
                                <Typography type="body-sm">{message.body}</Typography>
                            </ChatBubble>
                        </div>
                    ))}
                </div>
            </AsyncContent>

            <div className="flex flex-col gap-2">
                <TextField variant="secondary">
                    <TextArea
                        rows={2}
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        placeholder={t("community.chat.placeholder")}
                        aria-label={t("community.chat.placeholder")}
                        className="resize-none"
                    />
                </TextField>
                <div className="flex justify-end">
                    <Button
                        variant="primary"
                        size="sm"
                        isPending={isMutating}
                        isDisabled={!body.trim()}
                        onPress={() => void onSend()}
                    >
                        {t("community.chat.send")}
                    </Button>
                </div>
            </div>
        </div>
    )
}

"use client"

import React, { useMemo } from "react"
import { Skeleton, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { AvatarGroup } from "@/components/blocks/identity/AvatarGroup"
import type { AvatarGroupUser } from "@/components/blocks/identity/AvatarGroup"
import { useAppSelector } from "@/redux/hooks"
import { useLiveChatStore } from "@/hooks/zustand/livechat/store"
import { useQueryLiveChatOnlineSwr } from "@/components/features/community/hooks/useQueryLiveChatOnlineSwr"

/** How many representative faces the avatar group shows before the "+N" overflow chip. */
const MAX_FACES = 5

/** Props for {@link OnlinePresence}. */
export interface OnlinePresenceProps {
    /** Whether the chat surface is open (gates the online query). */
    enabled: boolean
    className?: string
}

/**
 * Community live-chat online indicator: a success dot + "{n} online" + an
 * {@link AvatarGroup} of representative faces. Rendered ABOVE / OUTSIDE the chat box
 * (a plain text line, no card/panel).
 *
 * The COUNT is authoritative (the SSE-patched `online` SWR cache). The faces are
 * DERIVED — the viewer's OWN face first (they are online by definition), then the
 * most-recent distinct chatters in the live thread; the contract carries no online-user
 * roster, so the viewer + recent authors stand in as "who's here" and the "+N" chip
 * reconciles to the real count. So even "1 online" (just the viewer) shows a face.
 */
export const OnlinePresence = ({ enabled, className }: OnlinePresenceProps) => {
    const t = useTranslations("communityLiveChat")
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewer = useAppSelector((state) => state.user.user)
    const active = enabled && authenticated
    const { online, isLoading } = useQueryLiveChatOnlineSwr(active)
    const messages = useLiveChatStore((state) => state.messages)

    // The viewer (online by definition) leads; recent distinct authors fill the rest.
    const faces = useMemo<Array<AvatarGroupUser>>(() => {
        const result: Array<AvatarGroupUser> = []
        const seen = new Set<string>()
        if (viewer) {
            seen.add(viewer.id)
            result.push({
                username: viewer.username,
                displayName: viewer.displayName ?? viewer.username,
                avatar: viewer.avatar,
            })
        }
        for (let index = messages.length - 1; index >= 0 && result.length < MAX_FACES; index -= 1) {
            const message = messages[index]
            if (seen.has(message.userId)) {
                continue
            }
            seen.add(message.userId)
            result.push({
                username: message.userId,
                displayName: message.displayName,
                avatar: message.avatar,
            })
        }
        return result
    }, [messages, viewer])

    const count = online?.roomOnline ?? 0
    const total = Math.max(count, faces.length)

    return (
        <div className={cn("flex items-center gap-2 px-0.5", className)}>
            <span aria-hidden className="size-2 shrink-0 rounded-full bg-success" />
            {active && isLoading && !online ? (
                <Skeleton className="h-3 w-20 rounded-full" />
            ) : (
                <Typography type="body-xs" color="muted" className="whitespace-nowrap">
                    {count > 0 ? t("onlineCount", { count }) : t("onlineNow")}
                </Typography>
            )}
            {faces.length > 0 ? <AvatarGroup users={faces} max={MAX_FACES} total={total} /> : null}
        </div>
    )
}

"use client"

import React, { useMemo } from "react"
import { Skeleton, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { AvatarGroup } from "@/components/blocks/identity/AvatarGroup"
import type { AvatarGroupUser } from "@/components/blocks/identity/AvatarGroup"
import { useAppSelector } from "@/redux/hooks"
import { useLiveChatStore } from "@/hooks/zustand/livechat/store"
import { useQueryLiveChatOnlineSwr } from "@/components/features/community/hooks/useQueryLiveChatOnlineSwr"

/** How many representative faces the avatar group shows before the "+N" chip. */
const MAX_FACES = 5

/** Props for {@link OnlinePresence}. */
export interface OnlinePresenceProps {
    /** Whether the chat surface is open (drives the gated online query). */
    enabled: boolean
    className?: string
}

/**
 * Community live-chat online indicator: "N đang online" + an {@link AvatarGroup} of a
 * few representative faces. The COUNT is authoritative (the SSE-patched `online` SWR
 * cache); the faces are DERIVED from the most-recent distinct chatters in the live
 * thread (the contract carries no online-user roster, so recent authors stand in as
 * "who's here" — the "+N" reconciles to the real count). Renders nothing meaningful
 * until authenticated.
 */
export const OnlinePresence = ({ enabled, className }: OnlinePresenceProps) => {
    const t = useTranslations("communityLiveChat")
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const active = enabled && authenticated
    const { online, isLoading } = useQueryLiveChatOnlineSwr(active)
    const messages = useLiveChatStore((state) => state.messages)

    // Most-recent distinct authors → representative faces for the group.
    const faces = useMemo<Array<AvatarGroupUser>>(() => {
        const seen = new Set<string>()
        const result: Array<AvatarGroupUser> = []
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
    }, [messages])

    const count = online?.roomOnline ?? 0
    const total = Math.max(count, faces.length)

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <span aria-hidden className="size-2 shrink-0 rounded-full bg-success" />
            {active && isLoading && !online ? (
                <Skeleton className="h-4 w-24 rounded-full" />
            ) : (
                <Typography type="body-sm" weight="medium" className="whitespace-nowrap">
                    {t("onlineCount", { count })}
                </Typography>
            )}
            {faces.length > 0 ? (
                <AvatarGroup users={faces} max={MAX_FACES} total={total} className="ml-auto" />
            ) : null}
        </div>
    )
}

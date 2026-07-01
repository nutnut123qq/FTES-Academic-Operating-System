"use client"

import React, {
    useCallback,
    useState,
} from "react"
import {
    Link,
    Typography,
} from "@heroui/react"
import {
    TrophyIcon,
} from "@phosphor-icons/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    FollowButton,
} from "@/components/reuseable/FollowButton"
import {
    UserAvatar,
} from "@/components/reuseable/UserAvatar"
import {
    pathConfig,
} from "@/resources/path"
import {
    fromGlobalId,
} from "@/modules/utils/globalId"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    TopLearnersSkeleton,
} from "./TopLearnersSkeleton"
import { useMutateSetFollowSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSetFollowSwr"
import { useQueryGlobalLeaderboardSwr } from "@/hooks/swr/api/graphql/queries/useQueryGlobalLeaderboardSwr"
import { useAppSelector } from "@/redux/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"

/** How many leaders to show. */
const TOP_N = 5

/** Props for {@link TopLearners}. */
export type TopLearnersProps = WithClassNames<undefined>

/**
 * Dashboard "Community" tab — the platform's top learners this period (avatar · name
 * · XP) with an inline follow on each stranger row. Self-fetches the global
 * leaderboard and self-hides when there are no entries.
 * @param props - optional root class name (placement only)
 */
export const TopLearners = ({
    className,
}: TopLearnersProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const { data, isLoading } = useQueryGlobalLeaderboardSwr()
    const me = useAppSelector((state) => state.user.user)
    // owns the follow mutation; FollowButton rows stay presentational
    const { trigger: triggerSetFollow } = useMutateSetFollowSwr()
    // globalIds the viewer follows from this card (optimistic) + in-flight set
    const [followed, setFollowed] = useState<Set<string>>(new Set())
    const [pending, setPending] = useState<Set<string>>(new Set())

    /**
     * Toggle follow/unfollow for a leader. The leaderboard exposes each user as an
     * OPAQUE global id (`toGlobalId`), but `setFollow` wants the raw `users.id` —
     * so decode it first (this is why follow previously did nothing). Flips the
     * row on success.
     */
    const onToggleFollow = useCallback(
        async (globalId: string) => {
            const rawId = fromGlobalId(globalId)?.id ?? globalId
            const currentlyFollowing = followed.has(globalId)
            setPending((current) => new Set(current).add(globalId))
            try {
                const result = await triggerSetFollow({
                    userId: rawId,
                    follow: !currentlyFollowing,
                })
                if (result?.data?.setFollow?.success) {
                    setFollowed((current) => {
                        const next = new Set(current)
                        if (currentlyFollowing) {
                            next.delete(globalId)
                        } else {
                            next.add(globalId)
                        }
                        return next
                    })
                }
            } finally {
                setPending((current) => {
                    const next = new Set(current)
                    next.delete(globalId)
                    return next
                })
            }
        },
        [followed, triggerSetFollow],
    )

    // empty (after load) when the board has no entries
    const isEmpty = !data || data.entries.length === 0

    return (
        <AsyncContent
            isLoading={data === null || data === undefined || isLoading}
            skeleton={<TopLearnersSkeleton className={className} />}
            isEmpty={isEmpty}
        >
            {!isEmpty && data ? (
                <LabeledCard
                    label={t("dashboard.community.topLearners.title")}
                    icon={<TrophyIcon className="size-5" aria-hidden focusable="false" />}
                    className={className}
                    contentClassName="flex flex-col"
                >
                    {data.entries.slice(0, TOP_N).map((entry) => {
                        const isMe = Boolean(me?.username) && entry.username === me?.username
                        return (
                            <div
                                key={entry.userGlobalId}
                                className="flex items-center gap-3 border-b border-default py-3 first:pt-0 last:border-b-0 last:pb-0"
                            >
                                <span className="w-6 shrink-0 text-right text-xs text-muted">
                                    {entry.rank}
                                </span>
                                {/* avatar + name: the only clickable target (→ profile),
                                    dimming the whole cluster on hover — plain text, not a
                                    coloured/underlined link (mirrors LeagueRow) */}
                                <Link
                                    href={pathConfig().locale(locale).profile(entry.username ?? undefined).build()}
                                    className="flex min-w-0 flex-1 items-center gap-2 text-foreground no-underline transition-opacity hover:opacity-60"
                                >
                                    <UserAvatar
                                        className="size-8 shrink-0"
                                        username={entry.username}
                                        avatar={entry.avatar ?? undefined}
                                        seed={entry.username}
                                    />
                                    <span className="truncate text-sm font-medium">
                                        {entry.username}
                                    </span>
                                </Link>
                                <Typography type="body-xs" color="muted" className="shrink-0">
                                    {t("dashboard.community.topLearners.xp", { points: entry.points })}
                                </Typography>
                                {!isMe ? (
                                    <FollowButton
                                        className="shrink-0"
                                        following={followed.has(entry.userGlobalId)}
                                        isPending={pending.has(entry.userGlobalId)}
                                        onToggle={() => void onToggleFollow(entry.userGlobalId)}
                                    />
                                ) : null}
                            </div>
                        )
                    })}
                </LabeledCard>
            ) : null}
        </AsyncContent>
    )
}

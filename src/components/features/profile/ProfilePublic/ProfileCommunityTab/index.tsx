"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CaretRightIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import {
    useQueryPublicCommunitySwr,
    type PublicCommunityUser,
} from "../../hooks/useQueryPublicCommunitySwr"

/** Skeleton mirroring the two relation lists + the post list. */
const CommunitySkeleton = () => (
    <div className="flex flex-col gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-3">
                <Skeleton.Typography type="h6" width="1/3" />
                <Skeleton.ListRow />
                <Skeleton.ListRow />
            </div>
        ))}
    </div>
)

/** One follower / following row. Links onward to that user's own public profile. */
const UserRow = ({ user }: { user: PublicCommunityUser }) => (
    <Link
        href={`/u/${user.username}`}
        className="group flex items-center gap-3 rounded-2xl border border-separator p-3 no-underline transition-colors hover:bg-default/40"
    >
        <Avatar className="size-10 rounded-full">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
            <AvatarFallback className="bg-accent/10 text-sm font-bold text-accent">
                {user.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0">
            <Typography type="body-sm" weight="medium" truncate>
                {user.name}
            </Typography>
            <Typography type="body-xs" color="muted" truncate>
                {user.headline}
            </Typography>
        </div>
        <CaretRightIcon
            className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-1"
            aria-hidden
            focusable="false"
        />
    </Link>
)

/**
 * Community tab — who follows this profile, who it follows, and its newest community
 * posts.
 *
 * The follower / following COUNTS in each card label are the authoritative server totals
 * from `counters`; the rows below them are only the FIRST page (the follow-list endpoints
 * are cursor-paginated), which is why a label may read a larger number than the rows show.
 * Each block degrades to its empty state independently — hidden follow lists
 * (`showFollowers=false`) and the auth-gated community search fail soft in the hook.
 */
export const ProfileCommunityTab = ({
    username,
    userId,
    followers,
    following,
}: {
    username: string
    userId: string
    /** Authoritative follower total from the profile's `counters`. */
    followers: number
    /** Authoritative following total from the profile's `counters`. */
    following: number
}) => {
    const t = useTranslations()
    const { data, isLoading, error, mutate } = useQueryPublicCommunitySwr(username, userId)

    return (
        <AsyncContent
            isLoading={isLoading && !data}
            skeleton={<CommunitySkeleton />}
            error={!data ? error : undefined}
            errorContent={{
                title: t("profile.loadingError"),
                retryLabel: t("profile.retry"),
                onRetry: () => void mutate(),
            }}
        >
            {data ? (
                <div className="flex flex-col gap-6">
                    <LabeledCard
                        label={t("profile.community.connections.followers")}
                        labelEnd={followers.toLocaleString()}
                        frameless={data.followers.length > 0}
                    >
                        {data.followers.length === 0 ? (
                            <EmptyContent
                                title={t("profile.community.connections.empty.followers")}
                            />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {data.followers.map((user) => (
                                    <UserRow key={user.id} user={user} />
                                ))}
                            </div>
                        )}
                    </LabeledCard>

                    <LabeledCard
                        label={t("profile.community.connections.following")}
                        labelEnd={following.toLocaleString()}
                        frameless={data.following.length > 0}
                    >
                        {data.following.length === 0 ? (
                            <EmptyContent
                                title={t("profile.community.connections.empty.following")}
                            />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {data.following.map((user) => (
                                    <UserRow key={user.id} user={user} />
                                ))}
                            </div>
                        )}
                    </LabeledCard>

                    <LabeledCard
                        label={t("publicProfile.community.postsTitle")}
                        frameless={data.recentPosts.length > 0}
                    >
                        {data.recentPosts.length === 0 ? (
                            <EmptyContent title={t("publicProfile.community.postsEmpty")} />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {data.recentPosts.map((post) => (
                                    <Link
                                        key={post.id}
                                        href={`/community/${post.id}`}
                                        className="group flex items-center gap-3 rounded-2xl border border-separator p-4 no-underline transition-colors hover:bg-default/40"
                                    >
                                        <Typography
                                            type="body-sm"
                                            weight="medium"
                                            className="min-w-0 flex-1"
                                            truncate
                                        >
                                            {post.title}
                                        </Typography>
                                        <Typography
                                            type="body-xs"
                                            color="muted"
                                            className="hidden shrink-0 sm:block"
                                        >
                                            {t("profile.community.recentPosts.engagement", {
                                                likes: post.likeCount,
                                                comments: post.commentCount,
                                            })}
                                        </Typography>
                                        <Typography
                                            type="body-xs"
                                            color="muted"
                                            className="shrink-0"
                                        >
                                            {post.dateLabel}
                                        </Typography>
                                        <CaretRightIcon
                                            className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-1"
                                            aria-hidden
                                            focusable="false"
                                        />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </LabeledCard>
                </div>
            ) : null}
        </AsyncContent>
    )
}

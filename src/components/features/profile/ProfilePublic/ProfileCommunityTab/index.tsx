"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CaretRightIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import {
    useQueryPublicCommunitySwr,
    type PublicCommunityUser,
} from "../../hooks/useQueryPublicCommunitySwr"

/** Skeleton mirroring the two relation lists. */
const CommunitySkeleton = () => (
    <div className="flex flex-col gap-6">
        {Array.from({ length: 2 }).map((_, index) => (
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
        {/* `UserAvatar` chứ không `<Avatar><AvatarImage>` trần: danh sách theo dõi cũng phải
            đi qua đúng một chuỗi fallback của app (art tròn → thumbnail WebP → DiceBear →
            initials có guard uuid). `name` ở đây degrade về `username` khi thiếu hồ sơ, nên
            `seed` lấy `username` để cùng một người luôn ra cùng một khuôn mặt. */}
        <UserAvatar
            className="size-10"
            username={user.name}
            avatar={user.avatarUrl}
            seed={user.username}
        />
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
 * Community tab — who follows this profile and who it follows. The person's own community
 * POSTS are not here: they moved to the Overview tab, where a reader looking for "what has
 * this person written" finds them without hunting through a connections list. Both tabs
 * call `useQueryPublicCommunitySwr` with the same key, so that is one shared fetch.
 *
 * The follower / following COUNTS in each card label are the authoritative server totals
 * from `counters`; the rows below them are only the FIRST page (the follow-list endpoints
 * are cursor-paginated), which is why a label may read a larger number than the rows show.
 * Each block degrades to its empty state independently — hidden follow lists
 * (`showFollowers=false`) fail soft in the hook.
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
                </div>
            ) : null}
        </AsyncContent>
    )
}

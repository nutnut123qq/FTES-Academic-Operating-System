"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    CaretRightIcon,
    UserPlusIcon,
    UsersThreeIcon,
} from "@phosphor-icons/react"
import { Link, useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { MetricCard } from "@/components/blocks/stats/MetricCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryMyCommunitySummarySwr } from "../hooks/useQueryMyCommunitySummarySwr"
import { CommunityUserRow, ProfileActivity, ProfileActivitySkeleton } from "./ProfileActivity"

type RelationTab = "followers" | "following"

/** Skeleton mirroring the followers/following + activity + posts layout. */
const CommunitySkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/3" />
            <div className="grid grid-cols-2 gap-3">
                <Skeleton.Metric />
                <Skeleton.Metric />
            </div>
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/3" />
            <ProfileActivitySkeleton />
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/3" />
            <Skeleton.ListRow />
            <Skeleton.ListRow />
            <Skeleton.ListRow />
        </div>
    </div>
)

/**
 * Community section of the profile (§2/§18). Shows followers/following,
 * an activity timeline, and recent community posts.
 */
export const ProfileCommunity = () => {
    const t = useTranslations()
    const router = useRouter()
    const { data, isLoading, error, mutate } = useQueryMyCommunitySummarySwr()
    const [relationTab, setRelationTab] = useState<RelationTab | null>(null)

    const relationList = relationTab ? (data?.[relationTab] ?? []) : []

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
                    {/* followers / following */}
                    <LabeledCard label={t("profile.community.connections.title")}>
                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                <MetricCard
                                    icon={
                                        <UsersThreeIcon
                                            className="size-5 text-accent"
                                            aria-hidden
                                            focusable="false"
                                        />
                                    }
                                    value={data.followers.length.toLocaleString()}
                                    label={t("profile.community.connections.followers")}
                                />
                                <MetricCard
                                    icon={
                                        <UserPlusIcon
                                            className="size-5 text-accent"
                                            aria-hidden
                                            focusable="false"
                                        />
                                    }
                                    value={data.following.length.toLocaleString()}
                                    label={t("profile.community.connections.following")}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant={relationTab === "followers" ? "primary" : "secondary"}
                                    onPress={() => setRelationTab("followers")}
                                >
                                    {t("profile.community.connections.viewFollowers")}
                                </Button>
                                <Button
                                    size="sm"
                                    variant={relationTab === "following" ? "primary" : "secondary"}
                                    onPress={() => setRelationTab("following")}
                                >
                                    {t("profile.community.connections.viewFollowing")}
                                </Button>
                                {relationTab ? (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onPress={() => setRelationTab(null)}
                                    >
                                        {t("profile.community.connections.hide")}
                                    </Button>
                                ) : null}
                            </div>
                            {relationTab ? (
                                <div className="flex flex-col gap-3">
                                    {relationList.length === 0 ? (
                                        <EmptyContent
                                            title={t(
                                                `profile.community.connections.empty.${relationTab}`,
                                            )}
                                        />
                                    ) : (
                                        relationList.map((user) => (
                                            <CommunityUserRow key={user.id} user={user} />
                                        ))
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </LabeledCard>

                    {/* activity timeline */}
                    <LabeledCard label={t("profile.community.activity.title")}>
                        <ProfileActivity />
                    </LabeledCard>

                    {/* recent posts */}
                    <LabeledCard
                        label={t("profile.community.recentPosts.title")}
                        onSeeMore={() => router.push("/community")}
                        seeMoreLabel={t("profile.community.empty.browse")}
                    >
                        {data.recentPosts.length === 0 ? (
                            <EmptyContent title={t("profile.community.empty.title")} />
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

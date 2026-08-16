"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import {
    CaretRightIcon,
    MedalIcon,
    StackIcon,
    UserPlusIcon,
    UsersThreeIcon,
} from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { PostEngagementBar } from "@/components/reuseable/PostEngagementBar"
import { useMutateReactPostSwr } from "@/components/features/community/hooks/useMutateReactPostSwr"
import type { PublicProfile } from "../../hooks/useQueryPublicProfileSwr"
import { useQueryPublicCommunitySwr } from "../../hooks/useQueryPublicCommunitySwr"

/**
 * One counter on the stats row: icon + number, nothing else. Deliberately FRAMELESS —
 * the row used to be four `MetricCard`s, i.e. four boxed cards for four numbers, which
 * out-weighed the content around them. The metric NAME is not painted: it rides along as
 * the tooltip + screen-reader text so the row stays a row of numbers.
 */
/**
 * Overview tab — the profile's front page: the counters the BE can actually back, then
 * the community posts this person wrote.
 *
 * Counters come from `counters` (followers / following are authoritative server totals)
 * and from the length of the `projects` / `achievements` arrays, which the public-profile
 * endpoint returns IN FULL — so those two are exact, not a page count. The lists
 * themselves live in the Profile tab; this tab does not preview them.
 *
 * The post list shares `useQueryPublicCommunitySwr` with the Community tab (same SWR key
 * → one fetch, whichever tab opens first); that call is best-effort per block, so a
 * hidden/auth-gated search degrades to the empty state instead of an error.
 */
export const ProfileOverviewTab = ({ profile }: { profile: PublicProfile }) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const reactPost = useMutateReactPostSwr()
    const { data, isLoading, error, mutate } = useQueryPublicCommunitySwr(
        profile.username,
        profile.userId,
    )

    return (
        <div className="flex flex-col gap-6">
            <LabeledCard
                label={t("publicProfile.community.postsTitle")}
                frameless={Boolean(data && data.recentPosts.length > 0)}
            >
                <AsyncContent
                    isLoading={isLoading && !data}
                    skeleton={
                        <div className="flex flex-col gap-3">
                            <Skeleton.ListRow />
                            <Skeleton.ListRow />
                        </div>
                    }
                    error={!data ? error : undefined}
                    errorContent={{
                        title: t("profile.loadingError"),
                        retryLabel: t("profile.retry"),
                        onRetry: () => void mutate(),
                    }}
                >
                    {data && data.recentPosts.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {data.recentPosts.map((post) => (
                                /* Thẻ KHÔNG phải một link phủ cả hàng: thanh tương tác bên dưới
                                   toàn nút bấm, nhét chúng vào trong <a> là lồng anchor — HTML
                                   không hợp lệ và bấm thích lại hoá ra mở bài. Chỉ TIÊU ĐỀ là
                                   link, giống hàng bài ngoài feed cộng đồng. */
                                <div
                                    key={post.id}
                                    className="flex flex-col gap-2 rounded-2xl border border-separator p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href={`/community/${post.id}`}
                                            className="group min-w-0 flex-1 no-underline"
                                        >
                                            <Typography
                                                type="body-sm"
                                                weight="medium"
                                                className="group-hover:underline"
                                                truncate
                                            >
                                                {post.title}
                                            </Typography>
                                        </Link>
                                        <Typography
                                            type="body-xs"
                                            color="muted"
                                            className="shrink-0"
                                        >
                                            {post.dateLabel}
                                        </Typography>
                                    </div>
                                    <PostEngagementBar
                                        likes={post.likeCount}
                                        liked={post.likedByMe}
                                        commentsCount={post.commentCount}
                                        onToggleLike={() => {
                                            void reactPost(post.id, !post.likedByMe)
                                            void mutate()
                                        }}
                                        // bình luận sống ở trang bài; ở đây bấm là đi tới đó
                                        onCommentClick={() => router.push(`/${locale}/community/${post.id}`)}
                                        postUrl={`/community/${post.id}`}
                                        shareTitle={post.title}
                                        saveEntityType="post"
                                        saveEntityId={post.id}
                                        hideZeroCounts
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyContent title={t("publicProfile.community.postsEmpty")} />
                    )}
                </AsyncContent>
            </LabeledCard>
        </div>
    )
}

"use client"

import React, { useCallback, useMemo, useState } from "react"
import { Button } from "@heroui/react"
import type { Key } from "react"
import { ChatCircleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { pathConfig } from "@/resources/path"
import { CommunityComposer } from "./CommunityComposer"
import { CommunityFeedSkeleton } from "./CommunityFeedSkeleton"
import { CommunityPost } from "../CommunityPost"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { PageContainer } from "@/components/blocks/layout/PageContainer"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { TabsCard } from "@/components/blocks/navigation/TabsCard"
import { useMutateReactCommunityPostSwr } from "@/hooks/swr/api/graphql/mutations/useMutateReactCommunityPostSwr"
import { useQueryCommunityFeedSwr } from "@/hooks/swr/api/graphql/queries/useQueryCommunityFeedSwr"
import { CommunityChannel } from "@/modules/api/graphql/queries/types/community-feed"
import { ReactionType } from "@/modules/api/graphql/queries/types/discussion"
import { useAppSelector } from "@/redux/hooks"

/** Sentinel tab key for the unfiltered "all channels" feed. */
const ALL_KEY = "all"

/**
 * Community feed page (Facebook/Twitter-style). Everyone can read; signed-in users
 * get a composer (non-members are quota-limited server-side, surfaced as a toast).
 * Channel tabs switch the scope; posts render as cards with a reaction bar +
 * comment count. Cursor-paginated via SWR infinite with a "load more" button.
 */
export const CommunityFeed = () => {
    const t = useTranslations()
    const router = useRouter()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    // null channel = the unfiltered "all channels" feed
    const [channel, setChannel] = useState<CommunityChannel | null>(null)

    const {
        data: pages,
        size,
        setSize,
        isLoading,
        isValidating,
        error,
        mutate,
    } = useQueryCommunityFeedSwr(channel)
    const { trigger: reactPost } = useMutateReactCommunityPostSwr()

    // flatten the SWR pages into a single newest-first list
    const items = useMemo(
        () => (pages ?? []).flatMap((page) => page.items),
        [pages],
    )
    // there is more iff the last loaded page still carries a next cursor
    const hasMore = Boolean(pages?.[pages.length - 1]?.nextCursor)
    // a "load more" is in flight when validating a page we have not yet rendered
    const isLoadingMore = isValidating && (pages?.length ?? 0) < size

    // react to a post, then revalidate so the count + my-reaction refresh
    const onReact = useCallback(
        async (postId: string, type: ReactionType | null) => {
            await reactPost({ postId, type })
            await mutate()
        },
        [reactPost, mutate],
    )

    // channel tabs (left group); "all" maps back to a null channel scope
    const channelTabs = useMemo(
        () => [
            { key: ALL_KEY, label: t("community.channel.all") },
            { key: CommunityChannel.Problems, label: t("community.channel.problems") },
            { key: CommunityChannel.FounderQa, label: t("community.channel.founderQa") },
            { key: CommunityChannel.General, label: t("community.channel.general") },
        ],
        [t],
    )

    // composer posts to the active channel; the "all" tab defaults to General
    const composerChannel = channel ?? CommunityChannel.General

    return (
        <PageContainer>
            <div className="flex flex-col gap-6">
                <PageHeader
                    title={t("community.title")}
                    description={t("community.description")}
                    actions={(
                        <Button
                            variant="secondary"
                            size="sm"
                            onPress={() => router.push(
                                `${pathConfig().locale().community().build()}/chat`,
                            )}
                        >
                            <ChatCircleIcon className="size-4 shrink-0" />
                            {t("community.chat.title")}
                        </Button>
                    )}
                />

                <div className="flex flex-col gap-3">
                    <TabsCard
                        leftTabs={{
                            items: channelTabs,
                            selectedKey: channel ?? ALL_KEY,
                            ariaLabel: t("community.channelTabsAria"),
                            onSelectionChange: (key: Key) => {
                                const value = String(key)
                                setChannel(value === ALL_KEY ? null : (value as CommunityChannel))
                            },
                        }}
                    />

                    {authenticated ? (
                        <CommunityComposer
                            channel={composerChannel}
                            onPosted={() => void mutate()}
                        />
                    ) : null}

                    <AsyncContent
                        isLoading={isLoading && items.length === 0}
                        skeleton={<CommunityFeedSkeleton />}
                        isEmpty={items.length === 0}
                        emptyContent={{ title: t("community.empty") }}
                        error={items.length === 0 ? error : undefined}
                        errorContent={{
                            title: t("community.error"),
                            onRetry: () => void mutate(),
                            retryLabel: t("community.retry"),
                        }}
                    >
                        <div className="flex flex-col gap-6">
                            {items.map((post) => (
                                <CommunityPost
                                    key={post.id}
                                    post={post}
                                    authenticated={authenticated}
                                    onReact={authenticated ? onReact : undefined}
                                    onChanged={() => void mutate()}
                                />
                            ))}
                            {hasMore ? (
                                <div className="flex justify-center">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        isPending={isLoadingMore}
                                        onPress={() => void setSize(size + 1)}
                                    >
                                        {t("community.loadMore")}
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    </AsyncContent>
                </div>
            </div>
        </PageContainer>
    )
}

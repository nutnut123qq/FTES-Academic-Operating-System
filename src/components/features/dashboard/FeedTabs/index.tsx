"use client"

import React, {
    useCallback,
    useMemo,
    useState,
} from "react"
import {
    Button,
    Card,
    CardContent,
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import {
    BookOpenIcon,
    ListBulletsIcon,
    MedalIcon,
    UsersIcon,
} from "@phosphor-icons/react"
import {
    TrendingContents,
} from "../TrendingContents"
import {
    FeedTabsSkeleton,
} from "./FeedTabsSkeleton"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { ActivityFeed } from "@/components/blocks/feed/ActivityFeed"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { TabsCard } from "@/components/blocks/navigation/TabsCard"
import { useQueryMyFeedSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyFeedSwr"
import { useMutateReactActivitySwr } from "@/hooks/swr/api/graphql/mutations/useMutateReactActivitySwr"
import { MyFeedTab, MyFeedCategory } from "@/modules/api/graphql/queries/types/my-feed"
import { queryResolveRoute } from "@/modules/api/graphql/queries/query-resolve-route"
import type { ReactionType } from "@/modules/api/graphql/queries/types/discussion"

/** Props for {@link FeedTabs}. */
export type FeedTabsProps = WithClassNames<undefined>

/**
 * Explore feed (ContentBody-style TabsCard pattern). CARD 1 = "Nổi bật tuần này"
 * platform-wide trending discovery (both scopes, self-hiding). Below it, a double-tabs toolbar
 * floats OUTSIDE/above a card: left = audience SCOPE ("Khám phá / Đang theo dõi"),
 * right = category FILTER (all/courses/achievements/people), one shared {@link TabsCard};
 * the card holds the activity stream they govern ({@link ActivityFeed}). Both axes are
 * `myFeed` params. `"use client"` for tab/filter state + SWR + route resolution.
 *
 * @param props - optional className for the root element
 */
export const FeedTabs = ({
    className,
}: FeedTabsProps = {}) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const [tab, setTab] = useState<MyFeedTab>(MyFeedTab.ForYou)
    /** Active filter chip — narrows the feed to a slice of activity types. */
    const [category, setCategory] = useState<MyFeedCategory>(MyFeedCategory.All)

    // cursor-paginated feed for the active scope + filter (array of pages)
    const {
        data: pages,
        size,
        setSize,
        isLoading,
        isValidating,
        error,
        mutate,
    } = useQueryMyFeedSwr(tab, category)
    const { trigger: reactActivity } = useMutateReactActivitySwr()

    /** React to a feed activity, then revalidate so counts/my-reaction refresh. */
    const onReact = useCallback(
        async (activityId: string, type: ReactionType | null) => {
            await reactActivity({ activityId, type })
            await mutate()
        },
        [
            reactActivity,
            mutate,
        ],
    )

    /** Single-select category filter chips shown under the scope tabs. */
    const filters = useMemo(
        () => [
            { key: MyFeedCategory.All, label: t("dashboard.feedFilter.all"), Icon: ListBulletsIcon },
            { key: MyFeedCategory.Courses, label: t("dashboard.feedFilter.courses"), Icon: BookOpenIcon },
            { key: MyFeedCategory.Achievements, label: t("dashboard.feedFilter.achievements"), Icon: MedalIcon },
            { key: MyFeedCategory.People, label: t("dashboard.feedFilter.people"), Icon: UsersIcon },
        ],
        [t],
    )

    // flatten pages → one newest-first list
    const items = useMemo(
        () => (pages ?? []).flatMap((page) => page.items),
        [pages],
    )
    const hasMore = Boolean(pages?.[pages.length - 1]?.nextCursor)
    const isLoadingMore = isValidating && (pages?.length ?? 0) < size

    /** Resolve an entity's route via the index, then navigate (no-op if unroutable). */
    const onResolve = useCallback(
        (globalId: string | null | undefined): (() => void) | undefined => {
            if (!globalId) {
                return undefined
            }
            return () => {
                void (async () => {
                    const response = await queryResolveRoute({ request: { globalId } })
                    const path = response.data?.resolveRoute?.data?.path
                    if (path) {
                        router.push(`/${locale}${path}`)
                    }
                })()
            }
        },
        [
            locale,
            router,
        ],
    )

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            {/* CARD 1 — "Nổi bật tuần này": platform-wide trending discovery (own query, NOT
                scope-dependent) → shown on both scopes; self-hides when nothing trends. */}
            <TrendingContents />

            {/* CARD 2 — TabsCard pattern (like the lesson ContentBody): the double-tabs toolbar
                (audience SCOPE left + category FILTER right) floats OUTSIDE, above the card; the
                card holds the activity stream the tabs govern. */}
            <div className="flex flex-col gap-3">
                <TabsCard
                    leftTabs={{
                        items: [
                            { key: MyFeedTab.ForYou, label: t("dashboard.tabs.forYou") },
                            { key: MyFeedTab.Following, label: t("dashboard.tabs.following") },
                        ],
                        selectedKey: tab,
                        ariaLabel: t("dashboard.feedTabsAria"),
                        onSelectionChange: (key) => setTab(key as MyFeedTab),
                    }}
                    rightTabs={{
                        items: filters.map((filter) => ({
                            key: filter.key,
                            label: filter.label,
                            icon: <filter.Icon aria-hidden focusable="false" className="size-5 shrink-0" />,
                        })),
                        selectedKey: category,
                        ariaLabel: t("dashboard.feedFilterAria"),
                        onSelectionChange: (key) => setCategory(key as MyFeedCategory),
                    }}
                />
                <Card>
                    <CardContent>
                        <AsyncContent
                            isLoading={isLoading && items.length === 0}
                            skeleton={<FeedTabsSkeleton />}
                            isEmpty={items.length === 0}
                            emptyContent={{
                                title: t("dashboard.feedEmpty"),
                            }}
                            error={items.length === 0 ? error : undefined}
                            errorContent={{
                                title: t("dashboard.feedError"),
                                onRetry: () => { void mutate() },
                                retryLabel: t("dashboard.feedRetry"),
                            }}
                        >
                            <div className="flex flex-col gap-6">
                                <ActivityFeed items={items} onResolve={onResolve} onReact={onReact} />
                                {hasMore ? (
                                    <div className="flex justify-center">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            isPending={isLoadingMore}
                                            onPress={() => setSize(size + 1)}
                                        >
                                            {t("dashboard.loadMore")}
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
                        </AsyncContent>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

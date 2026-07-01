"use client"

import React, {
    useCallback,
    useMemo,
} from "react"
import {
    Button,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import {
    PulseIcon,
} from "@phosphor-icons/react"
import {
    useProfileUsername,
} from "../../hooks/useProfileUsername"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { queryResolveRoute } from "@/modules/api/graphql/queries/query-resolve-route"
import type { ReactionType } from "@/modules/api/graphql/queries/types/discussion"
import { useQueryUserFeedSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserFeedSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { useMutateReactActivitySwr } from "@/hooks/swr/api/graphql/mutations/useMutateReactActivitySwr"
import { useAppSelector } from "@/redux/hooks"
import { ActivityFeed } from "@/components/blocks/feed/ActivityFeed"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Props for {@link ProfileActivity}. */
export type ProfileActivityProps = WithClassNames<undefined>

/**
 * Activity-tab section — the profile owner's timeline, rendered by the shared
 * {@link ActivityFeed} block (avatar + activity-type badge · actor·action·target
 * sentence · relative time, grouped by day, milestone roll-up, never-blank target).
 * This feature owns the fetch (infinite SWR), the "load more" pager, the section
 * card + states, and the route resolver it hands the block. Self-hides when empty.
 *
 * @param props - optional className (placement only).
 */
export const ProfileActivity = ({
    className,
}: ProfileActivityProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const username = useProfileUsername()
    const { data: user } = useQueryUserProfileSwr(username)
    const userId = user?.id ?? null
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const {
        data,
        size,
        setSize,
        isLoading,
        isValidating,
        error,
        mutate,
    } = useQueryUserFeedSwr(userId)
    const { trigger: reactActivity } = useMutateReactActivitySwr()

    /** React to a timeline activity, then revalidate. Own items are read-only
     * (server sets `isMine` → the feed suppresses the picker), so this only ever
     * fires when viewing someone else's profile. */
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

    // flatten every loaded page into a single newest-first item list
    const items = useMemo(
        () => (data ?? []).flatMap((page) => page.items),
        [data],
    )
    const hasMore = Boolean(data && data.length > 0 && data[data.length - 1].nextCursor !== null)
    const isLoadingMore = isValidating && Boolean(data) && size > 0

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
        <LabeledCard
            className={className}
            label={t("publicProfile.recentActivity")}
            icon={<PulseIcon aria-hidden focusable="false" className="size-5" />}
        >
            <AsyncContent
                isLoading={(isLoading || !userId) && items.length === 0}
                skeleton={(
                    <div className="flex flex-col gap-6">
                        {[0, 1].map((group) => (
                            <div key={group} className="flex flex-col gap-3">
                                {/* day header */}
                                <Skeleton.Typography type="body-xs" width="1/4" />
                                {[0, 1, 2].map((row) => (
                                    <div key={row} className="flex items-start gap-2">
                                        {/* actor avatar + type badge */}
                                        <Skeleton className="size-9 shrink-0 rounded-full" />
                                        <div className="flex flex-1 flex-col gap-0">
                                            <Skeleton.Typography type="body-sm" width="3/4" />
                                            <Skeleton.Typography type="body-xs" width="1/4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
                isEmpty={items.length === 0}
                emptyContent={{
                    title: t("publicProfile.activityEmpty"),
                    description: t("publicProfile.activityEmptyHint"),
                }}
                error={items.length === 0 ? error : undefined}
                errorContent={{
                    title: t("publicProfile.loadError"),
                    onRetry: () => {
                        void mutate()
                    },
                    retryLabel: t("publicProfile.loadErrorRetry"),
                }}
            >
                <div className="flex flex-col gap-6">
                    <ActivityFeed
                        items={items}
                        onResolve={onResolve}
                        onReact={authenticated ? onReact : undefined}
                    />
                    {hasMore ? (
                        <div className="flex justify-center">
                            <Button
                                variant="secondary"
                                size="sm"
                                isPending={isLoadingMore}
                                onPress={() => setSize(size + 1)}
                            >
                                {t("publicProfile.loadMore")}
                            </Button>
                        </div>
                    ) : null}
                </div>
            </AsyncContent>
        </LabeledCard>
    )
}

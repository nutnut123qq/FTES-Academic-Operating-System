"use client"

import React, {
    useCallback,
} from "react"
import {
    Button,
    cn,
    Spinner,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import {
    useProfileUsername,
} from "../useProfileUsername"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { queryResolveRoute } from "@/modules/api/graphql/queries/query-resolve-route"
import { useQueryUserFeedSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserFeedSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { ActivityFeed } from "@/components/blocks/feed/ActivityFeed"
import { ErrorState } from "@/components/blocks/feedback/ErrorState"

/** Props for {@link ProfileActivity}. */
export type ProfileActivityProps = WithClassNames<undefined>

/**
 * Activity tab of the (legacy) public profile — the profile owner's own activity
 * timeline, newest first, with cursor-paginated "load more". Self-contained
 * container: reads the target user id from the route and drives its own infinite
 * SWR, then renders the shared {@link ActivityFeed} block.
 *
 * @param props - optional className for the root element.
 */
export const ProfileActivity = ({
    className,
}: ProfileActivityProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    // route carries the username; resolve it to the entity id the timeline keys off
    const username = useProfileUsername()
    const { data: user } = useQueryUserProfileSwr(username)
    const userId = user?.id ?? null
    const {
        data,
        size,
        setSize,
        isLoading,
        isValidating,
        error,
        mutate,
    } = useQueryUserFeedSwr(userId)

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

    // first page in flight (username not yet resolved, or query running) → spinner
    if (!data && (isLoading || !userId)) {
        return (
            <div className="flex justify-center p-12">
                <Spinner size="lg" />
            </div>
        )
    }

    // first page failed → recoverable error state with retry
    if (!data && error) {
        return (
            <ErrorState
                className={className}
                title={t("publicProfile.loadError")}
                retryLabel={t("publicProfile.loadErrorRetry")}
                onRetry={() => {
                    void mutate()
                }}
            />
        )
    }

    // flatten every loaded page into a single newest-first item list
    const items = (data ?? []).flatMap((page) => page.items)
    // the last loaded page still carries a cursor → there is another page
    const hasMore = Boolean(data && data.length > 0 && data[data.length - 1].nextCursor !== null)
    // a refetch of the trailing page reads as loading-more
    const isLoadingMore = isValidating && Boolean(data) && size > 0

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <ActivityFeed items={items} onResolve={onResolve} />
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
    )
}

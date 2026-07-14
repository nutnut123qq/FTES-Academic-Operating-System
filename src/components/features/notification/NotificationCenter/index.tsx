"use client"

import React, { useCallback, useMemo, useState } from "react"
import { BellIcon, CircleIcon, GearSixIcon } from "@phosphor-icons/react"
import { Button, Spinner, Typography, cn } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import {
    markAllNotificationsRead,
    markNotificationRead,
} from "@/modules/api/rest/notification/notification"
import type { NotificationItem } from "@/modules/api/rest/notification/types"
import {
    NOTIFICATION_LIST_PAGE_LIMIT,
    useQueryMyNotificationsInfiniteSwr,
} from "@/hooks/swr/api/graphql/queries/useQueryMyNotificationsInfiniteSwr"
import { useQueryMyNotificationsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyNotificationsSwr"
import { useGetNotificationPreferencesSwr } from "@/hooks/swr/api/rest/queries/useGetNotificationPreferencesSwr"
import { useRestWithToast } from "@/modules/toast/hooks"
import { mutate as globalMutate } from "swr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { InfiniteScrollSentinel } from "@/components/blocks/async/InfiniteScrollSentinel"
import { resolveNotificationIcon } from "../typeIcon"
import { filterNotificationsByPreferences } from "../preferences"
import { PreferencesSurface } from "./PreferencesSurface"

/** Filter options: everything, or unread only. */
type Filter = "all" | "unread"

/** SWR key of the shared badge cache (bell + badge) — revalidated on mutation. */
const BADGE_SWR_KEY = "QUERY_MY_NOTIFICATIONS_SWR"

/**
 * NotificationCenter — the `/notifications` page, backed by the SAME real BE
 * REST notifications API the navbar bell uses (`GET /api/v1/notifications`).
 *
 * Renders a paginated, infinite-scroll list (server `page`/`size`), a
 * server-backed all/unread filter (`status=UNREAD`, pagination reset on switch),
 * per-type icons, relative timestamps and unread indicators. Rows are
 * keyboard-activatable buttons: activating one marks it read
 * (`POST /notifications/{id}/read`) and, when it carries a `deepLink`, navigates
 * locale-prefixed; targetless rows only mark read. "Mark all read" calls
 * `POST /notifications/read-all`. Every mutation revalidates both the infinite
 * list and the shared badge key so the bell badge tracks the change without a
 * reload. A header gear opens the preferences surface (real BE preferences —
 * `GET/PUT /api/v1/notifications/preferences` — shared with the bell filter).
 */
export const NotificationCenter = () => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const runRest = useRestWithToast()

    const [filter, setFilter] = useState<Filter>("all")
    const [showPreferences, setShowPreferences] = useState(false)

    const unreadOnly = filter === "unread"
    const infinite = useQueryMyNotificationsInfiniteSwr(unreadOnly)
    const badge = useQueryMyNotificationsSwr()
    const { data: preferences } = useGetNotificationPreferencesSwr()

    const { data: pages, size, setSize, isValidating, error, mutate } = infinite

    /** Flat notification list across all fetched pages. */
    const allItems = useMemo(
        () => (pages ?? []).flat(),
        [pages],
    )
    /** Visible rows after applying the muted-type / mute-all preferences filter. */
    const items = useMemo(
        () => filterNotificationsByPreferences(allItems, preferences),
        [allItems, preferences],
    )
    const muteAll = preferences?.muteAll ?? false

    // last page short → no more rows to load
    const lastPage = pages?.[pages.length - 1]
    const hasMore = Boolean(
        lastPage && lastPage.length >= NOTIFICATION_LIST_PAGE_LIMIT,
    )
    const isLoadingFirst = !pages && !error
    const unreadCount = badge.data?.unreadCount ?? 0
    const hasUnread = unreadCount > 0

    /** Locale-aware relative-time formatter for the row timestamps. */
    const relativeFormat = useMemo(
        () => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }),
        [locale],
    )

    /** Format an ISO timestamp as a coarse relative string ("3h ago"). */
    const formatRelative = useCallback(
        (iso: string): string => {
            const diffMs = new Date(iso).getTime() - Date.now()
            const diffMin = Math.round(diffMs / 60_000)
            if (Math.abs(diffMin) < 60) {
                return relativeFormat.format(diffMin, "minute")
            }
            const diffHour = Math.round(diffMin / 60)
            if (Math.abs(diffHour) < 24) {
                return relativeFormat.format(diffHour, "hour")
            }
            const diffDay = Math.round(diffHour / 24)
            return relativeFormat.format(diffDay, "day")
        },
        [relativeFormat],
    )

    /** Revalidate both the infinite list and the shared badge cache. */
    const revalidateAll = useCallback(async () => {
        await Promise.all([mutate(), globalMutate([BADGE_SWR_KEY])])
    }, [mutate])

    /** Switch the all/unread filter, resetting pagination to the first page. */
    const onSelectFilter = useCallback(
        (option: Filter) => {
            setFilter(option)
            void setSize(1)
        },
        [setSize],
    )

    /** Mark a row read (optimistic) and navigate to its deep link. */
    const onPressItem = useCallback(
        async (notification: NotificationItem) => {
            if (!notification.isRead) {
                await runRest(() => markNotificationRead(notification.id), {
                    showSuccessToast: false,
                    showErrorToast: false,
                })
                await revalidateAll()
            }
            if (notification.deepLink) {
                router.push(`/${locale}${notification.deepLink}`)
            }
        },
        [locale, revalidateAll, router, runRest],
    )

    /** Mark every unread notification read in one bulk action. */
    const onMarkAllRead = useCallback(async () => {
        await runRest(() => markAllNotificationsRead(), {
            showSuccessToast: false,
            showErrorToast: true,
        })
        await revalidateAll()
    }, [revalidateAll, runRest])

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            {/* header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-0">
                    <div className="flex items-center gap-2">
                        <BellIcon
                            className="size-6 text-accent"
                            aria-hidden
                            focusable="false"
                        />
                        <Typography type="h4" weight="bold">
                            {t("notificationCenter.title")}
                        </Typography>
                    </div>
                    <Typography type="body-sm" color="muted">
                        {t("notificationCenter.subtitle")}
                    </Typography>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        isDisabled={!hasUnread}
                        onPress={onMarkAllRead}
                    >
                        {t("notificationCenter.markAllRead")}
                    </Button>
                    <Button
                        isIconOnly
                        size="sm"
                        variant="tertiary"
                        aria-expanded={showPreferences}
                        aria-label={t("notifications.preferences.title")}
                        onPress={() => setShowPreferences((open) => !open)}
                    >
                        <GearSixIcon className="size-5" aria-hidden focusable="false" />
                    </Button>
                </div>
            </div>

            {/* preferences (opened from the header gear) */}
            {showPreferences ? <PreferencesSurface /> : null}

            {/* filter */}
            <div className="flex flex-wrap gap-2">
                {(["all", "unread"] as Array<Filter>).map((option) => (
                    <Button
                        key={option}
                        size="sm"
                        variant={filter === option ? "secondary" : "ghost"}
                        onPress={() => onSelectFilter(option)}
                    >
                        {t(`notificationCenter.${option}`)}
                    </Button>
                ))}
            </div>

            {/* list */}
            {muteAll ? (
                <Typography type="body-sm" color="muted">
                    {t("notifications.mutedHint")}
                </Typography>
            ) : (
                <AsyncContent
                    isLoading={isLoadingFirst}
                    skeleton={
                        <div className="flex flex-col gap-2">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 rounded-2xl border border-separator px-4 py-3"
                                >
                                    <Skeleton className="size-10 shrink-0 rounded-large" />
                                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                                        <Skeleton className="h-4 w-3/4 rounded-md" />
                                        <Skeleton className="h-3 w-1/3 rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
                    isEmpty={items.length === 0}
                    emptyContent={{ title: t("notificationCenter.empty") }}
                    error={!pages ? error : undefined}
                    errorContent={{
                        title: t("notifications.loadError"),
                        onRetry: () => {
                            void mutate()
                        },
                        retryLabel: t("notifications.retry"),
                    }}
                >
                    <ul className="flex flex-col gap-2">
                        {items.map((item) => {
                            const Icon = resolveNotificationIcon(item.type)
                            return (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        onClick={() => onPressItem(item)}
                                        aria-label={item.title}
                                        className={cn(
                                            "flex w-full items-start gap-3 rounded-2xl border border-separator px-4 py-3 text-left transition-colors hover:bg-default/40 focus-visible:bg-default/40 focus-visible:outline-none",
                                            !item.isRead && "bg-default/40",
                                        )}
                                    >
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
                                            <Icon
                                                className="size-5"
                                                aria-hidden
                                                focusable="false"
                                            />
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                                            <Typography
                                                type="body-sm"
                                                className="line-clamp-2"
                                            >
                                                {item.title}
                                            </Typography>
                                            {item.body ? (
                                                <Typography
                                                    type="body-xs"
                                                    color="muted"
                                                    className="line-clamp-2"
                                                >
                                                    {item.body}
                                                </Typography>
                                            ) : null}
                                            <Typography type="body-xs" color="muted">
                                                {formatRelative(item.createdAt)}
                                            </Typography>
                                        </div>
                                        {!item.isRead && (
                                            <CircleIcon
                                                weight="fill"
                                                focusable="false"
                                                className="mt-1 size-2 shrink-0 text-accent"
                                                aria-label={t("notificationCenter.unread")}
                                            />
                                        )}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>

                    {/* infinite-scroll load-more sentinel */}
                    <InfiniteScrollSentinel
                        onReach={() => {
                            void setSize(size + 1)
                        }}
                        disabled={!hasMore || isValidating}
                    />
                    {isValidating && pages && pages.length > 0 ? (
                        <div className="flex items-center justify-center py-3">
                            <Spinner size="sm" />
                        </div>
                    ) : null}
                </AsyncContent>
            )}
        </div>
    )
}

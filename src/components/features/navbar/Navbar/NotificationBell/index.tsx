"use client"

import React, {
    useCallback,
    useMemo,
    useState,
} from "react"
import {
    BellIcon,
    CircleIcon,
} from "@phosphor-icons/react"
import {
    Badge,
    Button,
    Header,
    Popover,
    PopoverContent,
    Separator,
    Typography,
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "@/i18n/navigation"
import { pathConfig } from "@/resources/path"
import {
    markAllNotificationsRead,
    markNotificationRead,
} from "@/modules/api/rest/notification/notification"
import type { NotificationItem } from "@/modules/api/rest/notification/types"
import { useQueryMyNotificationsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyNotificationsSwr"
import { useGetNotificationPreferencesSwr } from "@/hooks/swr/api/rest/queries/useGetNotificationPreferencesSwr"
import { useAppSelector } from "@/redux/hooks"
import { useRestWithToast } from "@/modules/toast/hooks"
import { resolveNotificationIcon } from "@/components/features/notification/typeIcon"
import {
    deriveMutedAwareUnreadCount,
    filterNotificationsByPreferences,
} from "@/components/features/notification/preferences"
import { ListRow } from "@/components/blocks/lists/ListRow"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Largest unread count rendered verbatim on the badge before showing "9+". */
const MAX_BADGE = 9
/** How many recent notifications the bell popover previews. */
const PREVIEW_COUNT = 5

/** Props for {@link NotificationBell}. */
export type NotificationBellProps = WithClassNames<undefined>

/**
 * NotificationBell — navbar bell with an unread-count badge and a preview
 * popover.
 *
 * Reads the SAME real BE REST notifications API as the `/notifications` center
 * (shared badge SWR key {@link useQueryMyNotificationsSwr}) so the two never
 * diverge — polling drives freshness (non-realtime). Shows an unread badge
 * (hidden at zero), a header with a working "mark all read" action, the
 * {@link PREVIEW_COUNT} newest items (per-type icon + text + relative time +
 * unread dot), and a footer link to the full center. Clicking an item marks it
 * read and routes to its deep link. Muted types (and mute-all) are filtered out
 * and reflected in the badge. `"use client"` for the SWR hooks, popover state
 * and navigation.
 * @param props - optional root class name (placement only)
 */
export const NotificationBell = ({ className }: NotificationBellProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { data, isLoading, error, mutate } = useQueryMyNotificationsSwr()
    const { data: preferences } = useGetNotificationPreferencesSwr()
    const runRest = useRestWithToast()
    const [isOpen, setOpen] = useState(false)

    const fetchedItems = useMemo(() => data?.items ?? [], [data])
    const visibleItems = useMemo(
        () => filterNotificationsByPreferences(fetchedItems, preferences),
        [fetchedItems, preferences],
    )
    const recent = useMemo(
        () => visibleItems.slice(0, PREVIEW_COUNT),
        [visibleItems],
    )
    const unreadCount = deriveMutedAwareUnreadCount(
        data?.unreadCount ?? 0,
        fetchedItems,
        preferences,
    )
    const muteAll = preferences?.muteAll ?? false

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

    /** Mark a single notification read and navigate to its deep link. */
    const onPressItem = useCallback(
        async (notification: NotificationItem) => {
            setOpen(false)
            if (!notification.isRead) {
                await runRest(() => markNotificationRead(notification.id), {
                    showSuccessToast: false,
                    showErrorToast: false,
                })
                await mutate()
            }
            if (notification.deepLink) {
                router.push(notification.deepLink)
            }
        },
        [mutate, router, runRest],
    )

    /** Mark every unread notification read in one bulk action. */
    const onMarkAllRead = useCallback(async () => {
        await runRest(() => markAllNotificationsRead(), {
            showSuccessToast: false,
            showErrorToast: true,
        })
        await mutate()
    }, [mutate, runRest])

    // the bell is only meaningful for an authenticated viewer
    if (!authenticated) {
        return null
    }

    /** Locale-less notifications route for the "view all" footer link. */
    const notificationsPath = pathConfig().locale().notifications().build()

    /** Badge label, capped at {@link MAX_BADGE} (e.g. "9+"). */
    const badgeLabel = unreadCount > MAX_BADGE ? `${MAX_BADGE}+` : `${unreadCount}`

    return (
        <Popover isOpen={isOpen} onOpenChange={setOpen}>
            <Button
                isIconOnly
                variant="tertiary"
                className={cn("rounded-full", className)}
                aria-label={t("notificationCenter.title")}
            >
                {unreadCount > 0 ? (
                    <Badge.Anchor>
                        <BellIcon className="size-5" aria-hidden focusable="false" />
                        <Badge size="sm" color="danger">{badgeLabel}</Badge>
                    </Badge.Anchor>
                ) : (
                    <BellIcon className="size-5" aria-hidden focusable="false" />
                )}
            </Button>
            <PopoverContent placement="bottom right" className="w-[360px]">
                <div className="flex flex-col">
                    {/* header: title + "mark all read" action */}
                    <div className="flex items-center justify-between gap-3 px-2 py-1">
                        <Header>{t("notificationCenter.title")}</Header>
                        {unreadCount > 0 ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onPress={onMarkAllRead}
                            >
                                {t("notificationCenter.markAllRead")}
                            </Button>
                        ) : null}
                    </div>
                    {/* body: muted hint is a distinct informational state; otherwise the
                        standard async switch (skeleton mirrors the ListRow list → empty → error) */}
                    {muteAll ? (
                        <Typography
                            type="body-sm"
                            color="muted"
                            className="px-2 py-6 text-center"
                        >
                            {t("notifications.mutedHint")}
                        </Typography>
                    ) : (
                        <AsyncContent
                            isLoading={isLoading && recent.length === 0}
                            skeleton={(
                                <div className="flex flex-col px-2">
                                    {[0, 1, 2].map((row) => (
                                        <Skeleton.ListRow key={row} withSubtitle={false} />
                                    ))}
                                </div>
                            )}
                            isEmpty={recent.length === 0}
                            emptyContent={{ title: t("notificationCenter.empty") }}
                            error={error}
                            errorContent={{
                                title: t("notifications.loadError"),
                                onRetry: () => { void mutate() },
                                retryLabel: t("notifications.retry"),
                            }}
                        >
                            <div className="flex flex-col px-2">
                                {recent.map((item, index) => {
                                    const Icon = resolveNotificationIcon(item.type)
                                    const unread = !item.isRead
                                    return (
                                        <ListRow
                                            key={item.id}
                                            onPress={() => onPressItem(item)}
                                            leading={(
                                                <div className="flex size-9 items-center justify-center rounded-large bg-accent/10 text-accent">
                                                    <Icon className="size-5" aria-hidden focusable="false" />
                                                </div>
                                            )}
                                            title={item.title}
                                            meta={(
                                                <div className="flex items-center gap-2">
                                                    <Typography type="body-xs" color="muted">
                                                        {formatRelative(item.createdAt)}
                                                    </Typography>
                                                    {unread ? (
                                                        <CircleIcon
                                                            weight="fill"
                                                            aria-hidden
                                                            focusable="false"
                                                            className="size-2 text-accent"
                                                        />
                                                    ) : null}
                                                </div>
                                            )}
                                            divider={index < recent.length - 1}
                                        />
                                    )
                                })}
                            </div>
                        </AsyncContent>
                    )}
                    <Separator />
                    {/* footer: view the full center */}
                    <Button
                        variant="ghost"
                        size="sm"
                        fullWidth
                        onPress={() => {
                            setOpen(false)
                            router.push(notificationsPath)
                        }}
                    >
                        {t("notificationCenter.viewAll")}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

"use client"

import {
    Bell as BellIcon,
    CheckDouble as CheckDoubleIcon,
} from "@gravity-ui/icons"
import React, {
    useCallback,
    useMemo,
    useState,
} from "react"
import {
    Badge,
    Button,
    Popover,
    PopoverContent,
    Separator,
    Spinner,
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    markAllNotificationsRead,
    markNotificationRead,
} from "@/modules/api/rest/notification/notification"
import type { NotificationItem } from "@/modules/api/rest/notification/types"
import { useQueryMyNotificationsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyNotificationsSwr"
import { useQueryMyNotificationPreferencesSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyNotificationPreferencesSwr"
import { useAppSelector } from "@/redux/hooks"
import { useRestWithToast } from "@/modules/toast/hooks"
import { ErrorContent } from "@/components/blocks/async/ErrorContent"
import { resolveNotificationIcon } from "@/components/features/notification/typeIcon"
import {
    deriveMutedAwareUnreadCount,
    filterNotificationsByPreferences,
} from "@/components/features/notification/preferences"

/** Largest unread count rendered verbatim on the badge before showing "9+". */
const MAX_BADGE = 9

/** Props for {@link NotificationBell}. */
export type NotificationBellProps = WithClassNames<undefined>

/**
 * NotificationBell — navbar bell with an unread-count badge and a popover list.
 *
 * Self-contained container: fetches its own notification page (newest first)
 * + unread count from the real BE REST notifications API, renders the badge
 * (hidden when zero), and on open shows the recent items with plain text and
 * relative time. Clicking an item marks it read and routes to its deep link; the
 * header action marks all read. `"use client"` for the SWR hook, overlay state
 * and navigation.
 * @param props - optional root class name
 */
export const NotificationBell = ({ className }: NotificationBellProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { data, isLoading, error, mutate } = useQueryMyNotificationsSwr()
    const { data: preferences } = useQueryMyNotificationPreferencesSwr()
    const runRest = useRestWithToast()
    const [isOpen, setOpen] = useState(false)

    const fetchedItems = data?.items ?? []
    // hide muted types (or all, when mute-all is on) from the popover list
    const items = filterNotificationsByPreferences(fetchedItems, preferences)
    // badge respects preferences: muted unread within the page are subtracted,
    // mute-all forces zero (page-window approximation — see preferences.ts)
    const unreadCount = deriveMutedAwareUnreadCount(
        data?.unreadCount ?? 0,
        fetchedItems,
        preferences,
    )
    const muteAll = preferences?.muteAll ?? false

    /** Locale-aware relative-time formatter for the item timestamps. */
    const relativeFormat = useMemo(
        () => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }),
        [locale],
    )

    /** Format an ISO timestamp as a coarse relative string ("3h ago"). */
    const formatRelative = useCallback(
        (iso: string): string => {
            const diffMs = new Date(iso).getTime() - Date.now()
            const diffMin = Math.round(diffMs / 60_000)
            const absMin = Math.abs(diffMin)
            if (absMin < 60) {
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
            // optimistically mark read in the local cache, then persist
            if (!notification.isRead) {
                await runRest(() => markNotificationRead(notification.id), {
                    showSuccessToast: false,
                    showErrorToast: false,
                })
                await mutate()
            }
            // navigate to the snapshotted deep link, if any
            if (notification.deepLink) {
                router.push(`/${locale}${notification.deepLink}`)
            }
        },
        [locale, mutate, router, runRest],
    )

    /** Mark every unread notification read in one bulk action. */
    const onMarkAllRead = useCallback(
        async () => {
            await runRest(() => markAllNotificationsRead(), {
                showSuccessToast: false,
                showErrorToast: true,
            })
            await mutate()
        },
        [mutate, runRest],
    )

    // the bell is only meaningful for an authenticated viewer
    if (!authenticated) {
        return null
    }

    /** Badge label, capped at {@link MAX_BADGE} (e.g. "9+"). */
    const badgeLabel = unreadCount > MAX_BADGE ? `${MAX_BADGE}+` : `${unreadCount}`

    return (
        <Popover isOpen={isOpen} onOpenChange={setOpen}>
            <Button
                isIconOnly
                variant="tertiary"
                className={cn("rounded-full", className)}
                aria-label={t("notifications.title")}
            >
                {unreadCount > 0 ? (
                    <Badge.Anchor>
                        <BellIcon className="size-5" />
                        <Badge size="sm" color="danger">{badgeLabel}</Badge>
                    </Badge.Anchor>
                ) : (
                    <BellIcon className="size-5" />
                )}
            </Button>
            <PopoverContent placement="bottom right" className="w-[360px] overflow-hidden p-0">
                {/* header: title + mark-all-read action */}
                <div className="flex items-center justify-between gap-3 p-3">
                    <span className="text-sm font-semibold text-foreground">
                        {t("notifications.title")}
                    </span>
                    {unreadCount > 0 ? (
                        <Button
                            size="sm"
                            variant="tertiary"
                            onPress={onMarkAllRead}
                            className="gap-2"
                        >
                            <CheckDoubleIcon className="size-5" />
                            <span className="text-xs">{t("notifications.markAllRead")}</span>
                        </Button>
                    ) : null}
                </div>
                <Separator />

                {/* body: muted-all hint / loading / error / empty / list */}
                {muteAll ? (
                    <div className="p-6 text-center text-sm text-muted">
                        {t("notifications.mutedHint")}
                    </div>
                ) : isLoading && items.length === 0 ? (
                    <div className="flex items-center justify-center p-6">
                        <Spinner size="sm" />
                    </div>
                ) : error && items.length === 0 ? (
                    <ErrorContent
                        title={t("notifications.loadError")}
                        onRetry={() => { void mutate() }}
                        retryLabel={t("notifications.retry")}
                    />
                ) : items.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted">
                        {t("notifications.empty")}
                    </div>
                ) : (
                    <div className="flex max-h-[420px] flex-col overflow-y-auto">
                        {items.map((notification) => {
                            const Icon = resolveNotificationIcon(notification.type)
                            return (
                                <button
                                    key={notification.id}
                                    type="button"
                                    onClick={() => onPressItem(notification)}
                                    className={cn(
                                        "flex items-start gap-3 px-3 py-3 text-left hover:bg-default/40",
                                        !notification.isRead && "bg-accent/5",
                                    )}
                                >
                                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                                        <Icon className="size-5" aria-hidden focusable="false" />
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            {!notification.isRead ? (
                                                <span className="size-2 shrink-0 rounded-full bg-accent" />
                                            ) : null}
                                            <span className="flex-1 text-sm font-medium text-foreground">
                                                {notification.title}
                                            </span>
                                        </div>
                                        {notification.body ? (
                                            <span className="text-xs text-muted">
                                                {notification.body}
                                            </span>
                                        ) : null}
                                        <span className="text-xs text-muted">
                                            {formatRelative(notification.createdAt)}
                                        </span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}

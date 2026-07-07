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
import { mutateMarkAllNotificationsAsRead } from "@/modules/api/graphql/mutations/mutation-mark-all-notifications-as-read"
import { mutateMarkNotificationAsRead } from "@/modules/api/graphql/mutations/mutation-mark-notification-as-read"
import { queryResolveRoute } from "@/modules/api/graphql/queries/query-resolve-route"
import type { QueryNotificationData } from "@/modules/api/graphql/queries/types/notifications"
import { useQueryMyNotificationsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyNotificationsSwr"
import { useQueryMyNotificationPreferencesSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyNotificationPreferencesSwr"
import { useAppSelector } from "@/redux/hooks"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import { ErrorContent } from "@/components/blocks/async/ErrorContent"
import { NOTIFICATION_TYPE_ICON } from "@/components/features/notification/typeIcon"
import { encodeNotificationGlobalId } from "@/components/features/notification/global-id"
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
 * + unread count, renders the badge (hidden when zero), and on open shows the
 * recent items with an i18n title and relative time. Clicking an item marks it
 * read and routes to its resolved target; the header action marks all read.
 * `"use client"` for the SWR hook, overlay state and navigation.
 * @param props - optional root class name
 */
export const NotificationBell = ({ className }: NotificationBellProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { data, isLoading, error, mutate } = useQueryMyNotificationsSwr()
    const { data: preferences } = useQueryMyNotificationPreferencesSwr()
    const runGraphQL = useGraphQLWithToast()
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

    /** Mark a single notification read and navigate to its resolved target. */
    const onPressItem = useCallback(
        async (notification: QueryNotificationData) => {
            setOpen(false)
            // optimistically mark read in the local cache, then persist
            if (!notification.isRead) {
                await runGraphQL(
                    async () => {
                        const env = await mutateMarkNotificationAsRead({
                            request: { notificationId: notification.id },
                        })
                        return env.data!.markNotificationAsRead
                    },
                    { showSuccessToast: false, showErrorToast: false },
                )
                await mutate()
            }
            // resolve the snapshotted target into a route, then push to it
            const { target } = notification
            if (!target) {
                return
            }
            const response = await queryResolveRoute({
                request: { globalId: encodeNotificationGlobalId(target) },
            })
            const path = response.data?.resolveRoute?.data?.path
            if (path) {
                router.push(`/${locale}${path}`)
            }
        },
        [locale, mutate, router, runGraphQL],
    )

    /** Mark every unread notification read in one bulk action. */
    const onMarkAllRead = useCallback(
        async () => {
            await runGraphQL(
                async () => {
                    const env = await mutateMarkAllNotificationsAsRead({
                        request: undefined,
                    })
                    return env.data!.markAllNotificationsAsRead
                },
                { showSuccessToast: false, showErrorToast: true },
            )
            await mutate()
        },
        [mutate, runGraphQL],
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
                            const Icon = NOTIFICATION_TYPE_ICON[notification.type]
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
                                                {t(
                                                    notification.title.key,
                                                    notification.title.params ?? undefined,
                                                )}
                                            </span>
                                        </div>
                                        {notification.body ? (
                                            <span className="text-xs text-muted">
                                                {t(
                                                    notification.body.key,
                                                    notification.body.params ?? undefined,
                                                )}
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

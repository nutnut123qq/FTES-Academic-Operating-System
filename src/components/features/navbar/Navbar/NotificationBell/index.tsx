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
    Spinner,
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
import { mutateMarkAllNotificationsAsRead } from "@/modules/api/graphql/mutations/mutation-mark-all-notifications-as-read"
import { mutateMarkNotificationAsRead } from "@/modules/api/graphql/mutations/mutation-mark-notification-as-read"
import { queryResolveRoute } from "@/modules/api/graphql/queries/query-resolve-route"
import type { QueryNotificationData } from "@/modules/api/graphql/queries/types/notifications"
import { useQueryMyNotificationsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyNotificationsSwr"
import { useQueryMyNotificationPreferencesSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyNotificationPreferencesSwr"
import { useAppSelector } from "@/redux/hooks"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import { NOTIFICATION_TYPE_ICON } from "@/components/features/notification/typeIcon"
import { encodeNotificationGlobalId } from "@/components/features/notification/global-id"
import {
    deriveMutedAwareUnreadCount,
    filterNotificationsByPreferences,
} from "@/components/features/notification/preferences"
import { ListRow } from "@/components/blocks/lists/ListRow"
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
 * Reads the SAME real `myNotifications` query as the `/notifications` center
 * (shared badge SWR key {@link useQueryMyNotificationsSwr}) so the two never
 * diverge — polling drives freshness (non-realtime). Shows an unread badge
 * (hidden at zero), a header with a working "mark all read" action, the
 * {@link PREVIEW_COUNT} newest items (per-type icon + i18n text + relative time
 * + unread dot), and a footer link to the full center. Clicking an item marks
 * it read and routes to its resolved target. Muted types (and mute-all) are
 * filtered out and reflected in the badge. `"use client"` for the SWR hooks,
 * popover state and navigation.
 * @param props - optional root class name (placement only)
 */
export const NotificationBell = ({ className }: NotificationBellProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { data, isLoading, mutate } = useQueryMyNotificationsSwr()
    const { data: preferences } = useQueryMyNotificationPreferencesSwr()
    const runGraphQL = useGraphQLWithToast()
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

    /** Mark a single notification read and navigate to its resolved target. */
    const onPressItem = useCallback(
        async (notification: QueryNotificationData) => {
            setOpen(false)
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
    const onMarkAllRead = useCallback(async () => {
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
    }, [mutate, runGraphQL])

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
                    {/* body: muted hint / loading / newest items / empty */}
                    {muteAll ? (
                        <Typography
                            type="body-sm"
                            color="muted"
                            className="px-2 py-6 text-center"
                        >
                            {t("notifications.mutedHint")}
                        </Typography>
                    ) : isLoading && recent.length === 0 ? (
                        <div className="flex items-center justify-center px-2 py-6">
                            <Spinner size="sm" />
                        </div>
                    ) : recent.length === 0 ? (
                        <Typography
                            type="body-sm"
                            color="muted"
                            className="px-2 py-6 text-center"
                        >
                            {t("notificationCenter.empty")}
                        </Typography>
                    ) : (
                        <div className="flex flex-col px-2">
                            {recent.map((item, index) => {
                                const Icon = NOTIFICATION_TYPE_ICON[item.type]
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
                                        title={t(
                                            item.title.key,
                                            item.title.params ?? undefined,
                                        )}
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

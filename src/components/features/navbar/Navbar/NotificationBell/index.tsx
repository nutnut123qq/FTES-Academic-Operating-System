"use client"

import {
    BellIcon,
    ChecksIcon as CheckDoubleIcon,
    CircleIcon,
} from "@phosphor-icons/react"
import React, {
    useCallback,
    useMemo,
    useState,
} from "react"
import {
    Badge,
    Button,
    Header,
    Popover,
    PopoverContent,
    Typography,
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
import type { QueryNotificationData, QueryNotificationTargetData } from "@/modules/api/graphql/queries/types/notifications"
import { useQueryMyNotificationsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyNotificationsSwr"
import { useAppSelector } from "@/redux/hooks"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ListRow } from "@/components/blocks/lists/ListRow"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Largest unread count rendered verbatim on the badge before showing "9+". */
const MAX_BADGE = 9

/** Props for {@link NotificationBell}. */
export type NotificationBellProps = WithClassNames<undefined>

/**
 * Encode a notification target into the opaque global id the route index
 * expects: base64url of `"<entityName>:<id>"`.
 */
const encodeGlobalId = (target: QueryNotificationTargetData): string => {
    const raw = `${target.entityName}:${target.id}`
    // base64 → base64url (route index decodes base64url(`<entityName>:<id>`))
    return btoa(raw)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")
}

/**
 * NotificationBell — navbar bell with an unread-count badge and a popover list.
 *
 * Self-contained container: fetches its own notification page (newest first) +
 * unread count, renders the badge (hidden when zero), and on open shows the
 * recent items (via the {@link ListRow} block) with an i18n title and relative
 * time. Clicking an item marks it read and routes to its resolved target; the
 * header action marks all read. `"use client"` for the SWR hook, popover state
 * and navigation.
 * @param props - optional root class name (placement only)
 */
export const NotificationBell = ({ className }: NotificationBellProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { data, isLoading, error, mutate } = useQueryMyNotificationsSwr()
    const runGraphQL = useGraphQLWithToast()
    const [isOpen, setOpen] = useState(false)

    const items = data?.items ?? []
    const unreadCount = data?.unreadCount ?? 0

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
                request: { globalId: encodeGlobalId(target) },
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
            <PopoverContent placement="bottom right" className="w-[360px]">
                <div className="py-1 px-2">
                    {/* header: title + bulk "mark all read" action */}
                    <div className="flex items-center justify-between gap-3">
                    
                        <Header>{t("notifications.title")}</Header>
                        {unreadCount > 0 ? (
                            <Button
                                isIconOnly
                                variant="ghost"
                                size="sm"
                                aria-label={t("notifications.markAllRead")}
                                onPress={onMarkAllRead}
                            >
                                <CheckDoubleIcon className="size-5" />
                            </Button>
                        ) : null}
                    </div>
                    {/* body: async switch — skeleton MIRRORS the list (debug holds 3s) */}
                    <AsyncContent
                        isLoading={isLoading && items.length === 0}
                        skeleton={(
                            <div className="flex flex-col">
                                {[0, 1, 2].map((row) => (
                                    <Skeleton.ListRow key={row} />
                                ))}
                            </div>
                        )}
                        isEmpty={items.length === 0}
                        emptyContent={{
                            title: t("notifications.empty"),
                        }}
                        error={error}
                        errorContent={{
                            title: t("notifications.loadError"),
                            onRetry: () => { void mutate() },
                            retryLabel: t("notifications.retry"),
                        }}
                    >
                        <div className="flex max-h-[420px] flex-col overflow-y-auto">
                            {items.map((notification, index) => (
                                <ListRow
                                    key={notification.id}
                                    leading={!notification.isRead ? (
                                        <CircleIcon
                                            weight="fill"
                                            aria-hidden
                                            focusable="false"
                                            className="size-2 text-accent"
                                        />
                                    ) : undefined}
                                    title={t(
                                        notification.title.key,
                                        notification.title.params ?? undefined,
                                    )}
                                    subtitle={notification.body
                                        ? t(
                                            notification.body.key,
                                            notification.body.params ?? undefined,
                                        )
                                        : undefined}
                                    meta={(
                                        <Typography type="body-xs" color="muted">
                                            {formatRelative(notification.createdAt)}
                                        </Typography>
                                    )}
                                    onPress={() => onPressItem(notification)}
                                    divider={index < items.length - 1}
                                />
                            ))}
                        </div>
                    </AsyncContent>
                </div>
            </PopoverContent>
        </Popover>
    )
}

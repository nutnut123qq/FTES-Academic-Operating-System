"use client"

import React, {
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
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "@/i18n/navigation"
import { pathConfig } from "@/resources/path"
import { useQueryNotificationsSwr } from "@/components/features/notification/hooks/useQueryNotificationsSwr"
import { NOTIFICATION_TYPE_ICON } from "@/components/features/notification/typeIcon"
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
 * Reads the same FE mock feed as the `/notifications` center
 * ({@link useQueryNotificationsSwr}) so the two never diverge: shows an unread
 * badge (hidden at zero), a header with a "mark all read" link, the
 * {@link PREVIEW_COUNT} newest items (type icon + text + relative time + unread
 * dot), and a footer link to the full center. Mark-all is a local visual clear
 * (no mock mutation endpoint yet). `"use client"` for the SWR hook, popover
 * state and navigation.
 * @param props - optional root class name (placement only)
 */
export const NotificationBell = ({ className }: NotificationBellProps) => {
    const t = useTranslations()
    const router = useRouter()
    const { notifications } = useQueryNotificationsSwr()
    const [isOpen, setOpen] = useState(false)
    // FE-only mock: no mark-read endpoint — "mark all read" clears unread visually.
    const [allRead, setAllRead] = useState(false)

    const recent = useMemo(
        () => notifications.slice(0, PREVIEW_COUNT),
        [notifications],
    )
    const unreadCount = allRead
        ? 0
        : notifications.filter((item) => !item.read).length

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
                    {/* header: title + "mark all read" link */}
                    <div className="flex items-center justify-between gap-3 px-2 py-1">
                        <Header>{t("notificationCenter.title")}</Header>
                        {unreadCount > 0 ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onPress={() => setAllRead(true)}
                            >
                                {t("notificationCenter.markAllRead")}
                            </Button>
                        ) : null}
                    </div>
                    {/* body: the newest items, or an all-caught-up empty line */}
                    {recent.length === 0 ? (
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
                                const unread = !item.read && !allRead
                                return (
                                    <ListRow
                                        key={item.id}
                                        leading={(
                                            <div className="flex size-9 items-center justify-center rounded-large bg-accent/10 text-accent">
                                                <Icon className="size-5" aria-hidden />
                                            </div>
                                        )}
                                        title={item.text}
                                        meta={(
                                            <div className="flex items-center gap-2">
                                                <Typography type="body-xs" color="muted">
                                                    {item.time}
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

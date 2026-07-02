"use client"

import React, { useState } from "react"
import {
    AtIcon,
    BellIcon,
    CalendarDotsIcon,
    ClockCountdownIcon,
    CoinIcon,
    GraduationCapIcon,
    LightningIcon,
    UsersThreeIcon,
} from "@phosphor-icons/react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    type NotificationType,
    useQueryNotificationsSwr,
} from "../hooks/useQueryNotificationsSwr"

/** Filter options: everything, or unread only. */
type Filter = "all" | "unread"

/** Icon per notification type — accent-tinted circle in the row leading slot. */
const TYPE_ICON: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
    mention: AtIcon,
    course: GraduationCapIcon,
    event: CalendarDotsIcon,
    deadline: ClockCountdownIcon,
    challenge: LightningIcon,
    coin: CoinIcon,
    group: UsersThreeIcon,
}

/**
 * Notification center (§15) — the `/notifications` feed. Title + subtitle, an
 * all/unread filter, a list of notification rows (type icon, text, relative time,
 * unread accent), a mock "mark all read" action, and an empty state. Feature owns
 * data (mock) + filter; tokens own the look. ponytail: hand-rolled rows, useState
 * filter, no real mutation — "mark all read" is a no-op placeholder.
 */
export const NotificationCenter = () => {
    const t = useTranslations("notificationCenter")
    const { notifications } = useQueryNotificationsSwr()
    const [filter, setFilter] = useState<Filter>("all")

    const filtered = notifications.filter((item) => filter === "all" || !item.read)
    const hasUnread = notifications.some((item) => !item.read)

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            {/* header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <BellIcon className="size-6 text-accent" aria-hidden />
                        <Typography type="h4" weight="bold">
                            {t("title")}
                        </Typography>
                    </div>
                    <Typography type="body-sm" color="muted">
                        {t("subtitle")}
                    </Typography>
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    isDisabled={!hasUnread}
                    // ponytail: mock — no mutation endpoint yet; visual affordance only.
                    onPress={() => undefined}
                >
                    {t("markAllRead")}
                </Button>
            </div>

            {/* filter */}
            <div className="flex flex-wrap gap-2">
                {(["all", "unread"] as Array<Filter>).map((option) => (
                    <Button
                        key={option}
                        size="sm"
                        variant={filter === option ? "secondary" : "ghost"}
                        onPress={() => setFilter(option)}
                    >
                        {t(option)}
                    </Button>
                ))}
            </div>

            {/* list */}
            {filtered.length === 0 ? (
                <Typography type="body-sm" color="muted">
                    {t("empty")}
                </Typography>
            ) : (
                <ul className="flex flex-col gap-2">
                    {filtered.map((item) => {
                        const Icon = TYPE_ICON[item.type]
                        return (
                            <li
                                key={item.id}
                                className={`flex items-start gap-3 rounded-large border border-separator p-4 ${
                                    item.read ? "" : "bg-default/40"
                                }`}
                            >
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
                                    <Icon className="size-5" aria-hidden />
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                    <Typography type="body-sm" className="text-foreground">
                                        {item.text}
                                    </Typography>
                                    <div className="flex items-center gap-2">
                                        <Typography type="body-xs" color="muted">
                                            {t(`types.${item.type}`)}
                                        </Typography>
                                        <span className="text-muted" aria-hidden>
                                            ·
                                        </span>
                                        <Typography type="body-xs" color="muted">
                                            {item.time}
                                        </Typography>
                                    </div>
                                </div>
                                {!item.read && (
                                    <span
                                        className="mt-1.5 size-2 shrink-0 rounded-full bg-accent"
                                        aria-label={t("unread")}
                                    />
                                )}
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}

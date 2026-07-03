"use client"

import React, { useMemo } from "react"
import { BellSlashIcon, DeviceMobileIcon } from "@phosphor-icons/react"
import { Spinner, Switch } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { NotificationType } from "@/modules/api/graphql/queries/types/notifications"
import type { QueryNotificationPreferencesData } from "@/modules/api/graphql/queries/types/notification-preferences"
import { useQueryMyNotificationPreferencesSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyNotificationPreferencesSwr"
import { useMutateUpdateNotificationPreferencesSwr } from "@/hooks/swr/api/graphql/mutations/useMutateUpdateNotificationPreferencesSwr"
import { NOTIFICATION_TYPES } from "../../preferences"
import { NOTIFICATION_TYPE_ICON } from "../../typeIcon"

/**
 * PreferencesSurface — the notification-preferences section of the
 * `/notifications` page (opened from the header gear). Renders a master
 * "mute all" switch, one toggle per real {@link NotificationType} (disabled
 * while mute-all is on), and a reserved-but-disabled "browser push — coming
 * soon" row (Web Push is deferred: no service worker, no permission prompt, no
 * subscription — see the change design D6). Preferences are read + written
 * through the (mock) preferences query/mutation; every write persists the full
 * `{ mutedTypes, muteAll }` state and revalidates the read hook so the bell,
 * center and badge react on the next render.
 */
export const PreferencesSurface = () => {
    const t = useTranslations()
    const { data, isLoading, mutate } = useQueryMyNotificationPreferencesSwr()
    const { trigger, isMutating } = useMutateUpdateNotificationPreferencesSwr()

    const preferences: QueryNotificationPreferencesData = useMemo(
        () => data ?? { mutedTypes: [], muteAll: false },
        [data],
    )
    const mutedSet = useMemo(
        () => new Set(preferences.mutedTypes),
        [preferences.mutedTypes],
    )

    /** Persist a new preferences state and revalidate the read hook. */
    const save = async (next: QueryNotificationPreferencesData) => {
        await trigger(next)
        await mutate()
    }

    /** Flip a single type's muted state (a type is "on" when NOT muted). */
    const onToggleType = (type: NotificationType, enabled: boolean) => {
        const nextMuted = new Set(mutedSet)
        if (enabled) {
            nextMuted.delete(type)
        } else {
            nextMuted.add(type)
        }
        void save({
            mutedTypes: Array.from(nextMuted),
            muteAll: preferences.muteAll,
        })
    }

    /** Flip the master mute-all switch. */
    const onToggleMuteAll = (muteAll: boolean) => {
        void save({ mutedTypes: preferences.mutedTypes, muteAll })
    }

    if (isLoading && !data) {
        return (
            <div className="flex items-center justify-center rounded-large border border-separator p-6">
                <Spinner size="sm" />
            </div>
        )
    }

    return (
        <section
            aria-label={t("notifications.preferences.title")}
            className="flex flex-col gap-3 rounded-2xl border border-separator p-4"
        >
            <div className="flex flex-col gap-0">
                <span className="text-sm font-semibold text-foreground">
                    {t("notifications.preferences.title")}
                </span>
                <span className="text-xs text-muted">
                    {t("notifications.preferences.subtitle")}
                </span>
            </div>

            {/* master mute-all switch */}
            <div className="flex items-center justify-between gap-3 rounded-large bg-default/40 p-3">
                <div className="flex items-center gap-3">
                    <BellSlashIcon
                        className="size-5 text-muted"
                        aria-hidden
                        focusable="false"
                    />
                    <div className="flex flex-col gap-0">
                        <span className="text-sm font-medium text-foreground">
                            {t("notifications.preferences.muteAll")}
                        </span>
                        <span className="text-xs text-muted">
                            {t("notifications.preferences.muteAllHint")}
                        </span>
                    </div>
                </div>
                <Switch
                    isSelected={preferences.muteAll}
                    isDisabled={isMutating}
                    onChange={onToggleMuteAll}
                    aria-label={t("notifications.preferences.muteAll")}
                >
                    <Switch.Control>
                        <Switch.Thumb />
                    </Switch.Control>
                </Switch>
            </div>

            {/* per-type toggles */}
            <div className="flex flex-col gap-1">
                {NOTIFICATION_TYPES.map((type) => {
                    const Icon = NOTIFICATION_TYPE_ICON[type]
                    const enabled = !mutedSet.has(type)
                    const label = t(`notifications.preferences.types.${type}`)
                    return (
                        <div
                            key={type}
                            className="flex items-center justify-between gap-3 py-1.5"
                        >
                            <div className="flex items-center gap-3">
                                <Icon
                                    className="size-5 text-muted"
                                    aria-hidden
                                    focusable="false"
                                />
                                <span className="text-sm text-foreground">{label}</span>
                            </div>
                            <Switch
                                isSelected={enabled}
                                isDisabled={preferences.muteAll || isMutating}
                                onChange={(value) => onToggleType(type, value)}
                                aria-label={label}
                            >
                                <Switch.Control>
                                    <Switch.Thumb />
                                </Switch.Control>
                            </Switch>
                        </div>
                    )
                })}
            </div>

            {/* reserved (disabled) browser-push opt-in — Web Push deferred (D6) */}
            <div className="flex items-center justify-between gap-3 rounded-large border border-dashed border-separator p-3 opacity-70">
                <div className="flex items-center gap-3">
                    <DeviceMobileIcon
                        className="size-5 text-muted"
                        aria-hidden
                        focusable="false"
                    />
                    <div className="flex flex-col gap-0">
                        <span className="text-sm font-medium text-foreground">
                            {t("notifications.preferences.browserPush")}
                        </span>
                        <span className="text-xs text-muted">
                            {t("notifications.preferences.browserPushComingSoon")}
                        </span>
                    </div>
                </div>
                <Switch
                    isSelected={false}
                    isDisabled
                    aria-label={t("notifications.preferences.browserPush")}
                >
                    <Switch.Control>
                        <Switch.Thumb />
                    </Switch.Control>
                </Switch>
            </div>
        </section>
    )
}

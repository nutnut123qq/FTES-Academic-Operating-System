"use client"

import React, { useMemo } from "react"
import { BellSlashIcon, DeviceMobileIcon } from "@phosphor-icons/react"
import { Spinner, Switch, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { NotificationType } from "@/modules/api/graphql/queries/types/notifications"
import type { QueryNotificationPreferencesData } from "@/modules/api/graphql/queries/types/notification-preferences"
import { useGetNotificationPreferencesSwr } from "@/hooks/swr/api/rest/queries/useGetNotificationPreferencesSwr"
import { usePostPutNotificationPreferencesSwr } from "@/hooks/swr/api/rest/mutations/usePostPutNotificationPreferencesSwr"
import { useRestWithToast } from "@/modules/toast/hooks"
import { NOTIFICATION_TYPES } from "../../preferences"
import { NOTIFICATION_TYPE_ICON } from "../../typeIcon"

/**
 * PreferencesSurface — the notification-preferences section of the
 * `/notifications` page (opened from the header gear). Renders a master
 * "mute all" switch, one toggle per real {@link NotificationType} (disabled
 * while mute-all is on), and a reserved-but-disabled "browser push — coming
 * soon" row (Web Push is deferred: no service worker, no permission prompt, no
 * subscription — see the change design D6). Preferences are read + written
 * through the real BE REST API (`GET/PUT /api/v1/notifications/preferences`,
 * IN_APP column of the matrix); every write is OPTIMISTIC — the shared SWR
 * cache flips immediately (bell, center and badge react at once) and rolls
 * back with an error toast when the PUT fails.
 */
export const PreferencesSurface = () => {
    const t = useTranslations()
    const runRest = useRestWithToast()
    const { data, isLoading, mutate } = useGetNotificationPreferencesSwr()
    const { trigger, isMutating } = usePostPutNotificationPreferencesSwr()

    const preferences: QueryNotificationPreferencesData = useMemo(
        () => data ?? { mutedTypes: [], muteAll: false },
        [data],
    )
    const mutedSet = useMemo(
        () => new Set(preferences.mutedTypes),
        [preferences.mutedTypes],
    )

    /**
     * Persist a new preferences state optimistically: the shared cache flips to
     * `next` right away, is repopulated with the PUT response on success, and
     * rolls back to the previous state (with an error toast) on failure.
     */
    const save = async (next: QueryNotificationPreferencesData) => {
        await runRest(
            () =>
                mutate(() => trigger(next), {
                    optimisticData: next,
                    populateCache: true,
                    rollbackOnError: true,
                    revalidate: false,
                }),
            { showSuccessToast: false, showErrorToast: true },
        )
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
            <div className="flex items-center justify-center rounded-2xl border border-separator p-6">
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
                <Typography type="body-sm" weight="semibold">
                    {t("notifications.preferences.title")}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {t("notifications.preferences.subtitle")}
                </Typography>
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
                        <Typography type="body-sm" weight="medium">
                            {t("notifications.preferences.muteAll")}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {t("notifications.preferences.muteAllHint")}
                        </Typography>
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
            <div className="flex flex-col gap-0">
                {NOTIFICATION_TYPES.map((type) => {
                    const Icon = NOTIFICATION_TYPE_ICON[type]
                    const enabled = !mutedSet.has(type)
                    const label = t(`notifications.preferences.types.${type}`)
                    return (
                        <div
                            key={type}
                            className="flex items-center justify-between gap-3 py-2"
                        >
                            <div className="flex items-center gap-3">
                                <Icon
                                    className="size-5 text-muted"
                                    aria-hidden
                                    focusable="false"
                                />
                                <Typography type="body-sm">{label}</Typography>
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
                        <Typography type="body-sm" weight="medium">
                            {t("notifications.preferences.browserPush")}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {t("notifications.preferences.browserPushComingSoon")}
                        </Typography>
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

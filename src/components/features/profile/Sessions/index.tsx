"use client"

import {
    SignOutIcon,
    DesktopIcon,
    DeviceMobileIcon,
} from "@phosphor-icons/react"
import React, {
    useCallback,
    useState,
} from "react"
import {
    Button,
    Card,
    CardContent,
    Chip,
    Spinner,
    Typography,
} from "@heroui/react"
import {
    SettingsBreadcrumb,
} from "../Settings/SettingsBreadcrumb"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryMySessionsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMySessionsSwr"
import { useMutateRevokeSessionSwr } from "@/hooks/swr/api/graphql/mutations/useMutateRevokeSessionSwr"
import type { LoginSession } from "@/modules/api/graphql/queries/types/my-sessions"
import { useGraphQLWithToast } from "@/modules/toast/hooks"

/**
 * Sessions / devices feature container.
 *
 * Lists the current user's active login sessions (devices) and lets them log
 * out any device except the one making the request. Owns the page chrome
 * (breadcrumb + header) and the loading gate; revoking optimistically
 * revalidates the list. Mounted by `/profile/sessions`.
 */
export const Sessions = () => {
    const t = useTranslations()
    const locale = useLocale()
    const {
        data: sessions,
        isLoading,
        error,
        mutate,
    } = useQueryMySessionsSwr()
    const { trigger: triggerRevoke } = useMutateRevokeSessionSwr()
    const runGraphQL = useGraphQLWithToast()

    // the session id currently being revoked (drives the per-row spinner)
    const [revokingId, setRevokingId] = useState<string | null>(null)


    /** Revoke a device session, then revalidate the list. */
    const onRevoke = useCallback(
        async (sessionId: string) => {
            setRevokingId(sessionId)
            try {
                const ok = await runGraphQL(async () => {
                    // `triggerRevoke` returns the raw Apollo result; unwrap the
                    // standard `{ success, message }` payload for the toast helper.
                    const result = await triggerRevoke({ sessionId })
                    return result.data!.revokeSession
                })
                if (ok) {
                    // refresh so the logged-out device drops off the list
                    await mutate()
                }
            } finally {
                setRevokingId(null)
            }
        },
        [
            runGraphQL,
            triggerRevoke,
            mutate,
        ],
    )

    /** Format an ISO timestamp as `HH:mm MMM DD, YYYY` (24h time + short month). */
    const formatSeen = useCallback(
        (iso: string) => {
            // tolerate a bad/missing date rather than throwing in render
            const date = new Date(iso)
            if (Number.isNaN(date.getTime())) {
                return ""
            }
            const hh = String(date.getHours()).padStart(2, "0")
            const mm = String(date.getMinutes()).padStart(2, "0")
            const month = date.toLocaleString(locale, { month: "short" })
            const day = String(date.getDate()).padStart(2, "0")
            return `${hh}:${mm} ${month} ${day}, ${date.getFullYear()}`
        },
        [
            locale,
        ],
    )

    const sessionList = sessions ?? []

    return (
        <div className="flex flex-col gap-10">
            <PageHeader
                breadcrumb={<SettingsBreadcrumb current={t("sessions.title")} />}
                title={t("sessions.title")}
                description={t("sessions.subtitle")}
            />

            <AsyncContent
                isLoading={isLoading && !sessions}
                skeleton={(
                    <div className="flex flex-col gap-3">
                        {[0, 1, 2].map((row) => (
                            <Skeleton key={row} className="h-20 w-full rounded-2xl" />
                        ))}
                    </div>
                )}
                isEmpty={sessionList.length === 0}
                emptyContent={{ title: t("sessions.empty") }}
                error={error}
                errorContent={{
                    title: t("sessions.empty"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("sessions.revoke"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {sessionList.map((session: LoginSession) => {
                        // pick a device glyph from the coarse device class
                        const isMobile =
                            session.deviceType === "mobile"
                            || session.deviceType === "tablet"
                        const DeviceIcon = isMobile ? DeviceMobileIcon : DesktopIcon
                        // headline = "Browser on OS", falling back gracefully
                        const headline = [
                            session.browser,
                            session.os,
                        ]
                            .filter(Boolean)
                            .join(" • ") || t("sessions.unknownDevice")
                        return (
                            <Card key={session.id}>
                                <CardContent>
                                    <div className="flex items-center gap-3">
                                        <DeviceIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                                        <div className="flex min-w-0 flex-1 flex-col gap-0">
                                            {/* device name + "this device" chip right next to it */}
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Typography type="body-sm" weight="medium" truncate>
                                                    {headline}
                                                </Typography>
                                                {session.current ? (
                                                    <Chip color="accent" variant="soft" size="sm">
                                                        <Chip.Label>{t("sessions.thisDevice")}</Chip.Label>
                                                    </Chip>
                                                ) : null}
                                            </div>
                                            {/* meta: location · ip · last seen */}
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                                {session.location ? (
                                                    <Typography type="body-xs" color="muted">{session.location}</Typography>
                                                ) : null}
                                                {session.ipAddress ? (
                                                    <Typography type="body-xs" color="muted">{session.ipAddress}</Typography>
                                                ) : null}
                                                <Typography type="body-xs" color="muted">{formatSeen(session.lastSeenAt)}</Typography>
                                            </div>
                                        </div>
                                        {!session.current ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="ml-auto shrink-0 text-danger"
                                                isDisabled={revokingId === session.sessionId}
                                                onPress={() => onRevoke(session.sessionId)}
                                                aria-label={t("sessions.revoke")}
                                            >
                                                {revokingId === session.sessionId ? (
                                                    <Spinner color="current" size="sm" />
                                                ) : (
                                                    <SignOutIcon aria-hidden focusable="false" className="size-5" />
                                                )}
                                                {t("sessions.revoke")}
                                            </Button>
                                        ) : null}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </AsyncContent>
        </div>
    )
}

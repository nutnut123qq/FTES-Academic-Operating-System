"use client"

import React, { useMemo } from "react"
import { Button, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { DevicesIcon, MonitorIcon } from "@phosphor-icons/react"
import type { SessionView } from "@/modules/api/rest/identity"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ListRow } from "@/components/blocks/lists/ListRow"
import { StatusChip } from "@/components/blocks/chips/StatusChip"
import { useGetSessionsSwr } from "@/hooks/swr/api/rest/queries/useGetSessionsSwr"
import { useSessionRevokeOverlayState } from "@/hooks/zustand/overlay/hooks"
import {
    joinSessionMeta,
    partitionSessions,
    resolveSessionDeviceLabel,
} from "../utils/sessions"
import { DevicesSectionSkeleton } from "./skeleton"

/**
 * DevicesSection — every session currently signed in to the account
 * (`GET /identity/sessions`), with what identifies it (device, IP, last use) and the
 * two sign-out actions.
 *
 * SESSIONS, not devices, back this list on purpose. `SecurityDeviceView`
 * (`GET /identity/devices`) is a longer-lived record that survives sign-out and exists
 * for device TRUST, so it would list machines the learner is no longer signed in on;
 * `SessionView` is exactly "signed in right now", carries the `current` flag that marks
 * this device, and its `sid` is what the revoke endpoints take.
 *
 * The current session is shown but never offers a per-row sign-out — ending your own
 * session by mis-clicking a row is not a thing a settings page should allow. Both
 * destructive actions confirm first through the global `SessionRevokeModal`, which owns
 * the mutation and revalidates this list.
 */
export const DevicesSection = () => {
    const t = useTranslations()
    const locale = useLocale()
    const swr = useGetSessionsSwr()
    const { open: openRevokeConfirm } = useSessionRevokeOverlayState()

    const { current, others } = useMemo(
        () => partitionSessions(swr.data ?? []),
        [swr.data],
    )

    /** Locale-aware absolute timestamp for the "last used" line. */
    const dateTimeFormat = useMemo(
        () => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }),
        [locale],
    )

    /** Secondary line of a row: IP · last use, skipping whatever the backend omitted. */
    const metaFor = (session: SessionView): string => {
        const usedAt = session.lastUsedAt ?? session.createdAt
        return joinSessionMeta([
            session.ip,
            usedAt
                ? t("sessions.lastUsed", { at: dateTimeFormat.format(new Date(usedAt)) })
                : undefined,
        ])
    }

    /** Render one session row; only non-current rows get a sign-out button. */
    const renderSession = (session: SessionView, isCurrent: boolean) => {
        const deviceLabel = resolveSessionDeviceLabel(session, t("sessions.unknownDevice"))
        return (
            <ListRow
                key={session.sid}
                leading={
                    <MonitorIcon className="size-5 text-muted" aria-hidden focusable="false" />
                }
                title={deviceLabel}
                subtitle={metaFor(session)}
                meta={
                    isCurrent ? (
                        <StatusChip tone="accent">{t("sessions.thisDevice")}</StatusChip>
                    ) : undefined
                }
                trailing={
                    isCurrent ? undefined : (
                        <Button
                            size="sm"
                            variant="tertiary"
                            onPress={() =>
                                openRevokeConfirm({
                                    scope: "one",
                                    sid: session.sid,
                                    deviceLabel,
                                })
                            }
                        >
                            {t("sessions.revoke")}
                        </Button>
                    )
                }
            />
        )
    }

    return (
        <SectionCard
            title={t("sessions.title")}
            icon={<DevicesIcon className="size-5 text-muted" aria-hidden focusable="false" />}
            action={
                others.length > 0 ? (
                    <Button
                        size="sm"
                        variant="danger"
                        onPress={() => openRevokeConfirm({ scope: "others" })}
                    >
                        {t("sessions.revokeOthers")}
                    </Button>
                ) : undefined
            }
        >
            <Typography type="body-sm" color="muted">
                {t("sessions.subtitle")}
            </Typography>

            <AsyncContent
                isLoading={!swr.data && !swr.error}
                skeleton={<DevicesSectionSkeleton />}
                isEmpty={(swr.data ?? []).length === 0}
                emptyContent={{ title: t("sessions.empty") }}
                error={!swr.data ? swr.error : undefined}
                errorContent={{
                    title: t("sessions.loadError"),
                    onRetry: () => {
                        void swr.mutate()
                    },
                    retryLabel: t("security.retry"),
                }}
            >
                <div className="flex flex-col gap-0">
                    {current ? renderSession(current, true) : null}
                    {others.map((session) => renderSession(session, false))}
                </div>
            </AsyncContent>
        </SectionCard>
    )
}

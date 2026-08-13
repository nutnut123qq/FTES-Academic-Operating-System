"use client"

import React, { useState } from "react"
import { Button, Chip, Typography, toast } from "@heroui/react"
import { useFormatter, useTranslations } from "next-intl"
import { DeviceMobileIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { SessionView } from "@/modules/api/rest/identity"
import { useGetSessionsSwr } from "@/hooks/swr/api/rest/queries/useGetSessionsSwr"
import { usePostRevokeSessionSwr } from "@/hooks/swr/api/rest/mutations/usePostRevokeSessionSwr"

/** Two placeholder rows mirroring the real row layout (icon + 2 lines + action). */
const SessionsSkeleton = () => (
    <div className="flex flex-col gap-0">
        {[0, 1].map((index) => (
            <div key={index} className="flex items-center gap-3 py-2">
                <Skeleton.Avatar size="sm" className="shrink-0" />
                <div className="min-w-0 flex-1">
                    <Skeleton.Typography type="body-sm" width="1/2" />
                    <Skeleton.Typography type="body-xs" width="1/3" />
                </div>
            </div>
        ))}
    </div>
)

/**
 * SessionsCard — "quản lý các thiết bị đang đăng nhập" of the security section,
 * backed by the real session endpoints (`GET /api/v1/identity/sessions`,
 * `DELETE /api/v1/identity/sessions/{sid}`).
 *
 * SESSIONS, not "trusted devices": `/identity/devices` is a different concept
 * (device trust for step-up auth) and holds nothing that can be signed out — a
 * session can, which is the whole point of this card.
 *
 * The row for the session making the request (`current`) is marked and has NO
 * revoke button: revoking it would sign the user out of the page they are
 * standing on. Signing out is deliberately per-session here; the bulk revoke is
 * a side effect of changing the password, which the BE performs on its own.
 */
export const SessionsCard = () => {
    const t = useTranslations("sessions")
    const format = useFormatter()
    const { data, isLoading, error, mutate } = useGetSessionsSwr()
    const { trigger } = usePostRevokeSessionSwr()
    // per-row pending state — the hook's `isMutating` is shared by every row
    const [revokingSid, setRevokingSid] = useState<string | null>(null)

    const sessions = data ?? []

    const onRevoke = async (sid: string) => {
        setRevokingSid(sid)
        try {
            await trigger(sid)
        } catch {
            toast.danger(t("revokeFailed"))
            return
        } finally {
            setRevokingSid(null)
        }
        toast.success(t("revokeSuccess"))
        await mutate()
    }

    /** Second line of a row: IP and last-activity time, whichever the BE returned. */
    const renderMeta = (session: SessionView) => {
        const parts: Array<string> = []
        if (session.ip) {
            parts.push(session.ip)
        }
        if (session.lastUsedAt) {
            parts.push(
                t("lastUsed", {
                    date: format.dateTime(new Date(session.lastUsedAt), {
                        dateStyle: "medium",
                        timeStyle: "short",
                    }),
                }),
            )
        }
        if (parts.length === 0) {
            return null
        }
        return (
            <Typography type="body-xs" color="muted">
                {parts.join(" · ")}
            </Typography>
        )
    }

    return (
        <section className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <div className="flex flex-col gap-0">
                <Typography type="body-sm" weight="semibold">
                    {t("title")}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

            <AsyncContent
                isLoading={isLoading && sessions.length === 0}
                skeleton={<SessionsSkeleton />}
                isEmpty={sessions.length === 0}
                emptyContent={{ title: t("empty") }}
                error={sessions.length === 0 ? error : undefined}
                errorContent={{
                    title: t("loadFailed"),
                    onRetry: () => void mutate(),
                    retryLabel: t("retry"),
                }}
            >
                <div className="flex flex-col gap-0">
                    {sessions.map((session) => (
                        <div
                            key={session.sid}
                            className="flex items-center justify-between gap-3 py-2"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <DeviceMobileIcon
                                    className="size-5 shrink-0 text-muted"
                                    aria-hidden
                                    focusable="false"
                                />
                                <div className="flex min-w-0 flex-col gap-0">
                                    <div className="flex items-center gap-2">
                                        <Typography type="body-sm" className="truncate">
                                            {session.deviceInfo || t("unknownDevice")}
                                        </Typography>
                                        {session.current ? (
                                            <Chip size="sm" variant="soft" color="accent">
                                                <Chip.Label>{t("thisDevice")}</Chip.Label>
                                            </Chip>
                                        ) : null}
                                    </div>
                                    {renderMeta(session)}
                                </div>
                            </div>
                            {session.current ? null : (
                                <Button
                                    size="sm"
                                    variant="tertiary"
                                    className="shrink-0"
                                    isDisabled={revokingSid !== null}
                                    isPending={revokingSid === session.sid}
                                    onPress={() => void onRevoke(session.sid)}
                                >
                                    {t("revoke")}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </AsyncContent>
        </section>
    )
}

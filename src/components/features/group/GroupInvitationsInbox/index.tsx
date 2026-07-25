"use client"

import React, { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage, Button, Typography } from "@heroui/react"
import { useFormatter, useTranslations } from "next-intl"
import type { GroupMyInvitation } from "@/modules/api/rest/group"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useRestWithToast } from "@/modules/toast/hooks"
import { usePostRespondToInvitationSwr } from "@/hooks/swr/api/rest/mutations/usePostRespondToInvitationSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { Link } from "@/i18n/navigation"
import { useQueryMyInvitationsSwr } from "./useQueryMyInvitationsSwr"

/** Loading skeleton — mirrors one invitation row (avatar + two text lines + actions). */
const InvitationsSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1].map((index) => (
            <div
                key={index}
                className="flex items-center gap-3 rounded-2xl border border-separator p-4"
            >
                <Skeleton.Avatar size="md" className="shrink-0" />
                <div className="min-w-0 flex-1">
                    <Skeleton.Typography type="body-sm" width="1/2" />
                    <Skeleton.Typography type="body-xs" width="1/3" />
                </div>
            </div>
        ))}
    </div>
)

/** Newest-first ordering the BE returns; used to put a rolled-back row back in place. */
const byNewest = (a: GroupMyInvitation, b: GroupMyInvitation) =>
    b.createdAt.localeCompare(a.createdAt)

/** Props for {@link GroupInvitationsInbox}. */
export interface GroupInvitationsInboxProps {
    /**
     * Fired after a successful answer — e.g. the groups list revalidates because an
     * ACCEPT just added the viewer to a group.
     */
    onResponded?: (action: "ACCEPT" | "DECLINE") => void
}

/**
 * Invitation inbox (`GET /invitations/me`): every group the viewer has been invited
 * to, with the inviter and the deadline, answered in place through
 * `POST /invitations/{invitationId}/respond`.
 *
 * Each row is removed OPTIMISTICALLY on press and put back — into the list as it
 * stands at that moment, not a stale snapshot — when the write fails, so a 404/409
 * (invitation withdrawn or already answered) never leaves a phantom row behind.
 * The endpoint is caller-scoped: guests get no inbox at all.
 *
 * @param props - {@link GroupInvitationsInboxProps}
 */
export const GroupInvitationsInbox = ({ onResponded }: GroupInvitationsInboxProps) => {
    const t = useTranslations("groupsHub")
    const format = useFormatter()
    const runRest = useRestWithToast()
    const { guard } = useRequireAuth()
    const { invitations, isLoading, error, mutate, authenticated } =
        useQueryMyInvitationsSwr()
    const { trigger } = usePostRespondToInvitationSwr()
    const [respondingId, setRespondingId] = useState<string | null>(null)

    if (!authenticated) {
        return null
    }

    const onRespond = async (
        invitation: GroupMyInvitation,
        action: "ACCEPT" | "DECLINE",
    ) => {
        if (respondingId !== null) {
            return
        }
        setRespondingId(invitation.invitationId)
        // optimistic: the row leaves immediately
        await mutate(
            (current) =>
                (current ?? []).filter(
                    (row) => row.invitationId !== invitation.invitationId,
                ),
            { revalidate: false },
        )
        const ok = await runRest(
            () => trigger({ id: invitation.invitationId, request: { action } }),
            {
                successMessage:
                    action === "ACCEPT" ? t("invitation.accepted") : t("invitation.declined"),
            },
        )
        if (ok === null) {
            // rollback against the list as it is NOW (a revalidate may have landed
            // meanwhile), and never duplicate a row that came back on its own
            await mutate(
                (current) => {
                    const rows = current ?? []
                    return rows.some(
                        (row) => row.invitationId === invitation.invitationId,
                    )
                        ? rows
                        : [...rows, invitation].sort(byNewest)
                },
                { revalidate: false },
            )
        } else {
            onResponded?.(action)
        }
        setRespondingId(null)
    }

    return (
        <section className="flex flex-col gap-3">
            <Typography type="h6" weight="bold">
                {t("invitations.title")}
            </Typography>

            <AsyncContent
                isLoading={isLoading && invitations.length === 0}
                skeleton={<InvitationsSkeleton />}
                isEmpty={invitations.length === 0}
                emptyContent={{ title: t("invitations.empty") }}
                error={invitations.length === 0 ? error : undefined}
                errorContent={{
                    title: t("invitations.error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("states.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {invitations.map((invitation) => {
                        const inviterName =
                            invitation.inviter?.displayName ??
                            invitation.inviter?.username ??
                            null
                        const isResponding = respondingId === invitation.invitationId
                        return (
                            <div
                                key={invitation.invitationId}
                                className="flex flex-col gap-3 rounded-2xl border border-accent/40 bg-accent/5 p-4 sm:flex-row sm:items-center"
                            >
                                <Avatar size="md" className="shrink-0">
                                    {invitation.group.avatarUrl ? (
                                        <AvatarImage
                                            src={invitation.group.avatarUrl}
                                            alt={t("identity.avatarAlt", {
                                                name: invitation.group.name,
                                            })}
                                        />
                                    ) : null}
                                    <AvatarFallback className="bg-accent/10 font-bold text-accent">
                                        {invitation.group.name.slice(0, 1).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex min-w-0 flex-1 flex-col">
                                    <Link
                                        href={`/groups/${invitation.group.id}`}
                                        className="min-w-0 no-underline hover:underline"
                                    >
                                        <Typography type="body-sm" weight="medium" truncate>
                                            {invitation.group.name}
                                        </Typography>
                                    </Link>
                                    <Typography type="body-xs" color="muted">
                                        {inviterName
                                            ? t("invitations.invitedBy", { name: inviterName })
                                            : t("invitations.invitedByUnknown")}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {invitation.expiresAt
                                            ? t("invitations.expiresAt", {
                                                date: format.dateTime(
                                                    new Date(invitation.expiresAt),
                                                    { dateStyle: "medium", timeStyle: "short" },
                                                ),
                                            })
                                            : t("invitations.noExpiry")}
                                    </Typography>
                                </div>

                                <div className="flex shrink-0 gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        isDisabled={respondingId !== null}
                                        onPress={guard(
                                            () => void onRespond(invitation, "DECLINE"),
                                            "auth.context.generic",
                                        )}
                                    >
                                        {t("invitation.decline")}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        isPending={isResponding}
                                        isDisabled={respondingId !== null}
                                        onPress={guard(
                                            () => void onRespond(invitation, "ACCEPT"),
                                            "auth.context.generic",
                                        )}
                                    >
                                        {t("invitation.accept")}
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </AsyncContent>
        </section>
    )
}

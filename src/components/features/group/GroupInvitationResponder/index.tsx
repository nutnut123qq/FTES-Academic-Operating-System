"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useRestWithToast } from "@/modules/toast/hooks"
import { usePostRespondToInvitationSwr } from "@/hooks/swr/api/rest/mutations/usePostRespondToInvitationSwr"

/** Query-string key carrying the invitation id (e.g. `/groups/{id}?invitation={inviteId}`). */
export const GROUP_INVITATION_PARAM = "invitation"

/** Props for {@link GroupInvitationResponder}. */
export interface GroupInvitationResponderProps {
    /**
     * Invitation id to respond to. Omit to read it from the `?invitation=` query
     * string (the shape an invite link / notification deep-link carries).
     */
    invitationId?: string | null
    /** Called after a successful ACCEPT/DECLINE — e.g. to revalidate the member list. */
    onResponded?: (action: "ACCEPT" | "DECLINE") => void
}

/**
 * Pending-invitation banner: "you were invited — accept / decline", wired to the
 * real `POST /invitations/{id}/respond`.
 *
 * The backend exposes NO "list my invitations" read (`InvitationController` only has
 * the respond route), so this surface cannot discover invitations on its own — it
 * responds to an id that arrives from somewhere else (an invite deep-link, a
 * notification payload). With no id it renders nothing, which is why it is safe to
 * mount unconditionally. Once a `GET /invitations?status=PENDING` (or a "my
 * invitations" read) lands, the same component can be fed from a list hook instead.
 *
 * @param props - {@link GroupInvitationResponderProps}
 */
export const GroupInvitationResponder = ({
    invitationId,
    onResponded,
}: GroupInvitationResponderProps) => {
    const t = useTranslations("groupsHub")
    const searchParams = useSearchParams()
    const runRest = useRestWithToast()
    const { requireAuthAsync } = useRequireAuth()
    const { trigger, isMutating } = usePostRespondToInvitationSwr()
    const [respondedTo, setRespondedTo] = useState<string | null>(null)

    const id = invitationId ?? searchParams?.get(GROUP_INVITATION_PARAM) ?? null

    if (!id || respondedTo === id) {
        return null
    }

    const onRespond = async (action: "ACCEPT" | "DECLINE") => {
        if (isMutating || !(await requireAuthAsync("auth.context.generic"))) {
            return
        }
        const ok = await runRest(() => trigger({ id, request: { action } }), {
            successMessage:
                action === "ACCEPT" ? t("invitation.accepted") : t("invitation.declined"),
        })
        if (ok !== null) {
            // hide the banner for THIS id only — a later deep-link still renders
            setRespondedTo(id)
            onResponded?.(action)
        }
    }

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-accent/40 bg-accent/5 p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 flex-col">
                <Typography type="body-sm" weight="medium">
                    {t("invitation.title")}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {t("invitation.description")}
                </Typography>
            </div>
            <div className="flex shrink-0 gap-2">
                <Button
                    size="sm"
                    variant="ghost"
                    isDisabled={isMutating}
                    onPress={() => void onRespond("DECLINE")}
                >
                    {t("invitation.decline")}
                </Button>
                <Button
                    size="sm"
                    variant="secondary"
                    isPending={isMutating}
                    onPress={() => void onRespond("ACCEPT")}
                >
                    {t("invitation.accept")}
                </Button>
            </div>
        </div>
    )
}

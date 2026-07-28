"use client"

import React, { useCallback, useState } from "react"
import { Button } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ConfirmDialog } from "@/components/reuseable/PostEngagementBar/ConfirmDialog"
import { useMutateJoinGroupSwr } from "../hooks/useMutateJoinGroupSwr"

/** Props for {@link GroupJoinButton}. */
interface GroupJoinButtonProps {
    /** The group to join. */
    groupId: string
    /** Button size (defaults to `sm`). */
    size?: "sm" | "md" | "lg"
    /** Extra classes for layout (e.g. `self-start`). */
    className?: string
    /**
     * Whether the viewer owns this group. Owners are already members AND cannot leave
     * (the BE requires an ownership transfer first — `GROUP_OWNER_MUST_TRANSFER`), so
     * the CTA renders as a disabled "Joined" state for them.
     */
    isOwner?: boolean
    /**
     * The viewer's role in the group as returned by `GET /groups/{id}`
     * (`viewerMembership`; null = not a member). Optional — pass it on surfaces that
     * already hold the group DTO. When omitted the hook falls back to the cached group
     * header, then to the status of the actions taken this session.
     */
    viewerMembership?: string | null
    /**
     * Raw BE group visibility (`PUBLIC` / `PRIVATE` / `RESTRICTED`). A PUBLIC group is
     * open — anyone can read and participate without joining — so a non-member sees NO
     * Join CTA for it; the button only offers "Join" on PRIVATE/RESTRICTED groups
     * (request-to-join). Members keep their Leave / Joined state regardless.
     */
    visibility?: string | null
}

/**
 * Join / leave action for a group (§7).
 *
 * Not a member → "Join": optimistically flips to a pending state and reflects the BE
 * result — `JOINED` (open group) → "Joined", `PENDING` (approval required) → "Pending"
 * (disabled). Member → "Leave group", behind the shared {@link ConfirmDialog} (a
 * destructive membership change, and in a dense card grid a stray tap must not drop
 * it); the confirm calls `DELETE /groups/{id}/members/{userId}` with the viewer's own
 * id. Guests get the `AuthenticationModal`. Owners render a disabled "Joined" state —
 * they are members and must transfer ownership before they can leave.
 */
export const GroupJoinButton = ({
    groupId,
    size = "sm",
    className,
    isOwner = false,
    viewerMembership,
    visibility,
}: GroupJoinButtonProps) => {
    const t = useTranslations("groupsHub")
    const { status, isJoining, isLeaving, canLeave, join, leave } = useMutateJoinGroupSwr(groupId, {
        viewerMembership,
    })
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)

    const joined = isOwner || status === "joined"
    // Owners cannot leave — the BE demands an ownership transfer first.
    const showLeave = joined && !isOwner && canLeave
    // A PUBLIC group is open (readable/participable without joining): a non-member gets
    // no Join CTA. `!joined && status !== "pending"` is exactly the actionable "Join"
    // state (see the label below) — members/owners keep their Leave / Joined indicator.
    const isPublic = visibility === "PUBLIC"
    const showJoinCta = !joined && status !== "pending"

    const onConfirmLeave = useCallback(async () => {
        await leave(t("join.left"))
        setIsConfirmOpen(false)
    }, [leave, t])

    if (showLeave) {
        return (
            <>
                <Button
                    size={size}
                    variant="ghost"
                    className={className}
                    isPending={isLeaving}
                    onPress={() => setIsConfirmOpen(true)}
                >
                    {t("join.leave")}
                </Button>
                <ConfirmDialog
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={() => void onConfirmLeave()}
                    title={t("join.leaveTitle")}
                    description={t("join.leaveDescription")}
                    confirmLabel={t("join.leave")}
                    isPending={isLeaving}
                />
            </>
        )
    }

    // Public group + non-member → no Join CTA at all (public groups are open).
    if (isPublic && showJoinCta) {
        return null
    }

    const label = joined
        ? t("join.joined")
        : status === "pending"
          ? t("join.pending")
          : t("join.action")

    return (
        <Button
            size={size}
            variant="secondary"
            className={className}
            isDisabled={joined || status === "pending"}
            isPending={isJoining}
            onPress={() => void join()}
        >
            {label}
        </Button>
    )
}

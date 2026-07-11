"use client"

import React from "react"
import { Button } from "@heroui/react"
import { useTranslations } from "next-intl"
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
     * Whether the viewer owns this group. Owners are already members, so the CTA
     * renders as a disabled "Joined" state — pressing Join would POST against
     * their own group. The read contract has no membership flag, so ownership is
     * the only membership signal available here.
     */
    isOwner?: boolean
}

/**
 * Join action for a group (§7). Optimistically flips to a pending state on press
 * and reflects the BE result: `JOINED` (open group) → "Joined" (disabled), or
 * `PENDING` (approval required) → "Pending" (disabled). Guests get the
 * `AuthenticationModal`. Join-only — the backend has no leave endpoint. When the
 * viewer owns the group it renders a disabled "Joined" state (owners are members).
 */
export const GroupJoinButton = ({ groupId, size = "sm", className, isOwner = false }: GroupJoinButtonProps) => {
    const t = useTranslations("groupsHub")
    const { status, isJoining, join } = useMutateJoinGroupSwr(groupId)

    const joined = isOwner || status === "joined"

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

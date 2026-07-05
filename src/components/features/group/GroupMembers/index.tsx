"use client"

import React, { useState } from "react"
import { Button, Chip } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { UserLink } from "@/components/features/identity"
import {
    useQueryGroupMembersSwr,
    type GroupMemberRole,
} from "../hooks/useQueryGroupMembersSwr"

/** Role filter options: "all" + every role. */
const ROLES: Array<GroupMemberRole | "all"> = ["all", "owner", "admin", "moderator", "member"]

/**
 * Group members (§7). DEFAULT on-canon layout: a role filter + a member list
 * (initials avatar + name + role chip). ponytail: rows hand-rolled, icon-free;
 * mock data.
 */
export const GroupMembers = () => {
    const t = useTranslations("groupsHub")
    const { groupId } = useParams<{ groupId: string }>()
    const { members } = useQueryGroupMembersSwr(groupId)
    const [role, setRole] = useState<GroupMemberRole | "all">("all")

    const filtered = role === "all" ? members : members.filter((member) => member.role === role)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
                {ROLES.map((option) => (
                    <Button
                        key={option}
                        size="sm"
                        variant={role === option ? "secondary" : "ghost"}
                        onPress={() => setRole(option)}
                    >
                        {option === "all" ? t("all") : t(`roles.${option}`)}
                    </Button>
                ))}
            </div>
            <div className="flex flex-col gap-2">
                {filtered.map((member) => (
                    <div
                        key={member.id}
                        className="flex items-center gap-3 rounded-2xl border border-separator p-4"
                    >
                        <UserLink
                            username={member.username}
                            displayName={member.name}
                            size="sm"
                            className="min-w-0 flex-1"
                            classNames={{ avatar: "size-9" }}
                        />
                        <Chip size="sm" variant="soft" color="accent">
                            {t(`roles.${member.role}`)}
                        </Chip>
                    </div>
                ))}
            </div>
        </div>
    )
}

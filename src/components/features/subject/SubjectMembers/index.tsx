"use client"

import React, { useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import {
    useQuerySubjectMembersSwr,
    type MemberRole,
} from "../hooks/useQuerySubjectMembersSwr"

/** Role filter options: "all" + every role. */
const ROLES: Array<MemberRole | "all"> = ["all", "lecturer", "moderator", "contributor", "student"]

/**
 * Members tab (§3 Members). DEFAULT on-canon layout (no dedicated brainstorm):
 * a role filter + a dense list of member rows (initials avatar + name + role Chip).
 * ponytail: rows hand-rolled, initials avatar (icon-free); mock data.
 */
export const SubjectMembers = () => {
    const t = useTranslations("subjects")
    const { subjectId } = useParams<{ subjectId: string }>()
    const { members } = useQuerySubjectMembersSwr(subjectId)
    const [active, setActive] = useState<MemberRole | "all">("all")

    const filtered = active === "all" ? members : members.filter((m) => m.role === active)

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-3">
                <Typography type="h5" weight="bold">
                    {t("members.title")}
                </Typography>
                <div className="flex flex-wrap gap-2">
                    {ROLES.map((role) => (
                        <Button
                            key={role}
                            size="sm"
                            variant={active === role ? "secondary" : "ghost"}
                            onPress={() => setActive(role)}
                        >
                            {role === "all" ? t("members.all") : t(`members.roles.${role}`)}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                {filtered.map((member) => (
                    <div
                        key={member.id}
                        className="flex items-center gap-3 rounded-2xl border border-separator p-4"
                    >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                            {member.name.slice(0, 1).toUpperCase()}
                        </div>
                        <Typography type="body-sm" weight="medium" className="min-w-0 flex-1" truncate>
                            {member.name}
                        </Typography>
                        <Chip size="sm" variant="soft" color="accent">
                            {t(`members.roles.${member.role}`)}
                        </Chip>
                    </div>
                ))}
            </div>
        </div>
    )
}

"use client"

import React, { useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { UserLink } from "@/components/features/identity/UserLink"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
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
    const { members, isLoading, error, mutate } = useQuerySubjectMembersSwr(subjectId)
    const [active, setActive] = useState<MemberRole | "all">("all")

    const filtered = active === "all" ? members : members.filter((m) => m.role === active)

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* role filter — static chrome, stays outside the skeleton */}
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

            <AsyncContent
                isLoading={isLoading && members.length === 0}
                skeleton={<MemberListSkeleton />}
                isEmpty={filtered.length === 0}
                emptyContent={{ title: t("members.empty") }}
                error={members.length === 0 ? error : undefined}
                errorContent={{
                    title: t("members.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("members.retry"),
                }}
            >
                <div className="flex flex-col gap-2">
                    {filtered.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center gap-3 rounded-2xl border border-separator p-4"
                        >
                            <UserLink
                                username={member.username}
                                displayName={member.name}
                                avatar={member.avatarUrl}
                                size="sm"
                                className="min-w-0 flex-1"
                                classNames={{ avatar: "size-9" }}
                            />
                            <Chip size="sm" variant="soft" color="accent">
                                {t(`members.roles.${member.role}`)}
                            </Chip>
                        </div>
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}

/** Loading skeleton — mirrors the member rows (avatar + name line + role chip). */
const MemberListSkeleton = () => (
    <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[68px] w-full rounded-2xl" />
        ))}
    </div>
)

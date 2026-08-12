"use client"

import React, { useMemo, useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { UserPlusIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useAppSelector } from "@/redux/hooks"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useRestWithToast } from "@/modules/toast/hooks"
import { usePatchGroupMemberRoleSwr } from "@/hooks/swr/api/rest/mutations/usePatchGroupMemberRoleSwr"
import { useDeleteGroupMemberSwr } from "@/hooks/swr/api/rest/mutations/useDeleteGroupMemberSwr"
import { UserLink } from "@/components/features/identity"
import { ConfirmDialog } from "@/components/reuseable/PostEngagementBar"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { GroupInvitationResponder } from "../GroupInvitationResponder"
import { useQueryGroupSwr } from "../hooks/useQueryGroupSwr"
import { GroupInviteDialog } from "./GroupInviteDialog"
import { GroupMemberActionsMenu } from "./GroupMemberActionsMenu"
import {
    toBackendRole,
    useQueryGroupMemberRowsSwr,
    type GroupAssignableRole,
    type GroupMemberRole,
    type GroupMemberRow,
} from "./useQueryGroupMemberRowsSwr"

/** Loading skeleton — mirrors a member row (avatar + name + role chip). */
const GroupMembersSkeleton = () => (
    <div className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((index) => (
            <div
                key={index}
                className="flex items-center gap-3 rounded-2xl border border-separator p-4"
            >
                <Skeleton.Avatar size="sm" className="shrink-0" />
                <div className="min-w-0 flex-1">
                    <Skeleton.Typography type="body-sm" width="1/3" />
                </div>
                <Skeleton.Chip className="shrink-0" />
            </div>
        ))}
    </div>
)

/** Role filter options: "all" + every role. */
const ROLES: Array<GroupMemberRole | "all"> = ["all", "owner", "admin", "moderator", "member"]

/**
 * Group members (§7). Role filter + member list (identity + role chip), plus the
 * management affordances for owners/admins: a ⋯ menu per row (promote/demote via
 * `PATCH /groups/{id}/members/{userId}`, kick via `DELETE …` behind a confirm) and
 * an "invite member" dialog (`POST /groups/{id}/invitations`).
 *
 * Both writes are optimistic with a re-fetch rollback: the row is re-roled / dropped
 * immediately, and a failure (403 for a role the viewer may not assign, 400 for an
 * OWNER target, …) is toasted by {@link useRestWithToast} while the list is pulled
 * back from the server.
 *
 * Member identity is read defensively (see `useQueryGroupMemberRowsSwr`): the BE
 * enriches memberships with displayName/username/avatar, and a user with no profile
 * row still falls back to the raw user id rather than rendering an empty row.
 */
export const GroupMembers = () => {
    const t = useTranslations("groupsHub")
    const { groupId } = useParams<{ groupId: string }>()
    const { members, isLoading, error, mutate } = useQueryGroupMemberRowsSwr(groupId)
    const { group } = useQueryGroupSwr(groupId)
    const currentUser = useAppSelector((state) => state.user.user)
    const runRest = useRestWithToast()
    const { guard } = useRequireAuth()
    const { trigger: changeRole } = usePatchGroupMemberRoleSwr()
    const { trigger: removeMember } = useDeleteGroupMemberSwr()
    const [role, setRole] = useState<GroupMemberRole | "all">("all")
    const [isInviteOpen, setInviteOpen] = useState(false)
    const [pendingKick, setPendingKick] = useState<GroupMemberRow | null>(null)
    const [isKicking, setKicking] = useState(false)

    const filtered = role === "all" ? members : members.filter((member) => member.role === role)

    /**
     * The viewer's role INSIDE this group — the only gate the row menu needs. The
     * membership list is the source of truth; the group header's `ownerId` covers
     * the window where the list has not resolved yet.
     */
    const viewerRole = useMemo<GroupMemberRole | null>(() => {
        const viewerId = currentUser?.id
        if (!viewerId) {
            return null
        }
        const row = members.find((member) => member.id === viewerId)
        if (row) {
            return row.role
        }
        return group?.ownerId === viewerId ? "owner" : null
    }, [currentUser?.id, group?.ownerId, members])

    const canManage = viewerRole === "owner" || viewerRole === "admin"

    /** Promote/demote — optimistic role swap, re-fetch on failure. */
    const onChangeRole = async (member: GroupMemberRow, next: GroupAssignableRole) => {
        await mutate(
            (current) =>
                current?.map((row) => (row.id === member.id ? { ...row, role: next } : row)),
            { revalidate: false },
        )
        await runRest(
            () =>
                changeRole({
                    id: groupId,
                    userId: member.id,
                    request: { role: toBackendRole(next) },
                }),
            { successMessage: t("members.roleUpdated") },
        )
        // revalidate either way: on failure this rolls the optimistic swap back, on
        // success it picks up whatever else the role change moved server-side
        await mutate()
    }

    /** Kick — optimistic removal behind a confirm; re-fetch restores on failure. */
    const onConfirmKick = async () => {
        const target = pendingKick
        if (!target || isKicking) {
            return
        }
        setKicking(true)
        await mutate((current) => current?.filter((row) => row.id !== target.id), {
            revalidate: false,
        })
        const ok = await runRest(() => removeMember({ id: groupId, userId: target.id }), {
            successMessage: t("members.removed"),
        })
        if (ok === null) {
            await mutate()
        }
        setKicking(false)
        setPendingKick(null)
    }

    return (
        <div className="flex flex-col gap-6">
            {/* pending invitation deep-link (?invitation=…) — renders only when one is carried */}
            <GroupInvitationResponder onResponded={() => void mutate()} />

            {/* role filter + invite CTA — static chrome, stays outside the skeleton */}
            <div className="flex flex-wrap items-center gap-2">
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
                {canManage ? (
                    <Button
                        size="sm"
                        variant="secondary"
                        className="ms-auto"
                        onPress={guard(() => setInviteOpen(true), "auth.context.generic")}
                    >
                        <UserPlusIcon aria-hidden focusable="false" className="size-4" />
                        {t("members.invite")}
                    </Button>
                ) : null}
            </div>

            <AsyncContent
                isLoading={isLoading && members.length === 0}
                skeleton={<GroupMembersSkeleton />}
                isEmpty={filtered.length === 0}
                emptyContent={{ title: t("members.empty") }}
                error={members.length === 0 ? error : undefined}
                errorContent={{
                    title: t("members.error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("states.retry"),
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
                                displayName={member.displayName ?? member.username ?? member.id}
                                avatar={member.avatarUrl}
                                seed={member.username ?? member.id}
                                staffRole={member.staffRole}
                                size="sm"
                                className="min-w-0 flex-1"
                                classNames={{ avatar: "size-9" }}
                            />
                            {member.id === currentUser?.id ? (
                                <Typography type="body-xs" color="muted" className="shrink-0">
                                    {t("members.you")}
                                </Typography>
                            ) : null}
                            <Chip size="sm" variant="soft" color="accent">
                                {t(`roles.${member.role}`)}
                            </Chip>
                            <GroupMemberActionsMenu
                                memberRole={member.role}
                                viewerRole={viewerRole}
                                isSelf={member.id === currentUser?.id}
                                onChangeRole={(next) => void onChangeRole(member, next)}
                                onRemove={() => setPendingKick(member)}
                            />
                        </div>
                    ))}
                </div>
            </AsyncContent>

            {/* invite dialog — mounted only for managers (BE also gates PRIVATE groups) */}
            {canManage ? (
                <GroupInviteDialog
                    isOpen={isInviteOpen}
                    onClose={() => setInviteOpen(false)}
                    groupId={groupId}
                />
            ) : null}

            {/* kick confirm — destructive, never a bare menu press */}
            <ConfirmDialog
                isOpen={pendingKick !== null}
                onClose={() => setPendingKick(null)}
                onConfirm={() => void onConfirmKick()}
                title={t("members.removeConfirmTitle")}
                description={t("members.removeConfirmDescription", {
                    name:
                        pendingKick?.displayName ??
                        pendingKick?.username ??
                        pendingKick?.id ??
                        "",
                })}
                confirmLabel={t("members.removeConfirm")}
                isPending={isKicking}
            />
        </div>
    )
}

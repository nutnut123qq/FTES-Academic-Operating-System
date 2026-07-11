"use client"

import React, { useCallback } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { decideJoinRequest } from "@/modules/api/rest/group"
import { useRestWithToast } from "@/modules/toast/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { GroupIdentityFields } from "../GroupIdentityFields"
import { useIdentityImagePicker } from "../hooks/useIdentityImagePicker"
import {
    useQueryGroupManageSwr,
    type GroupManage,
} from "../hooks/useQueryGroupManageSwr"
import { useMutateGroupPinnedSwr } from "../hooks/useMutateGroupPinnedSwr"
import { useQueryGroupSwr } from "../hooks/useQueryGroupSwr"

/** Loading skeleton — mirrors the three management sections (heading + rows). */
const GroupManageSkeleton = () => (
    <div className="flex flex-col gap-6">
        {[0, 1, 2].map((section) => (
            <div key={section} className="flex flex-col gap-3">
                <Skeleton.Typography type="h6" width="1/3" />
                {[0, 1].map((row) => (
                    <div key={row} className="rounded-2xl border border-separator p-4">
                        <Skeleton.Typography type="body-sm" width="1/2" />
                    </div>
                ))}
            </div>
        ))}
    </div>
)

/**
 * Group management (§7). DEFAULT on-canon layout: group identity (avatar +
 * cover pickers) + join requests (approve/reject, real endpoint) + rules (local
 * placeholder) + pinned posts (real endpoint, unpin). Join decisions + unpin are
 * optimistic with rollback on failure. Identity save + rules stay local no-ops
 * (see the mock BE comments).
 */
export const GroupManagement = () => {
    const t = useTranslations("groupsHub")
    const { groupId } = useParams<{ groupId: string }>()
    const { joinRequests, rules, pinned, hasData, isLoading, error, mutate } =
        useQueryGroupManageSwr(groupId)
    const { group } = useQueryGroupSwr(groupId)
    const avatar = useIdentityImagePicker(group?.avatarUrl ?? null)
    const cover = useIdentityImagePicker(group?.coverUrl ?? null)
    const runRest = useRestWithToast()
    const { unpin } = useMutateGroupPinnedSwr(groupId)

    const onSaveIdentity = () => {
        // mock BE - endpoint pending: no group identity presign contract. When it
        // lands, replace this with: generate presign → PUT avatar.file / cover.file
        // to storage → verify → PATCH the group with the resulting keys. Do NOT
        // reuse the PROFILE avatar mutation for a group.
        console.log("save group identity (mock)", {
            groupId,
            avatarFile: avatar.file,
            coverFile: cover.file,
        })
    }

    // approve/reject a join request — optimistic removal + rollback on failure
    const onDecide = useCallback(
        async (requestId: string, action: "APPROVE" | "REJECT") => {
            await mutate(
                (current: GroupManage | undefined) =>
                    current
                        ? {
                              ...current,
                              joinRequests: current.joinRequests.filter(
                                  (request) => request.id !== requestId,
                              ),
                          }
                        : current,
                { revalidate: false },
            )
            const ok = await runRest(() => decideJoinRequest(groupId, requestId, { action }))
            // rollback (re-fetch server truth) if the decision failed
            if (ok === null) {
                await mutate()
            }
        },
        [groupId, mutate, runRest],
    )

    // unpin a post — optimistic removal; the hook revalidates on success, we
    // re-fetch to restore on failure (the hook surfaces the error toast)
    const onUnpin = useCallback(
        async (postId: string) => {
            await mutate(
                (current: GroupManage | undefined) =>
                    current
                        ? { ...current, pinned: current.pinned.filter((post) => post.id !== postId) }
                        : current,
                { revalidate: false },
            )
            const ok = await unpin(postId)
            if (!ok) {
                await mutate()
            }
        },
        [mutate, unpin],
    )

    return (
        // renders inside the group shell (which owns the container + padding);
        // stays flat like the sibling tabs — no self max-w / p-6 wrapper
        <div className="flex flex-col gap-6">
            <Typography type="h4" weight="bold">
                {t("manage.title")}
            </Typography>

            {/* group identity — pre-seeded from the group's current images */}
            <div className="flex flex-col gap-3">
                <Typography type="h6" weight="bold">
                    {t("identity.title")}
                </Typography>
                <GroupIdentityFields name={group?.name ?? ""} avatar={avatar} cover={cover} />
                <Button size="sm" variant="secondary" className="self-start" onPress={onSaveIdentity}>
                    {t("identity.save")}
                </Button>
            </div>

            {/* management data (join requests · rules · pinned) — one async region */}
            <div className="flex flex-col gap-6 border-t border-separator pt-6">
                <AsyncContent
                    isLoading={isLoading && !hasData}
                    skeleton={<GroupManageSkeleton />}
                    error={!hasData ? error : undefined}
                    errorContent={{
                        title: t("manage.error"),
                        onRetry: () => void mutate(),
                        retryLabel: t("states.retry"),
                    }}
                >
                    {/* join requests */}
                    <div className="flex flex-col gap-3">
                        <Typography type="h6" weight="bold">
                            {t("manage.joinRequests")}
                        </Typography>
                        {joinRequests.length === 0 ? (
                            <Typography type="body-sm" color="muted">
                                {t("manage.noRequests")}
                            </Typography>
                        ) : (
                            joinRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className="flex items-center gap-3 rounded-2xl border border-separator p-4"
                                >
                                    <Typography type="body-sm" weight="medium" className="min-w-0 flex-1" truncate>
                                        {request.name}
                                    </Typography>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onPress={() => void onDecide(request.id, "REJECT")}
                                    >
                                        {t("manage.reject")}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onPress={() => void onDecide(request.id, "APPROVE")}
                                    >
                                        {t("manage.accept")}
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* rules — mock BE - endpoint pending: local placeholder (no BE rules contract) */}
                    <div className="flex flex-col gap-3 border-t border-separator pt-6">
                        <Typography type="h6" weight="bold">
                            {t("manage.rules")}
                        </Typography>
                        {rules.map((rule, index) => (
                            <div key={index} className="flex gap-3 rounded-2xl border border-separator p-4">
                                <Typography type="body-sm" color="muted" className="shrink-0">
                                    {index + 1}.
                                </Typography>
                                <Typography type="body-sm">{rule}</Typography>
                            </div>
                        ))}
                    </div>

                    {/* pinned — real endpoint (unpin) */}
                    <div className="flex flex-col gap-3 border-t border-separator pt-6">
                        <Typography type="h6" weight="bold">
                            {t("manage.pinned")}
                        </Typography>
                        {pinned.length === 0 ? (
                            <Typography type="body-sm" color="muted">
                                {t("manage.noPinned")}
                            </Typography>
                        ) : (
                            pinned.map((post) => (
                                <div
                                    key={post.id}
                                    className="flex items-center gap-3 rounded-2xl border border-separator p-4"
                                >
                                    <Typography type="body-sm" weight="medium" className="min-w-0 flex-1" truncate>
                                        {post.title}
                                    </Typography>
                                    <Button size="sm" variant="ghost" onPress={() => void onUnpin(post.id)}>
                                        {t("manage.unpin")}
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </AsyncContent>
            </div>
        </div>
    )
}

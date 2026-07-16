"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Button, Typography } from "@heroui/react"
import { TrashIcon } from "@phosphor-icons/react"
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
import { useMutateGroupRulesSwr } from "../hooks/useMutateGroupRulesSwr"
import { useMutateGroupMediaSwr } from "../hooks/useMutateGroupMediaSwr"
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
 * Editable group rules list (change group-identity-media-rules-rsvp). Seeded from
 * the fetched rules, edited locally, saved atomically via `PUT /groups/{id}/rules`
 * (replace-all). Re-seeds when the fetched rules change (e.g. after a save revalidate).
 */
const GroupRulesEditor = ({
    groupId,
    rules,
}: {
    groupId: string
    rules: Array<string>
}) => {
    const t = useTranslations("groupsHub")
    const { save } = useMutateGroupRulesSwr(groupId)
    const runRest = useRestWithToast()
    const [draft, setDraft] = useState<Array<string>>(rules)
    const [isSaving, setIsSaving] = useState(false)

    // re-seed when server rules change (join key on content so an edit-in-flight
    // isn't clobbered by the same list coming back)
    useEffect(() => {
        setDraft(rules)
    }, [rules])

    const onEdit = (index: number, value: string) =>
        setDraft((current) => current.map((rule, i) => (i === index ? value : rule)))
    const onRemove = (index: number) =>
        setDraft((current) => current.filter((_, i) => i !== index))
    const onAdd = () => setDraft((current) => [...current, ""])

    const onSave = async () => {
        if (isSaving) {
            return
        }
        // drop blank lines + enforce the BE caps (≤ 30 items, ≤ 300 chars each)
        const cleaned = draft
            .map((rule) => rule.trim())
            .filter((rule) => rule.length > 0)
            .slice(0, 30)
            .map((rule) => rule.slice(0, 300))
        setIsSaving(true)
        await runRest(() => save(cleaned), { successMessage: t("manage.rulesSaved") })
        setIsSaving(false)
    }

    return (
        <div className="flex flex-col gap-3">
            {draft.map((rule, index) => (
                <div key={index} className="flex items-center gap-3 rounded-2xl border border-separator p-4">
                    <Typography type="body-sm" color="muted" className="shrink-0">
                        {index + 1}.
                    </Typography>
                    <input
                        value={rule}
                        onChange={(event) => onEdit(index, event.target.value)}
                        placeholder={t("manage.rulePlaceholder")}
                        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                    />
                    <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        aria-label={t("manage.removeRule")}
                        className="shrink-0"
                        onPress={() => onRemove(index)}
                    >
                        <TrashIcon className="size-4" />
                    </Button>
                </div>
            ))}
            {draft.length === 0 ? (
                <Typography type="body-sm" color="muted">
                    {t("manage.noRules")}
                </Typography>
            ) : null}
            <div className="flex gap-2">
                <Button size="sm" variant="ghost" onPress={onAdd}>
                    {t("manage.addRule")}
                </Button>
                <Button size="sm" variant="secondary" isPending={isSaving} onPress={() => void onSave()}>
                    {t("manage.saveRules")}
                </Button>
            </div>
        </div>
    )
}

/**
 * Group management (§7). DEFAULT on-canon layout: group identity (avatar + cover
 * pickers with real presign→upload→verify) + join requests (approve/reject) + rules
 * (real read/write, replace-all) + pinned posts (real endpoint, unpin). All writes
 * are wired to the real BE (changes group-social-engagement / group-identity-media-rules-rsvp).
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
    const { upload } = useMutateGroupMediaSwr(groupId)
    const [isSavingIdentity, setIsSavingIdentity] = useState(false)

    // presign → upload → verify for whichever picker holds a fresh file; each step
    // toasts its own failure (see useMutateGroupMediaSwr). No file picked = no-op.
    const onSaveIdentity = async () => {
        if (isSavingIdentity || (!avatar.file && !cover.file)) {
            return
        }
        setIsSavingIdentity(true)
        if (avatar.file) {
            await runRest(() => upload("AVATAR", avatar.file as File), {
                successMessage: t("identity.saved"),
            })
        }
        if (cover.file) {
            await runRest(() => upload("COVER", cover.file as File), {
                successMessage: t("identity.saved"),
            })
        }
        setIsSavingIdentity(false)
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
            if (ok === null) {
                await mutate()
            }
        },
        [groupId, mutate, runRest],
    )

    // unpin a post — optimistic removal; re-fetch to restore on failure
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
                <Button
                    size="sm"
                    variant="secondary"
                    className="self-start"
                    isDisabled={!avatar.file && !cover.file}
                    isPending={isSavingIdentity}
                    onPress={() => void onSaveIdentity()}
                >
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

                    {/* rules — real read/write (replace-all) */}
                    <div className="flex flex-col gap-3 border-t border-separator pt-6">
                        <Typography type="h6" weight="bold">
                            {t("manage.rules")}
                        </Typography>
                        <GroupRulesEditor groupId={groupId} rules={rules} />
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

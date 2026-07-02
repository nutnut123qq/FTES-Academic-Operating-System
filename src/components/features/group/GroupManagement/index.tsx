"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { GroupIdentityFields } from "../GroupIdentityFields"
import { useIdentityImagePicker } from "../hooks/useIdentityImagePicker"
import { useQueryGroupManageSwr } from "../hooks/useQueryGroupManageSwr"
import { useQueryGroupSwr } from "../hooks/useQueryGroupSwr"

/**
 * Group management (§7). DEFAULT on-canon layout: group identity (avatar +
 * cover pickers, pre-seeded from the group's current images) + join requests
 * (accept/reject) + rules + pinned posts sections. ponytail: rows hand-rolled;
 * join actions resolve locally; identity save is a no-op with a presign
 * swap-point; mock data.
 */
export const GroupManagement = () => {
    const t = useTranslations("groupsHub")
    const { groupId } = useParams<{ groupId: string }>()
    const { joinRequests, rules, pinned } = useQueryGroupManageSwr(groupId)
    const { group } = useQueryGroupSwr(groupId)
    const avatar = useIdentityImagePicker(group?.avatarUrl ?? null)
    const cover = useIdentityImagePicker(group?.coverUrl ?? null)
    const [resolved, setResolved] = useState<Array<string>>([])

    const pendingRequests = joinRequests.filter((request) => !resolved.includes(request.id))
    const resolve = (id: string) => setResolved((prev) => [...prev, id])

    const onSaveIdentity = () => {
        // ponytail: swap-point — khi BE group presign lands, thay log này bằng:
        //   generateGroupIdentityPresignUrl({ groupId, contentType }) → { url, key }
        //   → PUT avatar.file / cover.file lên minio qua `url`
        //   → verifyGroupIdentityPresignUrl({ key }) → { uploaded, url }
        // (GIẢ ĐỊNH contract tương tự profile avatar — chưa có; KHÔNG gọi
        //  mutation avatar của PROFILE cho group.)
        console.log("save group identity (mock)", {
            groupId,
            avatarFile: avatar.file,
            coverFile: cover.file,
        })
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
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

            {/* join requests */}
            <div className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
                    {t("manage.joinRequests")}
                </Typography>
                {pendingRequests.length === 0 ? (
                    <Typography type="body-sm" color="muted">
                        {t("manage.noRequests")}
                    </Typography>
                ) : (
                    pendingRequests.map((request) => (
                        <div
                            key={request.id}
                            className="flex items-center gap-3 rounded-large border border-separator p-4"
                        >
                            <Typography type="body-sm" weight="medium" className="min-w-0 flex-1" truncate>
                                {request.name}
                            </Typography>
                            <Button size="sm" variant="ghost" onPress={() => resolve(request.id)}>
                                {t("manage.reject")}
                            </Button>
                            <Button size="sm" variant="secondary" onPress={() => resolve(request.id)}>
                                {t("manage.accept")}
                            </Button>
                        </div>
                    ))
                )}
            </div>

            {/* rules */}
            <div className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
                    {t("manage.rules")}
                </Typography>
                {rules.map((rule, index) => (
                    <div key={index} className="flex gap-3 rounded-large border border-separator p-4">
                        <Typography type="body-sm" color="muted" className="shrink-0">
                            {index + 1}.
                        </Typography>
                        <Typography type="body-sm">{rule}</Typography>
                    </div>
                ))}
            </div>

            {/* pinned */}
            <div className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
                    {t("manage.pinned")}
                </Typography>
                {pinned.map((post, index) => (
                    <div key={index} className="rounded-large border border-separator p-4">
                        <Typography type="body-sm" weight="medium" truncate>
                            {post}
                        </Typography>
                    </div>
                ))}
            </div>
        </div>
    )
}

"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useQueryGroupManageSwr } from "../hooks/useQueryGroupManageSwr"

/**
 * Group management (§7). DEFAULT on-canon layout: join requests (accept/reject) +
 * rules + pinned posts sections. ponytail: rows hand-rolled; join actions resolve
 * locally; mock data.
 */
export const GroupManagement = () => {
    const t = useTranslations("groupsHub")
    const { groupId } = useParams<{ groupId: string }>()
    const { joinRequests, rules, pinned } = useQueryGroupManageSwr(groupId)
    const [resolved, setResolved] = useState<Array<string>>([])

    const pendingRequests = joinRequests.filter((request) => !resolved.includes(request.id))
    const resolve = (id: string) => setResolved((prev) => [...prev, id])

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            <Typography type="h4" weight="bold">
                {t("manage.title")}
            </Typography>

            {/* join requests */}
            <div className="flex flex-col gap-3">
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

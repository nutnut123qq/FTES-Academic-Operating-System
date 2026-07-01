"use client"

import React from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { useQueryGroupSwr } from "../hooks/useQueryGroupSwr"

/** Props for {@link GroupDetailShell}. */
interface GroupDetailShellProps {
    /** The `[groupId]` route segment. */
    groupId: string
    /** The active tab page. */
    children: React.ReactNode
}

/** Group tabs: i18n key + relative segment ("" = feed root). */
const TABS: Array<{ key: string; segment: string }> = [
    { key: "feed", segment: "" },
    { key: "discussion", segment: "discussion" },
    { key: "members", segment: "members" },
    { key: "resources", segment: "resources" },
    { key: "events", segment: "events" },
]

/**
 * Group detail shell (§7). DEFAULT on-canon layout: a group header (name + type +
 * members) + a tab nav (feed / discussion / members / resources / events) over
 * the active tab. ponytail: header + tabs hand-rolled; tabs are nested routes.
 */
export const GroupDetailShell = ({ groupId, children }: GroupDetailShellProps) => {
    const t = useTranslations("groupsHub")
    const router = useRouter()
    const pathname = usePathname()
    const { group } = useQueryGroupSwr(groupId)

    const base = `/groups/${groupId}`
    const hrefFor = (segment: string) => (segment ? `${base}/${segment}` : base)
    const isActive = (segment: string) =>
        segment ? pathname.startsWith(`${base}/${segment}`) : pathname === base

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
            {/* group header */}
            <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-large bg-accent/10 text-lg font-bold text-accent">
                    {(group?.name ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <Typography type="h4" weight="bold" truncate>
                        {group?.name ?? groupId}
                    </Typography>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        {group ? (
                            <Chip size="sm" variant="soft" color="accent">
                                {t(`types.${group.type}`)}
                            </Chip>
                        ) : null}
                        <Typography type="body-xs" color="muted">
                            {group ? t("membersCount", { count: group.members }) : ""}
                        </Typography>
                    </div>
                </div>
            </div>

            {/* tab nav */}
            <div className="flex flex-wrap gap-2 border-b border-separator pb-3">
                {TABS.map((tab) => (
                    <Button
                        key={tab.key}
                        size="sm"
                        variant={isActive(tab.segment) ? "secondary" : "ghost"}
                        onPress={() => router.push(hrefFor(tab.segment))}
                    >
                        {t(`tabs.${tab.key}`)}
                    </Button>
                ))}
            </div>

            <div>{children}</div>
        </div>
    )
}

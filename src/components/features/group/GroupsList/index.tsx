"use client"

import React, { useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useQueryGroupsSwr, type GroupType } from "../hooks/useQueryGroupsSwr"

/** Filter options: "all" + every group type. */
const TYPES: Array<GroupType | "all"> = ["all", "public", "private", "study", "club", "team"]

/**
 * Groups list (§7). DEFAULT on-canon layout: a type filter + a grid of group
 * cards linking to each group. ponytail: cards hand-rolled; mock data.
 */
export const GroupsList = () => {
    const t = useTranslations("groupsHub")
    const { groups } = useQueryGroupsSwr()
    const [type, setType] = useState<GroupType | "all">("all")

    const filtered = type === "all" ? groups : groups.filter((group) => group.type === type)

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
            <Typography type="h4" weight="bold">
                {t("title")}
            </Typography>

            {/* type filter */}
            <div className="flex flex-wrap gap-2">
                {TYPES.map((option) => (
                    <Button
                        key={option}
                        size="sm"
                        variant={type === option ? "secondary" : "ghost"}
                        onPress={() => setType(option)}
                    >
                        {option === "all" ? t("all") : t(`types.${option}`)}
                    </Button>
                ))}
            </div>

            {/* group grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filtered.map((group) => (
                    <Link
                        key={group.id}
                        href={`/groups/${group.id}`}
                        className="flex flex-col gap-2 rounded-large border border-separator p-4 no-underline transition-colors hover:bg-default/40"
                    >
                        <div className="flex items-center gap-2">
                            <Typography type="body" weight="medium" className="min-w-0 flex-1" truncate>
                                {group.name}
                            </Typography>
                            <Chip size="sm" variant="soft" color="accent">
                                {t(`types.${group.type}`)}
                            </Chip>
                        </div>
                        <Typography type="body-sm" color="muted">
                            {group.description}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {t("membersCount", { count: group.members })}
                        </Typography>
                    </Link>
                ))}
            </div>
        </div>
    )
}

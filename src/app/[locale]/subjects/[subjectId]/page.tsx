"use client"

import React from "react"
import { Typography } from "@heroui/react"
import {
    BookOpenIcon,
    FolderIcon,
    TargetIcon,
    SparkleIcon,
    ChatCircleIcon,
    UsersIcon,
    ChartBarIcon,
    BriefcaseIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { Link } from "@/i18n/navigation"

/** Overview = hub grid (direction C) of shortcuts into the other workspace areas. */
const SHORTCUTS: Array<{ key: string; icon: React.ReactNode; segment: string }> = [
    { key: "learning", icon: <BookOpenIcon className="size-5" />, segment: "learning" },
    { key: "resources", icon: <FolderIcon className="size-5" />, segment: "resources" },
    { key: "practice", icon: <TargetIcon className="size-5" />, segment: "practice" },
    { key: "ai", icon: <SparkleIcon className="size-5" />, segment: "ai" },
    { key: "community", icon: <ChatCircleIcon className="size-5" />, segment: "community" },
    { key: "members", icon: <UsersIcon className="size-5" />, segment: "members" },
    { key: "statistics", icon: <ChartBarIcon className="size-5" />, segment: "statistics" },
    { key: "career", icon: <BriefcaseIcon className="size-5" />, segment: "career" },
]

/**
 * Subject workspace Overview tab. A hub grid of shortcuts into every other area.
 * ponytail: shortcut cards are hand-rolled Links for the scaffold — swap to the
 * `PressableCard` block when the Overview gets its own brainstorm.
 */
const Page = () => {
    const t = useTranslations("subjects")
    const { subjectId } = useParams<{ subjectId: string }>()

    return (
        <div className="flex flex-col gap-3 p-6">
            <Typography type="h5" weight="bold">
                {t("overview.title")}
            </Typography>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {SHORTCUTS.map((item) => (
                    <Link
                        key={item.key}
                        href={`/subjects/${subjectId}/${item.segment}`}
                        className="flex items-center gap-3 rounded-large border border-separator p-4 no-underline transition-colors hover:bg-default/40"
                    >
                        <span className="text-accent">{item.icon}</span>
                        <Typography type="body-sm" weight="medium">
                            {t(`nav.${item.key}`)}
                        </Typography>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default Page

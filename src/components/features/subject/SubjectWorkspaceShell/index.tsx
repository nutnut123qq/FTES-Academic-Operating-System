"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Typography, cn } from "@heroui/react"
import {
    SquaresFourIcon,
    FolderIcon,
    TargetIcon,
    SparkleIcon,
    ChatCircleIcon,
    UsersIcon,
    ChartBarIcon,
    BriefcaseIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { CollapsibleSidebar } from "@/components/blocks/navigation/CollapsibleSidebar"
import { SidebarNavGroup } from "@/components/blocks/navigation/SidebarNavGroup"
import { SidebarNavItem } from "@/components/blocks/navigation/SidebarNavItem"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { useQuerySubjectSwr } from "../hooks/useQuerySubjectSwr"

/** Props for {@link SubjectWorkspaceShell}. */
interface SubjectWorkspaceShellProps {
    /** The `[subjectId]` route segment. */
    subjectId: string
    /** The active tab page. */
    children: React.ReactNode
}

/** One nav row: i18n label key, icon, and the path segment (empty = overview root). */
interface NavItem {
    key: string
    icon: React.ReactNode
    segment: string
}

/** The 8 workspace areas grouped into 3 clusters (Không gian môn · Cộng đồng · Insight) — rail v2, no Lessons (IA domain separation: learning lives in the Course module). */
const NAV_GROUPS: Array<{ label: string; items: Array<NavItem> }> = [
    {
        label: "space",
        items: [
            { key: "overview", icon: <SquaresFourIcon className="size-5" aria-hidden focusable="false" />, segment: "" },
            { key: "discussion", icon: <ChatCircleIcon className="size-5" aria-hidden focusable="false" />, segment: "discussion" },
            { key: "resources", icon: <FolderIcon className="size-5" aria-hidden focusable="false" />, segment: "resources" },
            { key: "practice", icon: <TargetIcon className="size-5" aria-hidden focusable="false" />, segment: "practice" },
            { key: "ai", icon: <SparkleIcon className="size-5" aria-hidden focusable="false" />, segment: "ai" },
        ],
    },
    {
        label: "community",
        items: [
            { key: "members", icon: <UsersIcon className="size-5" aria-hidden focusable="false" />, segment: "members" },
        ],
    },
    {
        label: "insight",
        items: [
            { key: "statistics", icon: <ChartBarIcon className="size-5" aria-hidden focusable="false" />, segment: "statistics" },
            { key: "career", icon: <BriefcaseIcon className="size-5" aria-hidden focusable="false" />, segment: "career" },
        ],
    },
]

/**
 * Subject Workspace shell (archetype A · sidebar rail — chosen 2026-07-01). A left
 * {@link CollapsibleSidebar} lists the 8 workspace areas in 3 separator-divided
 * clusters; the content region carries the subject identity header + the active
 * tab. Sticky one-scroll (the body scrolls; the rail sticks under the 4rem navbar).
 *
 * Feature owns data (mock subject) + active-route detection + navigation; the
 * blocks own all styling.
 *
 * @param props - {@link SubjectWorkspaceShellProps}
 */
export const SubjectWorkspaceShell = ({ subjectId, children }: SubjectWorkspaceShellProps) => {
    const t = useTranslations("subjects")
    const router = useRouter()
    const pathname = usePathname()
    const { subject } = useQuerySubjectSwr(subjectId)
    // broken header image → initials badge (spec: never show a broken glyph);
    // keyed by src so a subject change retries its own image
    const [brokenImageUrl, setBrokenImageUrl] = useState<string | null>(null)
    const imageUrl =
        subject?.imageUrl && subject.imageUrl !== brokenImageUrl ? subject.imageUrl : null

    const base = `/subjects/${subjectId}`
    const hrefFor = (segment: string) => (segment ? `${base}/${segment}` : base)
    const isActive = (segment: string) =>
        segment ? pathname.startsWith(`${base}/${segment}`) : pathname === base

    return (
        <div className="flex w-full">
            <div className="shrink-0 md:sticky md:top-16 md:h-[calc(100dvh-4rem)]">
                <CollapsibleSidebar
                    title={subject?.code ?? subjectId.toUpperCase()}
                    collapseLabel={t("collapse")}
                    expandLabel={t("expand")}
                    storageKey="subject-workspace-sidebar-collapsed"
                    className="h-full"
                >
                    {NAV_GROUPS.map((group, index) => (
                        <SidebarNavGroup
                            key={group.label}
                            label={t(`groups.${group.label}`)}
                            divider={index > 0}
                        >
                            {group.items.map((item) => (
                                <SidebarNavItem
                                    key={item.key}
                                    icon={item.icon}
                                    label={t(`nav.${item.key}`)}
                                    isActive={isActive(item.segment)}
                                    onPress={() => router.push(hrefFor(item.segment))}
                                />
                            ))}
                        </SidebarNavGroup>
                    ))}
                </CollapsibleSidebar>
            </div>

            <div className="min-w-0 flex-1">
                {/* subject identity header — spans the content region top */}
                <header className={cn("flex flex-col gap-2 border-b border-separator p-6")}>
                    <div className="flex items-center gap-3">
                        {imageUrl !== null && subject ? (
                            <div className="relative size-11 shrink-0 overflow-hidden rounded-large">
                                <Image
                                    src={imageUrl}
                                    alt={subject.name}
                                    fill
                                    sizes="44px"
                                    className="object-cover"
                                    onError={() => setBrokenImageUrl(imageUrl)}
                                />
                            </div>
                        ) : (
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-large bg-accent/10 text-sm font-bold text-accent">
                                {(subject?.code ?? subjectId).slice(0, 3).toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0">
                            <Typography type="h4" weight="bold" truncate>
                                {subject ? `${subject.code} · ${subject.name}` : subjectId}
                            </Typography>
                            <Typography type="body-sm" color="muted">
                                {subject
                                    ? `${t("credits", { count: subject.credits })} · ${t(`difficulty.${subject.difficulty}`)}`
                                    : ""}
                            </Typography>
                            {subject && subject.progress !== null ? (
                                <div className="mt-1 flex items-center gap-2">
                                    <ProgressMeter
                                        value={subject.progress}
                                        aria-label={t("progressLabel")}
                                        className="min-w-0 flex-1"
                                    />
                                    <Typography
                                        type="body-xs"
                                        color="muted"
                                        className="shrink-0 tabular-nums"
                                    >
                                        {Math.round(subject.progress)}%
                                    </Typography>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </header>

                {children}
            </div>
        </div>
    )
}

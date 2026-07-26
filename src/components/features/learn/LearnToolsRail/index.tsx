"use client"

import React from "react"
import { Label, Link, ScrollShadow, cn } from "@heroui/react"
import {
    ChatCircleTextIcon,
    ChatsCircleIcon,
    TreeStructureIcon,
    TrophyIcon,
    MicrophoneStageIcon,
    CardsThreeIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { useQueryLearnCourseSwr } from "../hooks/useQueryLearnCourseSwr"

/** Props for {@link LearnToolsRail}. */
export interface LearnToolsRailProps {
    /** Extra classes on the rail root. */
    className?: string
    /**
     * Mobile mode: render a plain full-width panel (for a mobile drawer) instead of
     * the sticky desktop aside. The rail body is identical either way.
     */
    mobile?: boolean
}

/** One tool row: icon + label acting as a go-there link. */
interface ToolRow {
    key: string
    icon: React.ReactNode
    label: string
    href: string
}

/**
 * The right-side tools rail for the learn CONTENT DASHBOARD (the course home). Hosts
 * the learn tools that used to clutter the centre column as feature cards: the mind
 * map, leaderboard, mock interview and course interview — plus, below, the subject
 * shortcuts "Ôn tập" (→ workspace practice) and "Hỏi đáp" (→ subject discussion),
 * routed by the course's linked `subjectCode` (exposed on the learn-course header).
 * When the course has no linked subject the subject group is omitted.
 *
 * Sticky under the navbar on desktop; hidden below `lg` (the dashboard stacks on
 * mobile). Mirrors {@link import("../OnThisPage").OnThisPage}'s rail chrome so the
 * two right rails read the same.
 *
 * @param props - {@link LearnToolsRailProps}
 */
export const LearnToolsRail = ({ className, mobile = false }: LearnToolsRailProps) => {
    const t = useTranslations("learn.toolsRail")
    const router = useRouter()
    const { courseId } = useParams<{ courseId: string }>()
    const { header } = useQueryLearnCourseSwr(courseId)
    const subjectCode = header?.subjectCode ?? null

    const learnBase = `/courses/${courseId}/learn`
    const tools: Array<ToolRow> = [
        { key: "mind-map", icon: <TreeStructureIcon className="size-5" aria-hidden focusable="false" />, label: t("mindMap"), href: `${learnBase}/mind-map` },
        { key: "leaderboard", icon: <TrophyIcon className="size-5" aria-hidden focusable="false" />, label: t("leaderboard"), href: `${learnBase}/leaderboard` },
        { key: "mock-interview", icon: <MicrophoneStageIcon className="size-5" aria-hidden focusable="false" />, label: t("mockInterview"), href: `${learnBase}/mock-interview` },
        { key: "interview", icon: <CardsThreeIcon className="size-5" aria-hidden focusable="false" />, label: t("interview"), href: `${learnBase}/interview` },
    ]

    const subjectTools: Array<ToolRow> = subjectCode
        ? [
            { key: "review", icon: <ChatsCircleIcon className="size-5" aria-hidden focusable="false" />, label: t("review"), href: `/subjects/${subjectCode}/practice` },
            { key: "qa", icon: <ChatCircleTextIcon className="size-5" aria-hidden focusable="false" />, label: t("qa"), href: `/subjects/${subjectCode}/discussion` },
        ]
        : []

    const renderRow = (row: ToolRow) => (
        <Link
            key={row.key}
            onPress={() => router.push(row.href)}
            className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-muted no-underline transition-colors hover:bg-default/40 hover:text-foreground",
            )}
        >
            <span className="text-accent">{row.icon}</span>
            {row.label}
        </Link>
    )

    const sections = (
        <>
            <nav className="flex flex-col gap-2">
                <Label>{t("title")}</Label>
                <div className="flex flex-col gap-1">{tools.map(renderRow)}</div>
            </nav>
            {subjectTools.length > 0 ? (
                <nav className="flex flex-col gap-2">
                    <Label>{t("subjectTitle")}</Label>
                    <div className="flex flex-col gap-1">{subjectTools.map(renderRow)}</div>
                </nav>
            ) : null}
        </>
    )

    // mobile: a plain full-width panel for a drawer (no sticky aside chrome)
    if (mobile) {
        return <div className={cn("flex flex-col gap-6 p-6", className)}>{sections}</div>
    }

    return (
        <aside
            className={cn(
                "hidden w-64 shrink-0 lg:sticky lg:top-16 lg:ml-8 lg:block lg:max-h-[calc(100dvh-4rem)] lg:self-start",
                className,
            )}
        >
            <ScrollShadow hideScrollBar className="lg:max-h-[calc(100dvh-4rem)] lg:overflow-y-auto">
                <div className="flex flex-col gap-6 p-6 pl-0">{sections}</div>
            </ScrollShadow>
        </aside>
    )
}

export default LearnToolsRail

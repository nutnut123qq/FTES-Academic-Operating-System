"use client"

import React, { useState } from "react"
import { Label, Link, ScrollShadow, cn } from "@heroui/react"
import {
    ChatCircleTextIcon,
    CodeIcon,
    FolderIcon,
    LockSimpleIcon,
    PuzzlePieceIcon,
    SquaresFourIcon,
    TargetIcon,
    TreeStructureIcon,
    TrophyIcon,
    MicrophoneStageIcon,
    CardsThreeIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { PackageGateModal } from "@/components/features/course/PackageGateModal"
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

/** One tool row: icon + label acting as a go-there link, or a locked buy trigger. */
interface ToolRow {
    key: string
    icon: React.ReactNode
    label: string
    /** Target route for a navigable row (ignored when {@link locked}). */
    href: string
    /**
     * Locked feature with no working FTES route yet (Playground / Dự án cá nhân):
     * the row shows a lock marker and, on press, opens the whole-course buy flow
     * instead of navigating.
     */
    locked?: boolean
}

/**
 * The right-side tools rail for the learn CONTENT DASHBOARD (the course home). Hosts
 * the learn tools that used to clutter the centre column as feature cards: the mind
 * map, leaderboard, mock interview and course interview — plus, below, the subject
 * shortcuts routed by the course's linked `subjectCode` (exposed on the learn-course
 * header): "Học liệu / Ôn tập" (→ workspace resources), "Flashcard / Luyện tập" (→
 * workspace practice), "Không gian môn học" (→ workspace overview), "Hỏi đáp" (→
 * subject discussion), and two LOCKED upsells (Playground, Dự án cá nhân) that have
 * no working FTES route yet — pressing one opens the whole-course buy flow.
 *
 * When the course has no linked subject the whole subject group is omitted.
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
    const { header, course } = useQueryLearnCourseSwr(courseId)
    const subjectCode = header?.subjectCode ?? null
    const courseRawId = course?.id ?? ""

    // Local buy-flow state for the locked rows — the whole-course package gate.
    // Track the pressed row's LABEL (not just an open flag) so the shared gate modal
    // can render a meaningful header instead of a trailing-blank "…đọc tiếp ".
    const [lockedRowLabel, setLockedRowLabel] = useState<string | null>(null)

    const learnBase = `/courses/${courseId}/learn`
    const tools: Array<ToolRow> = [
        { key: "mind-map", icon: <TreeStructureIcon className="size-5" aria-hidden focusable="false" />, label: t("mindMap"), href: `${learnBase}/mind-map` },
        { key: "leaderboard", icon: <TrophyIcon className="size-5" aria-hidden focusable="false" />, label: t("leaderboard"), href: `${learnBase}/leaderboard` },
        { key: "mock-interview", icon: <MicrophoneStageIcon className="size-5" aria-hidden focusable="false" />, label: t("mockInterview"), href: `${learnBase}/mock-interview` },
        { key: "interview", icon: <CardsThreeIcon className="size-5" aria-hidden focusable="false" />, label: t("interview"), href: `${learnBase}/interview` },
    ]

    const subjectTools: Array<ToolRow> = subjectCode
        ? [
            { key: "materials", icon: <FolderIcon className="size-5" aria-hidden focusable="false" />, label: t("materials"), href: `/subjects/${subjectCode}/resources` },
            { key: "practice", icon: <TargetIcon className="size-5" aria-hidden focusable="false" />, label: t("practice"), href: `/subjects/${subjectCode}/practice` },
            { key: "workspace", icon: <SquaresFourIcon className="size-5" aria-hidden focusable="false" />, label: t("workspace"), href: `/subjects/${subjectCode}` },
            { key: "qa", icon: <ChatCircleTextIcon className="size-5" aria-hidden focusable="false" />, label: t("qa"), href: `/subjects/${subjectCode}/discussion` },
            { key: "playground", icon: <PuzzlePieceIcon className="size-5" aria-hidden focusable="false" />, label: t("playground"), href: "", locked: true },
            { key: "personal-project", icon: <CodeIcon className="size-5" aria-hidden focusable="false" />, label: t("personalProject"), href: "", locked: true },
        ]
        : []

    const renderRow = (row: ToolRow) => (
        <Link
            key={row.key}
            onPress={() => (row.locked ? setLockedRowLabel(row.label) : router.push(row.href))}
            aria-label={row.locked ? `${row.label} — ${t("lockedAria")}` : undefined}
            className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-muted no-underline transition-colors hover:bg-default/40 hover:text-foreground",
            )}
        >
            <span className="text-accent">{row.icon}</span>
            <span className="min-w-0 flex-1 truncate">{row.label}</span>
            {row.locked ? (
                <LockSimpleIcon
                    className="size-4 shrink-0 text-muted"
                    aria-hidden
                    focusable="false"
                />
            ) : null}
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
            {/* whole-course buy flow for the locked rows: an empty `packageSlugs`
                falls through to the WholeCourseGateCard (COURSE_UNLOCK) inside the
                gate modal. Mounted only once the course UUID resolves. */}
            {courseRawId ? (
                <PackageGateModal
                    isOpen={lockedRowLabel !== null}
                    onClose={() => setLockedRowLabel(null)}
                    courseId={courseId}
                    courseRawId={courseRawId}
                    courseTitle={header?.title ?? ""}
                    lessonId=""
                    lessonTitle={lockedRowLabel ?? ""}
                    packageSlugs={[]}
                    context="document"
                />
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

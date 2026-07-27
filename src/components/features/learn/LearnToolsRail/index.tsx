"use client"

import React, { useState } from "react"
import { Label, Link, ScrollShadow, Typography, cn } from "@heroui/react"
import {
    ChatCircleTextIcon,
    CodeIcon,
    FolderIcon,
    LockSimpleIcon,
    PlayCircleIcon,
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

/** Build the reader route for a lesson id shaped "m<n>-l<k>" (mirrors ContentMap). */
const lessonHref = (courseId: string, lessonId: string) =>
    `/courses/${courseId}/learn/content/modules/${lessonId.split("-")[0]}/contents/${lessonId}`

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
 * The FAR-LEFT course-menu / tools rail for the learn CONTENT DASHBOARD (column 1,
 * the StarCI `LearnSidebar` slot). Opens with the course-menu header ("Mục lục khoá
 * học") and a highlighted "Tiếp tục" resume card (next unread lesson + N/total
 * progress), then the grouped tool links: the learn tools (mind map, leaderboard,
 * mock interview, course interview) and — below — the subject shortcuts routed by the
 * course's linked `subjectCode` (exposed on the learn-course header): "Học liệu / Ôn
 * tập" (→ workspace resources), "Flashcard / Luyện tập" (→ workspace practice),
 * "Không gian môn học" (→ workspace overview), "Hỏi đáp" (→ subject discussion), and
 * two LOCKED upsells (Playground, Dự án cá nhân) that have no working FTES route yet —
 * pressing one opens the whole-course buy flow.
 *
 * When the course has no linked subject the whole subject group is omitted.
 *
 * Lives on the LEFT (before the content-map) so the course menu reads where StarCI
 * puts it — not pushed to the far right. Sticky under the navbar on desktop; hidden
 * below `lg` (the dashboard surfaces it inline via {@link
 * import("../LearnContentPage").LearnContentPage}).
 *
 * @param props - {@link LearnToolsRailProps}
 */
export const LearnToolsRail = ({ className, mobile = false }: LearnToolsRailProps) => {
    const t = useTranslations("learn.toolsRail")
    const tContent = useTranslations("learn.content")
    const router = useRouter()
    const { courseId } = useParams<{ courseId: string }>()
    const { header, course, modules } = useQueryLearnCourseSwr(courseId)
    const subjectCode = header?.subjectCode ?? null
    const courseRawId = course?.id ?? ""

    // resume card data — next unread lesson + overall N/total, computed from the same
    // learn tree the content-map reads (so the pill matches the map's progress header).
    const flatLessons = modules.flatMap((module) => module.lessons)
    const doneCount = flatLessons.filter((lesson) => lesson.isCompleted).length
    const totalCount = flatLessons.length
    const continueLessonId = header?.continueLessonId ?? null
    const continueLesson = continueLessonId
        ? flatLessons.find((lesson) => lesson.id === continueLessonId)
        : undefined

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

    // the course-menu header ("Mục lục khoá học") + the resume pill, pinned at the
    // TOP of the rail (mirrors StarCI's LearnSidebar title + ResumeRail top slot).
    const menuHeader = (
        <div className="flex flex-col gap-3">
            <Typography type="body-sm" weight="semibold" className="text-foreground">
                {t("menuTitle")}
            </Typography>
            {continueLesson ? (
                <Link
                    onPress={() => router.push(lessonHref(courseId, continueLesson.id))}
                    aria-label={`${tContent("continue")} · ${continueLesson.title}`}
                    className={cn(
                        "flex w-full min-w-0 max-w-full cursor-pointer items-center gap-2 overflow-hidden rounded-large bg-accent/10 px-3 py-2",
                        "no-underline transition-colors hover:bg-accent/15",
                    )}
                >
                    <PlayCircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                    <span className="flex min-w-0 flex-1 flex-col overflow-hidden">
                        <Typography type="body-xs" className="min-w-0 text-accent" truncate>
                            {`${tContent("continue")} · ${doneCount}/${totalCount}`}
                        </Typography>
                        <Typography type="body-sm" className="min-w-0 text-foreground" truncate title={continueLesson.title}>
                            {continueLesson.title}
                        </Typography>
                    </span>
                </Link>
            ) : null}
        </div>
    )

    const sections = (
        <>
            {menuHeader}
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

    // mobile: a plain full-width panel for the inline dashboard block (no sticky chrome)
    if (mobile) {
        return <div className={cn("flex flex-col gap-6 p-6", className)}>{sections}</div>
    }

    // desktop column 1 — far-left rail: sticky under the 4rem navbar, viewport-tall,
    // a bordered flex column (its right border divides it from the content-map in
    // column 2). Scrolls only the body. Hidden below lg (mobile uses the inline block).
    return (
        <aside
            className={cn(
                "relative hidden w-64 shrink-0 lg:sticky lg:top-16 lg:flex lg:h-[calc(100dvh-4rem)] lg:flex-col lg:self-start lg:border-r lg:border-default",
                className,
            )}
        >
            <ScrollShadow hideScrollBar className="min-h-0 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-6 p-4">{sections}</div>
            </ScrollShadow>
        </aside>
    )
}

export default LearnToolsRail

"use client"

import React, { useState } from "react"
import { Link, Typography, cn } from "@heroui/react"
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
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { PackageGateModal } from "@/components/features/course/PackageGateModal"
import { CollapsibleSidebar } from "@/components/blocks/navigation/CollapsibleSidebar"
import { useSidebarCollapsed } from "@/components/blocks/navigation/CollapsibleSidebar/context"
import { SidebarNavGroup } from "@/components/blocks/navigation/SidebarNavGroup"
import { SidebarNavItem } from "@/components/blocks/navigation/SidebarNavItem"
import { useQueryLearnCourseSwr } from "../hooks/useQueryLearnCourseSwr"

/** Build the reader route for a lesson id shaped "m<n>-l<k>" (mirrors ContentMap). */
const lessonHref = (courseId: string, lessonId: string) =>
    `/courses/${courseId}/learn/content/modules/${lessonId.split("-")[0]}/contents/${lessonId}`

/** Persisted-collapse storage key for the desktop tools rail (survives nav + reloads). */
const TOOLS_RAIL_STORAGE_KEY = "ftes.learn.toolsRail.collapsed"

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
     * Locked feature: the row shows a lock marker and, on press, opens the
     * whole-course buy flow instead of navigating. Playground / personal project
     * are always locked (no FTES route yet); Mock interview is locked only while
     * the viewer lacks full course access (rule premium-unlock-is-enroll-not-vip).
     */
    locked?: boolean
}

/**
 * The "Tiếp tục" resume affordance, collapse-aware. Expanded → a highlighted card
 * (next unread lesson title + N/total progress); collapsed (icon rail) → just the
 * {@link PlayCircleIcon} tile. Lives INSIDE {@link CollapsibleSidebar} so it can read
 * the collapsed context; outside a sidebar (mobile panel) the context defaults to
 * expanded, so the full card renders.
 */
const ResumeRow = ({
    lessonTitle,
    progressLabel,
    ariaLabel,
    onPress,
}: {
    lessonTitle: string
    progressLabel: string
    ariaLabel: string
    onPress: () => void
}) => {
    const collapsed = useSidebarCollapsed()
    if (collapsed) {
        return (
            <Link
                onPress={onPress}
                aria-label={ariaLabel}
                className="mx-auto flex size-9 cursor-pointer items-center justify-center rounded-large bg-accent/10 text-accent no-underline transition-colors hover:bg-accent/15"
            >
                <PlayCircleIcon aria-hidden focusable="false" className="size-5" />
            </Link>
        )
    }
    return (
        <Link
            onPress={onPress}
            aria-label={ariaLabel}
            className={cn(
                "flex w-full min-w-0 max-w-full cursor-pointer items-center gap-2 overflow-hidden rounded-large bg-accent/10 px-3 py-2",
                "no-underline transition-colors hover:bg-accent/15",
            )}
        >
            <PlayCircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
            <span className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <Typography type="body-xs" className="min-w-0 text-accent" truncate>
                    {progressLabel}
                </Typography>
                <Typography type="body-sm" className="min-w-0 text-foreground" truncate title={lessonTitle}>
                    {lessonTitle}
                </Typography>
            </span>
        </Link>
    )
}

/**
 * The FAR-LEFT course-menu / tools rail for the learn CONTENT surfaces (column 1,
 * the StarCI `LearnSidebar` slot) — shown on BOTH the content dashboard and the
 * lesson reader so cross-section navigation (Mind map, Leaderboard, Materials, Q&A,
 * …) stays reachable while reading/watching a lesson. Opens with the course-menu
 * header ("Mục lục khoá học") and a highlighted "Tiếp tục" resume card (next unread
 * lesson + N/total progress), then the grouped tool links: the learn tools (mind
 * map, leaderboard, mock interview) and — below — the subject
 * shortcuts routed by the course's linked `subjectCode`: "Học liệu / Ôn tập", "Flashcard
 * / Luyện tập", "Không gian môn học", "Hỏi đáp", and two LOCKED upsells (Playground,
 * Dự án cá nhân). When the course has no linked subject the whole subject group is
 * omitted.
 *
 * Locked rows show a lock marker and, on press, open the whole-course buy flow
 * instead of navigating. Playground / personal project are always locked; Mock
 * interview locks only while the viewer lacks FULL course access
 * (`access.fullAccess` — bought, free-owned, or otherwise entitled).
 *
 * On desktop the rail is a {@link CollapsibleSidebar}: it collapses to a thin icon
 * rail and persists that choice to `localStorage` (key {@link TOOLS_RAIL_STORAGE_KEY})
 * so it survives navigation between the overview + lesson pages and reloads. Sticky
 * under the navbar, hidden below `lg` (the dashboard surfaces it inline via {@link
 * import("../LearnContentPage").LearnContentPage} with `mobile`).
 *
 * @param props - {@link LearnToolsRailProps}
 */
export const LearnToolsRail = ({ className, mobile = false }: LearnToolsRailProps) => {
    const t = useTranslations("learn.toolsRail")
    const tContent = useTranslations("learn.content")
    const router = useRouter()
    const { courseId } = useParams<{ courseId: string }>()
    const { header, course, modules, access } = useQueryLearnCourseSwr(courseId)
    const subjectCode = header?.subjectCode ?? null
    const courseRawId = course?.id ?? ""
    // Full course access (bought / free-owned / otherwise entitled). Guests and
    // not-yet-purchased viewers get `false`, which LOCKS the mock-interview tool
    // behind the whole-course buy flow — mirroring the playground / personal-project
    // locks (rule premium-unlock-is-enroll-not-vip).
    const hasFullAccess = access?.fullAccess ?? false

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
        // The ONLY interview entry. The lecturer-authored "course interview" surface was
        // removed (it needed an instructor to generate a question set first, so a learner
        // could never reach it on their own); mock interview is self-serve end to end.
        { key: "mock-interview", icon: <MicrophoneStageIcon className="size-5" aria-hidden focusable="false" />, label: t("mockInterview"), href: `${learnBase}/mock-interview`, locked: !hasFullAccess },
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

    const renderNavItem = (row: ToolRow) => (
        <SidebarNavItem
            key={row.key}
            icon={<span className="text-accent">{row.icon}</span>}
            label={row.label}
            ariaLabel={row.locked ? `${row.label} — ${t("lockedAria")}` : undefined}
            endContent={
                row.locked ? (
                    <LockSimpleIcon className="size-4 shrink-0 text-muted" aria-hidden focusable="false" />
                ) : undefined
            }
            onPress={() => (row.locked ? setLockedRowLabel(row.label) : router.push(row.href))}
        />
    )

    // shared body — the resume row + the grouped tool links. Reused by the desktop
    // CollapsibleSidebar and the mobile inline panel (the rows collapse to icon-only
    // only inside the sidebar; the mobile panel always renders full labels).
    const body = (
        <>
            {continueLesson ? (
                <ResumeRow
                    lessonTitle={continueLesson.title}
                    progressLabel={`${tContent("continue")} · ${doneCount}/${totalCount}`}
                    ariaLabel={`${tContent("continue")} · ${continueLesson.title}`}
                    onPress={() => router.push(lessonHref(courseId, continueLesson.id))}
                />
            ) : null}
            <SidebarNavGroup label={t("title")}>{tools.map(renderNavItem)}</SidebarNavGroup>
            {subjectTools.length > 0 ? (
                <SidebarNavGroup label={t("subjectTitle")} divider>
                    {subjectTools.map(renderNavItem)}
                </SidebarNavGroup>
            ) : null}
        </>
    )

    // whole-course buy flow for the locked rows: an empty `packageSlugs` falls
    // through to the WholeCourseGateCard (COURSE_UNLOCK) inside the gate modal.
    // Mounted only once the course UUID resolves.
    const gate = courseRawId ? (
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
    ) : null

    // mobile: a plain full-width panel for the inline dashboard block (no sticky /
    // collapse chrome). The menu header renders here since there's no sidebar header.
    if (mobile) {
        return (
            <div className={cn("flex flex-col gap-4 p-6", className)}>
                <Typography type="body-sm" weight="semibold" className="text-foreground">
                    {t("menuTitle")}
                </Typography>
                <div className="flex flex-col gap-3">{body}</div>
                {gate}
            </div>
        )
    }

    // desktop column 1 — far-left rail: a CollapsibleSidebar (owns the border, the
    // 16rem↔4rem width animation, the collapse toggle + persisted state, and the
    // scrolling body). A sticky, viewport-tall wrapper pins it under the 4rem navbar.
    // Hidden below lg (mobile uses the inline block).
    return (
        <div
            className={cn(
                "relative hidden shrink-0 lg:sticky lg:top-16 lg:flex lg:h-[calc(100dvh-4rem)] lg:self-start",
                className,
            )}
        >
            <CollapsibleSidebar
                title={t("menuTitle")}
                collapseLabel={t("collapseRail")}
                expandLabel={t("expandRail")}
                storageKey={TOOLS_RAIL_STORAGE_KEY}
                className="h-full"
            >
                {body}
            </CollapsibleSidebar>
            {gate}
        </div>
    )
}

export default LearnToolsRail

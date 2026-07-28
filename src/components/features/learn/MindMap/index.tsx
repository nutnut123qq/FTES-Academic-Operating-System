"use client"

import React, { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useRouter } from "@/i18n/navigation"
import { PackageGateModal } from "@/components/features/course/PackageGateModal"
import { useQueryLearnCourseSwr } from "../hooks/useQueryLearnCourseSwr"
import type { LearnLesson } from "../hooks/useQueryLearnCourseSwr"
import { buildMindMap, resolveRootCode, type MindMapNodeData } from "./build"
import { resolveNodeOpen } from "./open"
import { moduleStatus } from "./status"
import { analyzeProgress } from "./progress"
import { MindMapCanvas } from "./MindMapCanvas"
import { MindMapProgressPanel } from "./MindMapProgressPanel"

/**
 * Course mind map (StarCI React-Flow port, wired to FTES's own SWR learn data).
 *
 * A draggable / pannable / zoomable {@link MindMapCanvas} lays the course out as a
 * tidy tree: the SUBJECT CODE root (not the long, uneven course title) over its
 * completion ring → module cards → lesson cards → exercise cards (challenges /
 * assignments). Every content node is tinted by a typed 3-state completion status
 * (completed = green, in-progress = orange, not-started = neutral). Clicking a node
 * opens its reader / solver, or the same package gate the content-map opens for a
 * fully-locked node. Full-bleed on the `/learn/mind-map` route.
 */
export const MindMap = () => {
    const t = useTranslations("learn")
    const router = useRouter()
    const { courseId } = useParams<{ courseId: string }>()
    const { course, modules, header, error, mutate } = useQueryLearnCourseSwr(courseId)

    /** The lesson the viewer resumes at ("you are here"). */
    const currentLessonId = useMemo(() => {
        if (header?.continueLessonId) {
            return header.continueLessonId
        }
        return modules.find((module) => module.lessons.length > 0)?.lessons[0]?.id ?? null
    }, [header, modules])

    /** The module that owns the resume lesson. */
    const currentModuleId = useMemo(
        () => modules.find((module) => module.lessons.some((lesson) => lesson.id === currentLessonId))?.id ?? null,
        [modules, currentLessonId],
    )

    const subjectCode = useMemo(
        () => resolveRootCode(header?.subjectCode, header?.title ?? "", courseId),
        [header?.subjectCode, header?.title, courseId],
    )

    /**
     * Deterministic progress read-out (overall roll-up + the one recommended next
     * step + strengths / review). Drives the {@link MindMapProgressPanel} and the
     * on-canvas "gợi ý" highlight (via `recommendedLessonId` fed into the graph).
     */
    const insight = useMemo(
        () =>
            analyzeProgress({
                modules,
                currentLessonId,
                completionPercent: header?.progressPercent ?? 0,
            }),
        [modules, currentLessonId, header?.progressPercent],
    )

    const graph = useMemo(
        () =>
            buildMindMap({
                subjectCode,
                completionPercent: header?.progressPercent ?? 0,
                modules,
                currentLessonId,
                currentModuleId,
                recommendedLessonId: insight.recommendation.lessonId,
            }),
        [subjectCode, header?.progressPercent, modules, currentLessonId, currentModuleId, insight.recommendation.lessonId],
    )

    const allDone = modules.length > 0 && modules.every((module) => moduleStatus(module) === "completed")

    // The lesson whose package gate is open (null = closed). A fully-locked node opens a
    // real purchase gate — the same choice the content-map rail makes on the same data.
    const [gateLesson, setGateLesson] = useState<LearnLesson | null>(null)

    const onOpenNode = (data: MindMapNodeData) => {
        const action = resolveNodeOpen(data, modules, courseId)
        if (!action) {
            return
        }
        if (action.type === "route") {
            router.push(action.href)
            return
        }
        setGateLesson(action.lesson)
    }

    /**
     * Jump to the assistant's recommended lesson. Reuses {@link onOpenNode} by
     * synthesising the lesson node data, so routing vs. the premium gate is decided
     * by the exact same rule a click on that node would follow.
     */
    const onOpenRecommendation = () => {
        const { moduleId, lessonId, title, isLocked } = insight.recommendation
        if (!moduleId || !lessonId) {
            return
        }
        onOpenNode({
            kind: "lesson",
            label: title,
            status: "notStarted",
            isLocked,
            isCurrent: false,
            moduleId,
            lessonId,
        })
    }

    const continueHref =
        !allDone && currentModuleId && currentLessonId
            ? `/courses/${courseId}/learn/content/modules/${currentModuleId}/contents/${currentLessonId}`
            : null
    const onContinue = () => {
        if (continueHref) {
            router.push(continueHref)
        }
    }

    return (
        <div className="relative h-[calc(100dvh-4rem)] w-full">
            <h1 className="sr-only">{t("mindMap.title")}</h1>
            <AsyncContent
                isLoading={modules.length === 0 && !error}
                skeleton={<Skeleton className="h-full w-full rounded-3xl" />}
                isEmpty={modules.length === 0}
                emptyContent={{ title: t("mindMap.empty") }}
                error={modules.length === 0 ? error : undefined}
                errorContent={{
                    title: t("mindMap.error"),
                    onRetry: () => {
                        void mutate()
                    },
                    retryLabel: t("common.retry"),
                }}
            >
                <MindMapCanvas
                    graph={graph}
                    currentModuleId={currentModuleId}
                    onOpenNode={onOpenNode}
                    continueHref={continueHref}
                    allDone={allDone}
                    onContinue={onContinue}
                />
                <MindMapProgressPanel insight={insight} onOpenRecommendation={onOpenRecommendation} />
            </AsyncContent>

            {course?.id && gateLesson ? (
                <PackageGateModal
                    isOpen
                    onClose={() => setGateLesson(null)}
                    courseId={courseId}
                    courseRawId={course.id}
                    courseTitle={course.header.title}
                    lessonId={gateLesson.id}
                    lessonTitle={gateLesson.title}
                    packageSlugs={gateLesson.packageSlugs}
                    context="document"
                    onPurchased={() => {
                        void mutate()
                    }}
                />
            ) : null}
        </div>
    )
}

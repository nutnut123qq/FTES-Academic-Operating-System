"use client"

import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react"
import {
    cn,
} from "@heroui/react"
import {
    useRouter,
} from "next/navigation"
import {
    useLocale,
} from "next-intl"
import {
    useTranslations,
} from "next-intl"
import {
    pathConfig,
} from "@/resources/path"
import {
    MilestoneIndexStrip,
} from "./MilestoneIndexStrip"
import {
    MilestoneOutlineSkeleton,
} from "./MilestoneOutlineSkeleton"
import { useQueryMilestonesSwr } from "@/hooks/swr/api/graphql/queries/useQueryMilestonesSwr"
import { useQueryMilestoneTaskProgressSwr } from "@/hooks/swr/api/graphql/queries/useQueryMilestoneTaskProgressSwr"
import { useAppSelector, useAppDispatch } from "@/redux/hooks"
import { setSelectedTaskId } from "@/redux/slices/milestone"
import { OutlineRail } from "@/components/blocks/navigation/OutlineRail"
import type { OutlineRailGroup } from "@/components/blocks/navigation/OutlineRail"
import type { MilestoneEntity } from "@/modules/types/entities/milestone"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { buildMilestoneTaskProgressLookup, isPersonalProjectTaskActionUnlocked } from "@/components/utils/task-lookup"

/**
 * Props for {@link MilestoneOutline}.
 */
type MilestoneOutlineProps = WithClassNames<undefined> & {
    /** Collapsed mode: render a slim numbered index instead of the full list. */
    collapsed?: boolean
}

/**
 * Filter milestones + their tasks by a lower-cased query (milestone title match keeps
 * all its tasks; otherwise only matching tasks survive). Empty query → unchanged.
 */
const filterMilestones = (
    milestones: Array<MilestoneEntity>,
    query: string,
): Array<MilestoneEntity> => {
    if (!query) {
        return milestones
    }
    const result: Array<MilestoneEntity> = []
    for (const milestone of milestones) {
        const matches = (milestone.title ?? "").toLowerCase().includes(query)
        const tasks = matches
            ? (milestone.tasks ?? [])
            : (milestone.tasks ?? []).filter((task) => task.title.toLowerCase().includes(query))
        if (matches || tasks.length > 0) {
            result.push({ ...milestone, tasks })
        }
    }
    return result
}

/**
 * Milestone navigation rail for the personal-project capstone — rendered through
 * the SAME shared {@link OutlineRail} block as the course content-map, so the two
 * rails look identical (progress header + "Về bài hiện tại" continue, search, and
 * milestone → task rows). This is a thin data wrapper: owns the milestones/progress
 * SWR singletons, the Redux task selection + unlock logic, and the controlled
 * search/expand state; it maps milestones→groups and tasks→rows for the block.
 *
 * `collapsed` keeps the slim numbered {@link MilestoneIndexStrip} for the rail's
 * collapse handle. `"use client"` for hooks.
 * @param props - optional container class name + collapsed flag
 */
export const MilestoneOutline = ({ className, collapsed = false }: MilestoneOutlineProps) => {
    const t = useTranslations()
    const milestonesSwr = useQueryMilestonesSwr()
    const progressSwr = useQueryMilestoneTaskProgressSwr()
    const dispatch = useAppDispatch()
    const router = useRouter()
    const locale = useLocale()
    const courseDisplayId = useAppSelector((state) => state.course.displayId)
    const milestoneEntities = useAppSelector((state) => state.milestone.entities)
    const selectedTaskId = useAppSelector((state) => state.milestone.selectedTaskId)

    /** Milestones sorted by their display order. */
    const milestones = useMemo(
        () => [...milestoneEntities].sort((prev, next) => prev.sortIndex - next.sortIndex),
        [milestoneEntities],
    )

    /** Build a map of taskId -> progress item for quick lookup. */
    const progressMap = useMemo(
        () => buildMilestoneTaskProgressLookup(
            progressSwr.data?.milestoneTaskProgress?.data?.completionTasks,
        ),
        [progressSwr.data],
    )
    const currentTaskId = progressSwr.data?.milestoneTaskProgress?.data?.currentTask?.id

    /** Whether a task is unlocked (all previous tasks completed or it's the current task). */
    const isTaskUnlocked = useCallback(
        (taskId: string) => isPersonalProjectTaskActionUnlocked(taskId, progressMap, currentTaskId),
        [progressMap, currentTaskId],
    )

    /** Select a task: store the id in redux and route to its learn page. */
    const onSelectTask = useCallback(
        (taskId: string) => {
            dispatch(setSelectedTaskId(taskId))
            router.push(
                pathConfig().locale(locale).course(courseDisplayId).learn().personalProject(taskId).build(),
            )
        },
        [dispatch, router, locale, courseDisplayId],
    )

    /** Milestone that owns the currently selected task. */
    const activeMilestoneId = useMemo(() => {
        if (!selectedTaskId) {
            return undefined
        }
        const owner = milestones.find((milestone) =>
            (milestone.tasks ?? []).some((task) => task.id === selectedTaskId))
        return owner ? String(owner.id) : undefined
    }, [milestones, selectedTaskId])

    // ---- collapsed rail (slim numbered index) -------------------------------
    /** Collapsed-rail press: jump to the first task of the chosen milestone. */
    const onSelectMilestone = useCallback(
        (milestoneId: string) => {
            const milestone = milestones.find((entity) => String(entity.id) === milestoneId)
            const firstTask = (milestone?.tasks ?? [])
                .slice()
                .sort((prev, next) => prev.sortIndex - next.sortIndex)[0]
            if (firstTask) {
                onSelectTask(firstTask.id)
            }
        },
        [milestones, onSelectTask],
    )

    // ---- search + controlled expand (mirrors ContentMap) --------------------
    const [search, setSearch] = useState("")
    const query = search.trim().toLowerCase()
    const filteredMilestones = useMemo(
        () => filterMilestones(milestones, query),
        [milestones, query],
    )

    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
    useEffect(() => {
        if (!activeMilestoneId) {
            return
        }
        setExpandedKeys((prev) => prev.has(activeMilestoneId) ? prev : new Set(prev).add(activeMilestoneId))
    }, [activeMilestoneId])
    useEffect(() => {
        if (query) {
            setExpandedKeys(new Set(filteredMilestones.map((milestone) => String(milestone.id))))
        }
    }, [query, filteredMilestones])

    // ---- header progress (tasks done / total across all milestones) ---------
    const taskTotals = useMemo(() => {
        let done = 0
        let total = 0
        for (const milestone of milestones) {
            for (const task of milestone.tasks ?? []) {
                total += 1
                if (progressMap.get(task.id)?.completed) {
                    done += 1
                }
            }
        }
        return { done, total }
    }, [milestones, progressMap])

    // ---- milestones → rail groups -------------------------------------------
    const groups = useMemo<Array<OutlineRailGroup>>(
        () => filteredMilestones.map((milestone) => {
            const tasks = (milestone.tasks ?? [])
                .slice()
                .sort((prev, next) => prev.sortIndex - next.sortIndex)
            const doneCount = tasks.filter((task) => progressMap.get(task.id)?.completed).length
            return {
                id: String(milestone.id),
                title: `${milestone.sortIndex}. ${milestone.title || "Milestone"}`,
                progress: { done: doneCount, total: tasks.length },
                collapsedCountLabel: t("courseContents.moduleLessons", {
                    read: doneCount,
                    total: tasks.length,
                }),
                items: tasks.map((task) => ({
                    id: task.id,
                    title: `${task.sortIndex}. ${task.title}`,
                    isActive: selectedTaskId === task.id,
                    isRead: progressMap.get(task.id)?.completed ?? false,
                    isLocked: !isTaskUnlocked(task.id),
                    isPremium: false,
                    onPress: () => onSelectTask(task.id),
                })),
            }
        }),
        [filteredMilestones, progressMap, selectedTaskId, isTaskUnlocked, onSelectTask, t],
    )

    // loading gate: prefer cached redux milestones (SWR hydrates into entities)
    const hasData = milestones.length > 0
    const isLoading = !hasData && !milestonesSwr.error && (milestonesSwr.isLoading || !milestonesSwr.data)
    const isEmpty = !hasData && !milestonesSwr.isLoading && !!milestonesSwr.data && !milestonesSwr.error

    // collapsed rail: only the slim numbered index (clicking a number jumps to that milestone)
    if (collapsed) {
        return (
            <div className={cn("lg:min-h-0 lg:flex-1 lg:overflow-y-auto", className)}>
                <MilestoneIndexStrip
                    milestones={milestones}
                    activeMilestoneId={activeMilestoneId}
                    onSelectMilestone={onSelectMilestone}
                />
            </div>
        )
    }

    return (
        <OutlineRail
            className={cn("lg:min-h-0 lg:flex-1", className)}
            header={taskTotals.total > 0 ? {
                label: t("courseContents.progress"),
                progress: { done: taskTotals.done, total: taskTotals.total },
                countLabel: t("courseContents.contentCount", {
                    read: taskTotals.done,
                    total: taskTotals.total,
                }),
                continue: currentTaskId && currentTaskId !== selectedTaskId ? {
                    label: t("task.previewLockedGoToCurrentTaskButton"),
                    onPress: () => onSelectTask(currentTaskId),
                } : undefined,
            } : undefined}
            search={{
                value: search,
                onChange: setSearch,
                placeholder: t("finalProject.page.searchTaskPlaceholder"),
                ariaLabel: t("finalProject.page.searchTaskPlaceholder"),
            }}
            groups={groups}
            expandedKeys={expandedKeys}
            onExpandedChange={setExpandedKeys}
            async={{
                isLoading,
                skeleton: <MilestoneOutlineSkeleton count={5} />,
                isEmpty,
                emptyTitle: t("courseContents.empty"),
                errorTitle: t("task.loadErrorTitle"),
                error: !hasData ? milestonesSwr.error : undefined,
                onRetry: () => { void milestonesSwr.mutate() },
                retryLabel: t("courseContents.retry"),
                noMatchLabel: t("courseContents.noMatch"),
            }}
        />
    )
}

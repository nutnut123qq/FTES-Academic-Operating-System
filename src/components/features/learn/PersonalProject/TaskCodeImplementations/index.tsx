"use client"

import React, { useMemo } from "react"
import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ImplementationCard } from "@/components/features/learn/LessonReader/CodeImplementationBody/ImplementationCard"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { usePersonalProjectGithubForm } from "@/hooks/zustand/personalProjectGithub/usePersonalProjectGithubForm"
import { useAppSelector } from "@/redux/hooks"

/** Props for {@link TaskCodeImplementations}. */
export type TaskCodeImplementationsProps = WithClassNames<undefined>

/**
 * Implementation guide for a milestone task, shown for the language picked by the
 * top "grading language" selector in {@link PersonalProjectSubmission} — a single
 * source of truth for the active language, so this section no longer renders its
 * own language tabs. Reuses the lesson implementation card so the look matches.
 *
 * Self-contained: reads `codeImplementations` from redux task state and `lang` from
 * the github form store.
 * @param props - optional className for the root element
 */
export const TaskCodeImplementations = ({
    className,
}: TaskCodeImplementationsProps = {}) => {
    const t = useTranslations()
    // active grading language lives in the shared github-form store (set by the top selector);
    // read-only here, so `enableSync` stays off (default) and no debounced sync runs
    const { lang } = usePersonalProjectGithubForm()

    const selectedTaskId = useAppSelector((state) => state.milestone.selectedTaskId)
    const selectedTaskDetail = useAppSelector((state) => state.milestone.selectedTaskDetail)
    const milestoneEntities = useAppSelector((state) => state.milestone.entities)

    const displayTask = useMemo(() => {
        if (!selectedTaskId) return undefined
        if (selectedTaskDetail?.id === selectedTaskId) {
            return selectedTaskDetail
        }
        for (const milestone of milestoneEntities) {
            const found = milestone.tasks?.find((task) => task.id === selectedTaskId)
            if (found) return found
        }
        return undefined
    }, [selectedTaskId, selectedTaskDetail, milestoneEntities])

    const codeImplementations = displayTask?.codeImplementations ?? []

    // pick the guide for the selected language (lang vocab matches: typescript/java/csharp/go)
    const selected = useMemo(
        () => codeImplementations.find(
            (item) => item.lang?.toLowerCase() === lang?.toLowerCase(),
        ),
        [codeImplementations, lang],
    )

    // no guide authored for the selected language → render nothing for this section
    if (!selected) {
        return null
    }

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <div className="font-semibold">
                {t("task.codeImplementationsTitle")}
            </div>
            <ImplementationCard item={selected} />
        </div>
    )
}

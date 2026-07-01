"use client"

import React, { useMemo } from "react"
import {
    Accordion,
    Chip,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import _ from "lodash"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useAppSelector } from "@/redux/hooks"

/** Props for {@link TaskCriteriaList}. */
export type TaskCriteriaListProps = WithClassNames<undefined>

/**
 * Accordion list of pass criteria with score chips and markdown hints.
 *
 * Self-contained: reads sorted criteria from the redux task state, no props needed.
 * @param props - optional className for the root element
 */
export const TaskCriteriaList = ({
    className,
}: TaskCriteriaListProps = {}) => {
    const t = useTranslations()
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

    const sortedCriterias = useMemo(() => {
        if (!displayTask?.criterias) return []
        return _.cloneDeep(displayTask.criterias)
            .sort((prev, next) => prev.sortIndex - next.sortIndex)
    }, [displayTask?.criterias])

    if (sortedCriterias.length === 0) {
        return null
    }

    return (
        <div className={cn(className)}>
            <Accordion allowsMultipleExpanded variant="surface">
                {sortedCriterias.map((criteria, index) => (
                    <Accordion.Item key={criteria.id}>
                        <Accordion.Heading>
                            <Accordion.Trigger className="w-full p-3">
                                <div className="flex w-full items-center gap-3">
                                    <div className="min-w-0 flex-1 text-left">
                                        <div className="text-sm">
                                            {index + 1}. {criteria.text}
                                        </div>
                                    </div>
                                    <Chip size="sm" variant="secondary" color="accent">
                                        {t("task.criteriaScore", { score: criteria.score })}
                                    </Chip>
                                    <Accordion.Indicator />
                                </div>
                            </Accordion.Trigger>
                        </Accordion.Heading>
                        <Accordion.Panel>
                            <Accordion.Body>
                                {criteria.hint ? (
                                    <div className="pl-9">
                                        <MarkdownContent markdown={criteria.hint} />
                                    </div>
                                ) : (
                                    <div className="pl-9 text-sm text-muted italic">
                                        {t("task.criteriaNoHint")}
                                    </div>
                                )}
                            </Accordion.Body>
                        </Accordion.Panel>
                    </Accordion.Item>
                ))}
            </Accordion>
        </div>
    )
}

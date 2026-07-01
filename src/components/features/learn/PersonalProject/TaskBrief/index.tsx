"use client"

import React, { useMemo } from "react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import type { MilestoneTaskBrief } from "@/modules/types/entities/milestone"
import { usePersonalProjectGithubForm } from "@/hooks/zustand/personalProjectGithub/usePersonalProjectGithubForm"
import { useAppSelector } from "@/redux/hooks"

/** Props for {@link TaskBrief}. */
export type TaskBriefProps = WithClassNames<undefined>

/**
 * Pick the brief matching the selected language, falling back to the first brief (handles the
 * single `agnostic` brief used by FE/infra tasks).
 */
const pickBriefByLang = (
    briefs: Array<MilestoneTaskBrief>,
    lang: string,
): MilestoneTaskBrief | undefined =>
    briefs.find((brief) => brief.lang === lang) ?? briefs[0]

/**
 * The brief `body` is already resolved to the active locale by the backend resolver (one localized
 * body per language, no per-locale translation variants), so we read it directly.
 */
const resolveBriefBody = (
    brief: MilestoneTaskBrief | undefined,
): string => brief?.body ?? ""

/**
 * SCHEMA V2 learner-facing task brief. Renders the per-language Markdown instructions (with
 * `:::muted` callouts, fenced code and ```layout``` widgets) for the selected language, resolved to
 * the active locale. Renders nothing when there are no briefs (legacy tasks).
 *
 * Self-contained: reads `briefs` from redux task state and `lang` from the github form store.
 * @param props - optional className for the root element
 */
export const TaskBrief = ({
    className,
}: TaskBriefProps = {}) => {
    const t = useTranslations()
    const { lang } = usePersonalProjectGithubForm()

    const selectedTaskDetail = useAppSelector((state) => state.milestone.selectedTaskDetail)
    const selectedTaskId = useAppSelector((state) => state.milestone.selectedTaskId)
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

    const briefs = displayTask?.briefs ?? []

    const body = useMemo(
        () => resolveBriefBody(pickBriefByLang(briefs, lang)),
        [briefs, lang],
    )

    if (briefs.length === 0) {
        return null
    }

    return (
        // the brief IS a labeled card: "Hướng dẫn" is the label OUTSIDE, the markdown body inside.
        <LabeledCard className={className} label={t("task.briefTitle")}>
            <MarkdownContent markdown={body} />
        </LabeledCard>
    )
}

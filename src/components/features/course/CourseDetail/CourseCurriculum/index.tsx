"use client"

import React, {
    useMemo,
} from "react"
import {
    Accordion,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import _ from "lodash"
import {
    ListChecksIcon,
} from "@phosphor-icons/react"
import {
    ModuleAccordionItem,
} from "./ModuleAccordionItem"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryCourseSwr } from "@/hooks/swr/api/graphql/queries/useQueryCourseSwr"
import { useAppSelector } from "@/redux/hooks"

/** Props for {@link CourseCurriculum}. */
export type CourseCurriculumProps = WithClassNames<undefined>

/**
 * Curriculum section: every module as an accordion row (tier badge, premium lock,
 * lesson/minute meta, free preview bullets) so a prospect can scan exactly what's
 * inside. Self-contained (reads redux + the course SWR flags); hides when empty.
 *
 * @param props - optional className (placement only).
 */
export const CourseCurriculum = ({ className }: CourseCurriculumProps) => {
    const t = useTranslations()
    const { isLoading, error, mutate } = useQueryCourseSwr()
    const rawModules = useAppSelector((state) => state.course.entity?.modules)

    const modules = useMemo(
        () => _.cloneDeep(rawModules ?? []).sort((a, b) => a.sortIndex - b.sortIndex),
        [rawModules],
    )

    if (!isLoading && !error && modules.length === 0) {
        return null
    }

    return (
        <LabeledCard
            className={className}
            label={t("courseLanding.curriculum")}
            icon={<ListChecksIcon aria-hidden focusable="false" className="size-5" />}
            frameless
        >
            <AsyncContent
                isLoading={isLoading && modules.length === 0}
                skeleton={<Skeleton.Accordion items={3} />}
                error={error}
                errorContent={{
                    title: t("courseLanding.errorTitle"),
                    onRetry: () => mutate(),
                    retryLabel: t("courseLanding.retry"),
                }}
            >
                {/* Accordion Card: surface accordion đặt thẳng trên nền trang (frameless,
                    KHÔNG lồng trong Card → tránh surface-in-surface phẳng) + viền card.
                    Ref elements/card.md §3 + draft accordion-card-surface-on-standalone-pages. */}
                <Accordion variant="surface" className="overflow-hidden border border-default">
                    {modules.map((module) => (
                        <ModuleAccordionItem key={module.id} module={module} />
                    ))}
                </Accordion>
            </AsyncContent>
        </LabeledCard>
    )
}

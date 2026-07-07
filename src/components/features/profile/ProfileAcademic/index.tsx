"use client"

import React from "react"
import { useTranslations } from "next-intl"
import {
    BookBookmarkIcon,
    BuildingIcon,
    CalendarBlankIcon,
    ChartLineUpIcon,
    MapPinIcon,
} from "@phosphor-icons/react"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { MetricCard } from "@/components/blocks/stats/MetricCard"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import {
    useQueryProfileAcademicSwr,
    type ProfileAcademic as ProfileAcademicData,
} from "../hooks/useQueryProfileAcademicSwr"

/** Academic fields, in display order. */
const FIELDS: Array<{
    key: keyof ProfileAcademicData
    icon: React.ReactNode
}> = [
    { key: "university", icon: <BuildingIcon className="size-5 text-accent" aria-hidden focusable="false" /> },
    { key: "campus", icon: <MapPinIcon className="size-5 text-accent" aria-hidden focusable="false" /> },
    { key: "major", icon: <BookBookmarkIcon className="size-5 text-accent" aria-hidden focusable="false" /> },
    { key: "semester", icon: <CalendarBlankIcon className="size-5 text-accent" aria-hidden focusable="false" /> },
    { key: "gpa", icon: <ChartLineUpIcon className="size-5 text-accent" aria-hidden focusable="false" /> },
]

/** Skeleton mirroring the academic metric grid. */
const AcademicSkeleton = () => (
    <div className="flex flex-col gap-3">
        <Skeleton.Typography type="h6" width="1/3" />
        <div className="grid grid-cols-2 gap-3">
            <Skeleton.Metric />
            <Skeleton.Metric />
            <Skeleton.Metric />
            <Skeleton.Metric />
            <Skeleton.Metric className="col-span-2" />
        </div>
    </div>
)

/**
 * Academic section of the profile (§2). Redesigned as metric tiles inside a
 * labeled card instead of flat label:value rows.
 */
export const ProfileAcademic = () => {
    const t = useTranslations()
    const { academic, isLoading, error, mutate } = useQueryProfileAcademicSwr()

    return (
        <AsyncContent
            isLoading={isLoading && !academic}
            skeleton={<AcademicSkeleton />}
            error={!academic ? error : undefined}
            errorContent={{
                title: t("profile.loadingError"),
                retryLabel: t("profile.retry"),
                onRetry: () => void mutate(),
            }}
        >
            {academic ? (
                <LabeledCard label={t("profile.sections.academic")}>
                    {FIELDS.every((field) => !academic[field.key]) ? (
                        <EmptyContent title={t("profile.academic.empty.title")} />
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {FIELDS.map((field) => (
                                <MetricCard
                                    key={field.key}
                                    icon={field.icon}
                                    value={academic[field.key]}
                                    label={t(`profile.academic.fields.${field.key}`)}
                                    className={field.key === "gpa" ? "col-span-2" : undefined}
                                />
                            ))}
                        </div>
                    )}
                </LabeledCard>
            ) : null}
        </AsyncContent>
    )
}

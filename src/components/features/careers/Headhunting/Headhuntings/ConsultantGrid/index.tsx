"use client"

import React, { useMemo } from "react"
import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { ConsultantCard } from "../ConsultantCard"
import { ConsultantCardSkeleton } from "../ConsultantCardSkeleton"
import { useAppSelector } from "@/redux/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"

/** Number of placeholder cards shown while the consultant list loads. */
const SKELETON_COUNT = 6

/** Props for {@link ConsultantGrid}. */
export type ConsultantGridProps = WithClassNames<undefined>

/**
 * Responsive grid of consultant cards with loading + empty states.
 *
 * Container: reads the full consultant list from the `headhunter` redux slice
 * itself and derives the sorted order, so the parent renders `<ConsultantGrid />`.
 * @param props - {@link ConsultantGridProps}
 */
export const ConsultantGrid = ({ className }: ConsultantGridProps) => {
    const t = useTranslations()
    const consultants = useAppSelector((state) => state.headhunter.entities)

    const sortedConsultants = useMemo(() => {
        if (!consultants?.length) {
            return []
        }
        return [...consultants].sort((a, b) => a.sortIndex - b.sortIndex)
    }, [consultants])

    return (
        <AsyncContent
            isLoading={!consultants}
            skeleton={(
                <div className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
                    {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                        <ConsultantCardSkeleton key={index} />
                    ))}
                </div>
            )}
            isEmpty={sortedConsultants.length === 0}
            emptyContent={{ title: t("headhuntings.empty") }}
        >
            <div className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
                {sortedConsultants.map((consultant) => (
                    <ConsultantCard
                        key={consultant.id}
                        consultant={consultant}
                    />
                ))}
            </div>
        </AsyncContent>
    )
}

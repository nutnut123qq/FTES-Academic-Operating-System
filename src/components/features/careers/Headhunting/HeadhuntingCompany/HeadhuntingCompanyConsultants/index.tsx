"use client"

import React, { useMemo } from "react"
import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { ConsultantCard } from "../../Headhuntings/ConsultantCard"
import { ConsultantCardSkeleton } from "../../Headhuntings/ConsultantCardSkeleton"
import { useAppSelector } from "@/redux/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"

/** Number of placeholder cards shown while consultants load. */
const SKELETON_COUNT = 3

/** Props for {@link HeadhuntingCompanyConsultants}. */
export type HeadhuntingCompanyConsultantsProps = WithClassNames<undefined>

/**
 * Grid of consultant cards for one headhunting company.
 *
 * Self-contained section (single-use): reads all consultants and the active
 * company id from the `headhunter` redux slice (synced by the parent hook),
 * so the container renders `<HeadhuntingCompanyConsultants />` with no props.
 * @param props - {@link HeadhuntingCompanyConsultantsProps}
 */
export const HeadhuntingCompanyConsultants = ({ className }: HeadhuntingCompanyConsultantsProps) => {
    const t = useTranslations()
    const consultants = useAppSelector((state) => state.headhunter.entities)
    const companyId = useAppSelector((state) => state.headhunter.companyId)

    const companyConsultants = useMemo(() => {
        if (!consultants?.length || !companyId) {
            return []
        }
        return consultants
            .filter((entry) => (entry.company?.id ?? entry.companyId) === companyId)
            .sort((a, b) => a.sortIndex - b.sortIndex)
    }, [companyId, consultants])

    return (
        <AsyncContent
            isLoading={!consultants}
            skeleton={(
                <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
                    {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                        <ConsultantCardSkeleton key={index} />
                    ))}
                </div>
            )}
            isEmpty={companyConsultants.length === 0}
            emptyContent={{ title: t("headhuntings.empty") }}
        >
            <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
                {companyConsultants.map((consultant) => (
                    <ConsultantCard
                        key={consultant.id}
                        consultant={consultant}
                    />
                ))}
            </div>
        </AsyncContent>
    )
}

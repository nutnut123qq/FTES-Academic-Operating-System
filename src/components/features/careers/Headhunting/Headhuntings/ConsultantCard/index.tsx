"use client"

import React, { useCallback, useMemo } from "react"
import { Link, Typography } from "@heroui/react"
import { BuildingsIcon } from "@phosphor-icons/react"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { ConsultantAvatar } from "../ConsultantAvatar"
import { useOpenHeadhunterDetail } from "../../hooks"
import type { ConsultantEntity } from "@/modules/types/entities/consultant"
import { pathConfig } from "@/resources/path"
import { useAppSelector } from "@/redux/hooks"
import { PressableCard } from "@/components/blocks/cards/PressableCard"

/** Props for {@link ConsultantCard}. */
export interface ConsultantCardProps extends WithClassNames<undefined> {
    /** Consultant row from API / Redux. */
    consultant: ConsultantEntity
}

/**
 * Card for one consultant: opens the profile modal; company name navigates to
 * the company page. List-item block — the parent passes the entity via props.
 * @param props - {@link ConsultantCardProps}
 */
export const ConsultantCard = ({ consultant, className }: ConsultantCardProps) => {
    const locale = useLocale()
    const router = useRouter()
    const courseDisplayId = useAppSelector((state) => state.course.displayId)
    const openHeadhunterDetail = useOpenHeadhunterDetail()

    const companyTitle = useMemo(
        () => consultant.company?.title ?? "",
        [consultant.company?.title],
    )

    /** Open this consultant's profile modal. */
    const onOpenDetail = useCallback(
        () => openHeadhunterDetail(consultant),
        [openHeadhunterDetail, consultant],
    )

    /** Navigate to the consultant's company page. */
    const onOpenCompany = useCallback(() => {
        const companyId = consultant.company?.id ?? consultant.companyId
        if (!companyId || !courseDisplayId) {
            return
        }
        router.push(
            pathConfig()
                .locale(locale)
                .course(courseDisplayId)
                .headhuntingCompanies(companyId)
                .build(),
        )
    }, [
        consultant.company?.id,
        consultant.companyId,
        courseDisplayId,
        locale,
        router,
    ])

    return (
        <PressableCard
            className={className}
            onPress={onOpenDetail}
        >
            <div className="flex flex-col gap-3">
                <ConsultantAvatar
                    avatarUrl={consultant.avatarUrl}
                    fullName={consultant.fullName}
                    size="card"
                    className="rounded-2xl"
                />
                <div className="flex flex-col gap-2">
                    <Typography type="h5" weight="semibold">{consultant.fullName}</Typography>
                    {consultant.jobTitle ? (
                        <Typography type="body-sm" color="muted">{consultant.jobTitle}</Typography>
                    ) : null}
                    {companyTitle ? (
                        <Link
                            onPress={onOpenCompany}
                            className="inline-flex w-fit cursor-pointer items-center gap-2 text-accent"
                        >
                            <BuildingsIcon aria-hidden focusable="false" className="size-5 shrink-0" />
                            <Typography type="body-sm" weight="medium" className="text-accent">{companyTitle}</Typography>
                        </Link>
                    ) : null}
                    {consultant.description ? (
                        <Typography type="body-sm" color="muted" className="line-clamp-3">
                            {consultant.description}
                        </Typography>
                    ) : null}
                </div>
            </div>
        </PressableCard>
    )
}

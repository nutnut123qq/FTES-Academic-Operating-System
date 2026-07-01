"use client"

import React from "react"
import {
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    CaretLeftIcon,
    CaretRightIcon,
} from "@phosphor-icons/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    useLessonNavigation,
} from "../hooks/useLessonNavigation"
import { PressableCard } from "@/components/blocks/cards/PressableCard"

/** Props for {@link LessonPager}. */
export type LessonPagerProps = WithClassNames<undefined>

/**
 * Previous / next lesson pager shown at the foot of the reader: two navigation
 * cards that move through the course in its linear order (the prev card aligns
 * left, the next card right). Self-contained — reads the linear position from
 * {@link useLessonNavigation} and renders nothing when neither neighbour exists.
 *
 * @param props - {@link LessonPager}
 */
export const LessonPager = ({ className }: LessonPagerProps) => {
    const t = useTranslations()
    const { previous, next } = useLessonNavigation()

    if (!previous && !next) {
        return null
    }

    return (
        <div className={className}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* previous — left aligned; empty cell keeps next pinned right */}
                {previous ? (
                    <PressableCard href={previous.href}>
                        <div className="flex items-center gap-2">
                            <CaretLeftIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                            <div className="flex min-w-0 flex-col gap-0">
                                <Typography type="body-xs" color="muted">
                                    {t("content.prevLesson")}
                                </Typography>
                                <Typography type="body-sm" weight="medium" truncate>
                                    {previous.title}
                                </Typography>
                            </div>
                        </div>
                    </PressableCard>
                ) : (
                    <div />
                )}

                {/* next — right aligned */}
                {next ? (
                    <PressableCard href={next.href} className="col-start-2">
                        <div className="flex items-center justify-end gap-2">
                            <div className="flex min-w-0 flex-col gap-0">
                                <Typography type="body-xs" color="muted" align="end">
                                    {t("content.nextLesson")}
                                </Typography>
                                <Typography type="body-sm" weight="medium" align="end" truncate>
                                    {next.title}
                                </Typography>
                            </div>
                            <CaretRightIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                        </div>
                    </PressableCard>
                ) : null}
            </div>
        </div>
    )
}

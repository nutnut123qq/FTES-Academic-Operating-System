"use client"

import React, {
    useEffect,
    useMemo,
} from "react"
import {
    cn,
    Drawer,
    ScrollShadow,
} from "@heroui/react"
import { useSmViewpoint } from "@/hooks/reuseables/useSmViewpoint"
import { dayjs } from "@/modules/dayjs"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import { PersonalProjectAttemptCard } from "./PersonalProjectAttemptCard"
import { PersonalProjectAttemptsSkeleton } from "./PersonalProjectAttemptsSkeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { usePersonalProjectTaskAttemptsDrawerOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useQueryUserPersonalTaskAttemptsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserPersonalTaskAttemptsSwr"
import type { UserMilestoneTaskAttemptEntity } from "@/modules/types/entities/user-milestone-task"

type AttemptRow = {
    /** Stable row key. */
    key: string
    /** Attempt entity fields used by the card. */
    attempt: UserMilestoneTaskAttemptEntity
    /** Formatted processed time. */
    processedAtLabel: string
}

/** Props for {@link PersonalProjectTaskAttemptsDrawer}. Container — only layout className. */
export type PersonalProjectTaskAttemptsDrawerProps = WithClassNames<undefined>

/**
 * Drawer listing AI review attempts for the selected personal-project milestone task.
 * Mirrors {@link UserCvSubmissionAttemptsDrawer} layout without server pagination.
 */
export const PersonalProjectTaskAttemptsDrawer = (props: PersonalProjectTaskAttemptsDrawerProps = {}) => {
    const { className } = props
    const t = useTranslations()
    const locale = useLocale()
    const {
        isOpen,
        setOpen,
    } = usePersonalProjectTaskAttemptsDrawerOverlayState()
    const { isMobile } = useSmViewpoint()
    const swr = useQueryUserPersonalTaskAttemptsSwr()
    const attemptList = swr.data?.data
    const dayjsLocale = locale.startsWith("vi") ? "vi" : "en"

    const rows: Array<AttemptRow> = useMemo(
        () => (attemptList ?? []).map((attempt) => {
            const raw = attempt.processedAt
            const d = raw ? dayjs(raw) : null
            const processedAtLabel = d?.isValid()
                ? d.locale(dayjsLocale).format("HH:mm, D MMMM YYYY")
                : t("cv.submission.submittedAtPending")
            return {
                key: attempt.id,
                attempt,
                processedAtLabel,
            }
        }),
        [
            attemptList,
            dayjsLocale,
            t,
        ],
    )

    useEffect(
        () => {
            if (!isOpen) {
                return
            }
            void swr.mutate()
        },
        [
            isOpen,
            swr,
        ],
    )

    const showSkeleton = isOpen && swr.isLoading && !(attemptList?.length) && !swr.error

    if (!isOpen) {
        return null
    }

    return (
        <Drawer>
            <Drawer.Backdrop
                isOpen
                onOpenChange={setOpen}
            >
                <Drawer.Content placement={isMobile ? "bottom" : "right"}>
                    <Drawer.Dialog className={cn("flex h-full flex-col p-0", className)}>
                        <div className="shrink-0 p-3">
                            <Drawer.CloseTrigger />
                            <Drawer.Header>
                                <Drawer.Heading>
                                    {t("finalProject.page.attemptsDrawer.title")}
                                </Drawer.Heading>
                            </Drawer.Header>
                        </div>
                        <Drawer.Body className="flex min-h-0 flex-1 flex-col">
                            {
                                swr.error ? (
                                    <div className="p-3 text-sm text-danger">
                                        {t("finalProject.page.attemptsDrawer.loadError")}
                                    </div>
                                ) : showSkeleton ? (
                                    <PersonalProjectAttemptsSkeleton />
                                ) : rows.length ? (
                                    <ScrollShadow
                                        className="min-h-0 flex-1 overflow-x-hidden p-3"
                                        hideScrollBar
                                    >
                                        <div className="flex flex-col gap-3">
                                            {rows.map((row) => (
                                                <PersonalProjectAttemptCard
                                                    key={row.key}
                                                    attemptNumber={row.attempt.attemptNumber}
                                                    score={row.attempt.score ?? null}
                                                    shortFeedback={row.attempt.shortFeedback}
                                                    processedAtLabel={row.processedAtLabel}
                                                />
                                            ))}
                                        </div>
                                    </ScrollShadow>
                                ) : (
                                    <div className="p-6 text-center text-sm text-muted">
                                        {t("finalProject.page.attemptsDrawer.empty")}
                                    </div>
                                )
                            }
                        </Drawer.Body>
                    </Drawer.Dialog>
                </Drawer.Content>
            </Drawer.Backdrop>
        </Drawer>
    )
}

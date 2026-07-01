"use client"

import React, {
    useMemo,
} from "react"
import {
    Accordion,
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import _ from "lodash"
import {
    QuestionIcon,
} from "@phosphor-icons/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useQueryCourseSwr } from "@/hooks/swr/api/graphql/queries/useQueryCourseSwr"
import { useAppSelector } from "@/redux/hooks"

/** Props for {@link CourseFaq}. */
export type CourseFaqProps = WithClassNames<undefined>

/**
 * FAQ section: the course Q&A pairs as an accordion (markdown answers). Removes a
 * common objection before the buy decision. Self-contained (reads redux + the
 * course SWR flags); hides entirely when the course has no Q&A.
 *
 * @param props - optional className (placement only).
 */
export const CourseFaq = ({ className }: CourseFaqProps) => {
    const t = useTranslations()
    const { isLoading, error, mutate } = useQueryCourseSwr()
    const rawQnas = useAppSelector((state) => state.course.entity?.qnas)

    const qnas = useMemo(
        () => _.cloneDeep(rawQnas ?? []).sort((a, b) => a.sortIndex - b.sortIndex),
        [rawQnas],
    )

    if (!isLoading && !error && qnas.length === 0) {
        return null
    }

    return (
        <LabeledCard
            className={className}
            label={t("courseLanding.faq")}
            icon={<QuestionIcon aria-hidden focusable="false" className="size-5" />}
            frameless
        >
            <AsyncContent
                isLoading={isLoading && qnas.length === 0}
                skeleton={<Skeleton.Accordion items={3} />}
                error={error}
                errorContent={{
                    title: t("courseLanding.errorTitle"),
                    onRetry: () => mutate(),
                    retryLabel: t("courseLanding.retry"),
                }}
            >
                {/* Accordion Card (xem elements/card.md §3): surface accordion frameless + viền. */}
                <Accordion variant="surface" className="overflow-hidden border border-default">
                    {qnas.map((qna) => (
                        <Accordion.Item key={qna.id} aria-label={qna.question}>
                            <Accordion.Heading>
                                <Accordion.Trigger>
                                    <Typography type="body-sm" weight="medium">
                                        {qna.question}
                                    </Typography>
                                </Accordion.Trigger>
                            </Accordion.Heading>
                            <Accordion.Panel>
                                <Accordion.Body>
                                    <MarkdownContent markdown={qna.answer} />
                                </Accordion.Body>
                            </Accordion.Panel>
                        </Accordion.Item>
                    ))}
                </Accordion>
            </AsyncContent>
        </LabeledCard>
    )
}

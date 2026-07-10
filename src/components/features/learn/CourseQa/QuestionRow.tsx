"use client"

import React, { useState } from "react"
import { Card, CardContent, Chip, Typography, cn } from "@heroui/react"
import { CaretDownIcon, CheckCircleIcon, ChatCircleIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { CommentComposer } from "@/components/reuseable/Discussion/CommentComposer"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"
import type { CourseQuestion } from "./types"

/** Props for {@link QuestionRow}. */
export interface QuestionRowProps {
    question: CourseQuestion
    currentUser: { username: string; avatar?: string } | null
    /** Post an answer to this question, then revalidate the list. */
    onAnswer: (body: string) => void
}

/**
 * One question card in the roll-up: author + relative time, the question body, the
 * lesson it was asked on, and an expandable answers thread (with a founder badge) +
 * an inline answer composer. Presentational; answer persistence is delegated.
 */
export const QuestionRow = ({ question, currentUser, onAnswer }: QuestionRowProps) => {
    const t = useTranslations("learn")
    const locale = useLocale()
    const [expanded, setExpanded] = useState(false)
    const answerCount = question.answers.length

    return (
        <Card>
            <CardContent className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                    <UserAvatar username={question.authorUsername} seed={question.authorUsername} size="sm" className="size-8 shrink-0" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <Typography type="body-sm" weight="medium">{question.authorName}</Typography>
                            <Typography type="body-xs" color="muted">{formatRelativeTime(question.createdAt, locale)}</Typography>
                            {question.lessonTitle ? (
                                <Chip size="sm" variant="soft">{question.lessonTitle}</Chip>
                            ) : null}
                        </div>
                        <Typography type="body-sm">{question.body}</Typography>
                    </div>
                </div>

                {/* answers toggle */}
                <button
                    type="button"
                    onClick={() => setExpanded((prev) => !prev)}
                    className="flex items-center gap-2 self-start rounded-full text-xs text-muted outline-none transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
                >
                    <ChatCircleIcon aria-hidden focusable="false" className="size-4" />
                    {t("courseQa.answerCount", { count: answerCount })}
                    <CaretDownIcon aria-hidden focusable="false" className={cn("size-3 transition-transform", expanded && "rotate-180")} />
                </button>

                {expanded ? (
                    <div className="flex flex-col gap-3 border-t border-separator pt-3">
                        {question.answers.map((answer) => (
                            <div key={answer.id} className="flex items-start gap-3">
                                <UserAvatar username={answer.authorUsername} seed={answer.authorUsername} size="sm" className="size-8 shrink-0" />
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Typography type="body-sm" weight="medium">{answer.authorName}</Typography>
                                        {answer.isFounder ? (
                                            <Chip size="sm" variant="soft" color="accent">
                                                <span className="flex items-center gap-1">
                                                    <CheckCircleIcon aria-hidden focusable="false" weight="fill" className="size-3" />
                                                    {t("courseQa.founder")}
                                                </span>
                                            </Chip>
                                        ) : null}
                                        <Typography type="body-xs" color="muted">{formatRelativeTime(answer.createdAt, locale)}</Typography>
                                    </div>
                                    <Typography type="body-sm" color="muted">{answer.body}</Typography>
                                </div>
                            </div>
                        ))}
                        <CommentComposer
                            currentUser={currentUser}
                            placeholder={t("courseQa.answerPlaceholder")}
                            submitLabel={t("courseQa.answerSubmit")}
                            onSubmit={(body) => onAnswer(body)}
                        />
                    </div>
                ) : null}
            </CardContent>
        </Card>
    )
}

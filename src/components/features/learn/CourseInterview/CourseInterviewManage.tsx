"use client"

import React, { useMemo, useState } from "react"
import { Button, Chip, Input, Label, TextArea, TextField, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useGetInterviewTemplateSwr } from "@/hooks/swr/api/rest/queries/useGetInterviewTemplateSwr"
import { usePostGenerateInterviewTemplateSwr } from "@/hooks/swr/api/rest/mutations/usePostGenerateInterviewTemplateSwr"
import type { InterviewQuestionSetStatus } from "@/modules/api/rest/interview"

/** Props for {@link CourseInterviewManage}. */
export interface CourseInterviewManageProps {
    courseId: string
}

const DEFAULT_COUNTS = { oral: 2, mcq: 3, essay: 2 }
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const
const LANGUAGES = ["vi", "en"] as const
const POLL_INTERVAL_MS = 3000

/**
 * Lecturer-facing management panel for a course's AI interview question set.
 *
 * Lets the lecturer generate/regenerate the question set and preview the full
 * lecturer view (prompt, options, answer key, rubric) while generation is in
 * progress or after it completes.
 */
export const CourseInterviewManage = ({ courseId }: CourseInterviewManageProps) => {
    const t = useTranslations("learn")
    const generate = usePostGenerateInterviewTemplateSwr()

    const [title, setTitle] = useState("")
    const [counts, setCounts] = useState(DEFAULT_COUNTS)
    const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM")
    const [language, setLanguage] = useState<"vi" | "en">("vi")
    const [context, setContext] = useState("")
    const [forbidden, setForbidden] = useState(false)
    const [failed, setFailed] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)

    const template = useGetInterviewTemplateSwr(courseId, {
        refreshInterval: (data) => {
            const status = data?.questionSet?.status as InterviewQuestionSetStatus | undefined
            return status === "GENERATING" ? POLL_INTERVAL_MS : 0
        },
    })

    const status = template.data?.questionSet?.status as InterviewQuestionSetStatus | undefined
    const questionSet = template.data?.questionSet
    const questions = questionSet?.questions ?? []

    // The GET template endpoint returns the latest active question set; it does not
    // expose the requested counts, so we derive actual counts from the questions and
    // fall back to the form values while generating or when the set is empty.
    // TODO: render backend-provided counts if the GET response adds them.
    const displayedCounts = useMemo(() => {
        if (questions.length === 0) return counts
        const actual = { oral: 0, mcq: 0, essay: 0 }
        for (const question of questions) {
            if (question.type === "ORAL") actual.oral += 1
            else if (question.type === "MCQ") actual.mcq += 1
            else if (question.type === "ESSAY") actual.essay += 1
        }
        return actual
    }, [questions, counts])

    const handleCountChange = (key: keyof typeof counts, value: string) => {
        const parsed = Number.parseInt(value, 10)
        setCounts((prev) => ({ ...prev, [key]: Number.isNaN(parsed) ? 0 : Math.max(0, parsed) }))
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!courseId) return

        setForbidden(false)
        setFailed(false)
        setPreviewOpen(false)

        try {
            await generate.trigger({
                courseRef: courseId,
                title: title.trim() || t("courseInterview.manage.defaultTitle"),
                counts: {
                    oral: counts.oral,
                    mcq: counts.mcq,
                    essay: counts.essay,
                },
                difficulty,
                language,
                context: context.trim() || undefined,
            })
            void template.mutate()
        } catch (error) {
            const message = error instanceof Error ? error.message : ""
            if (message.includes("AI_COURSE_FORBIDDEN") || message.includes("403")) {
                setForbidden(true)
            } else {
                setFailed(true)
            }
        }
    }

    const statusColor =
        status === "READY" ? "success" : status === "FAILED" ? "danger" : "warning"

    const skeleton = (
        <div className="flex flex-col gap-6 rounded-2xl border border-default bg-surface p-4">
            <Skeleton.Typography type="body-sm" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Skeleton.Input />
                <Skeleton.Input />
                <Skeleton.Input />
            </div>
            <Skeleton.TextArea />
            <Skeleton.Button />
        </div>
    )

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <Typography type="h4">{t("courseInterview.manage.title")}</Typography>
                <Typography type="body-sm" color="muted">{t("courseInterview.manage.subtitle")}</Typography>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-default bg-surface p-4">
                <TextField variant="primary" className="w-full">
                    <Label htmlFor="interview-title" className="text-sm">
                        {t("courseInterview.manage.titleField")}
                    </Label>
                    <Input
                        id="interview-title"
                        type="text"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder={t("courseInterview.manage.titlePlaceholder")}
                    />
                </TextField>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {(["oral", "mcq", "essay"] as const).map((key) => (
                        <TextField key={key} variant="primary" className="w-full">
                            <Label htmlFor={`interview-count-${key}`} className="text-sm">
                                {t(`courseInterview.manage.counts.${key}`)}
                            </Label>
                            <Input
                                id={`interview-count-${key}`}
                                type="number"
                                min={0}
                                value={counts[key]}
                                onChange={(event) => handleCountChange(key, event.target.value)}
                            />
                        </TextField>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="interview-difficulty" className="text-sm">
                            {t("courseInterview.manage.difficultyField")}
                        </Label>
                        <select
                            id="interview-difficulty"
                            value={difficulty}
                            onChange={(event) => setDifficulty(event.target.value as "EASY" | "MEDIUM" | "HARD")}
                            className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none focus:border-accent"
                        >
                            {DIFFICULTIES.map((option) => (
                                <option key={option} value={option}>
                                    {t(`courseInterview.manage.difficulty.${option}`)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="interview-language" className="text-sm">
                            {t("courseInterview.manage.languageField")}
                        </Label>
                        <select
                            id="interview-language"
                            value={language}
                            onChange={(event) => setLanguage(event.target.value as "vi" | "en")}
                            className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none focus:border-accent"
                        >
                            {LANGUAGES.map((option) => (
                                <option key={option} value={option}>
                                    {t(`courseInterview.manage.language.${option}`)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <TextField variant="primary" className="w-full">
                    <Label htmlFor="interview-context" className="text-sm">
                        {t("courseInterview.manage.contextField")}
                    </Label>
                    <TextArea
                        id="interview-context"
                        rows={4}
                        value={context}
                        onChange={(event) => setContext(event.target.value)}
                        placeholder={t("courseInterview.manage.contextPlaceholder")}
                        className="resize-none"
                    />
                </TextField>

                {forbidden ? (
                    <div className="flex flex-col gap-2 rounded-2xl border border-warning bg-warning/10 p-4">
                        <Typography type="body-sm" weight="semibold">{t("courseInterview.manage.forbiddenTitle")}</Typography>
                        <Typography type="body-xs" color="muted">{t("courseInterview.manage.forbiddenBody")}</Typography>
                    </div>
                ) : null}

                {failed ? (
                    <Typography type="body-xs" className="text-danger">{t("courseInterview.manage.generateFailed")}</Typography>
                ) : null}

                <div>
                    <Button
                        type="submit"
                        variant="primary"
                        isDisabled={generate.isMutating || !courseId}
                        isPending={generate.isMutating}
                    >
                        {t("courseInterview.manage.generate")}
                    </Button>
                </div>
            </form>

            <AsyncContent
                isLoading={!template.data && !template.error}
                skeleton={skeleton}
                error={!template.data ? template.error : undefined}
                errorContent={{
                    title: t("courseInterview.errorTitle"),
                    onRetry: () => { void template.mutate() },
                    retryLabel: t("courseInterview.retry"),
                }}
            >
                <div className="flex flex-col gap-4 rounded-2xl border border-default bg-surface p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Typography type="body-sm" weight="semibold">{t("courseInterview.manage.statusLabel")}</Typography>
                            <Chip color={statusColor} variant="soft">
                                {status ? t(`courseInterview.manage.status.${status}`) : t("courseInterview.manage.status.UNKNOWN")}
                            </Chip>
                        </div>
                        {status === "GENERATING" ? (
                            <div className="size-4 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-hidden="true" />
                        ) : null}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {(["oral", "mcq", "essay"] as const).map((key) => (
                            <div key={key} className="rounded-xl border border-default p-2 text-center">
                                <Typography type="body-xs" color="muted">{t(`courseInterview.manage.counts.${key}`)}</Typography>
                                <Typography type="body-sm" weight="semibold">{displayedCounts[key]}</Typography>
                            </div>
                        ))}
                    </div>

                    {status === "FAILED" ? (
                        <Typography type="body-xs" className="text-danger">{t("courseInterview.manage.failedHint")}</Typography>
                    ) : null}

                    {status === "READY" && questions.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            <Button
                                variant="tertiary"
                                size="sm"
                                onPress={() => setPreviewOpen((prev) => !prev)}
                            >
                                {previewOpen ? t("courseInterview.manage.hidePreview") : t("courseInterview.manage.showPreview")}
                            </Button>

                            {previewOpen ? (
                                <div className="flex flex-col gap-4">
                                    {questions.map((question, index) => (
                                        <div
                                            key={question.id ?? `question-${index}`}
                                            className="flex flex-col gap-2 rounded-xl border border-default p-3"
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Typography type="body-xs" color="muted">
                                                    {t("courseInterview.questionN", { n: index + 1 })}
                                                </Typography>
                                                <Chip size="sm" variant="soft" color="accent">
                                                    {t(`courseInterview.type.${question.type}`)}
                                                </Chip>
                                            </div>
                                            <Typography type="body-sm">{question.prompt}</Typography>

                                            {question.options && question.options.length > 0 ? (
                                                <ul className="flex list-none flex-col gap-1 pl-0">
                                                    {question.options.map((option, optionIndex) => (
                                                        <li key={optionIndex} className="flex gap-2 text-sm text-foreground">
                                                            <span className="text-muted">{String.fromCharCode(65 + optionIndex)}.</span>
                                                            <span>{option}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : null}

                                            {question.answerKey ? (
                                                <div className="flex flex-col gap-1">
                                                    <Typography type="body-xs" weight="semibold" className="text-success">
                                                        {t("courseInterview.manage.answerKey")}
                                                    </Typography>
                                                    <Typography type="body-xs" color="muted">{question.answerKey}</Typography>
                                                </div>
                                            ) : null}

                                            {question.rubric ? (
                                                <div className="flex flex-col gap-1">
                                                    <Typography type="body-xs" weight="semibold">
                                                        {t("courseInterview.manage.rubric")}
                                                    </Typography>
                                                    <Typography type="body-xs" color="muted">{question.rubric}</Typography>
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    {status === "READY" && questions.length === 0 ? (
                        <Typography type="body-xs" color="muted">{t("courseInterview.emptyQuestions")}</Typography>
                    ) : null}
                </div>
            </AsyncContent>
        </div>
    )
}

export default CourseInterviewManage

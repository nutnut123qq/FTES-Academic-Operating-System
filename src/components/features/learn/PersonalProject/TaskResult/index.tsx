"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
    Accordion,
    Button,
    Chip,
    Label,
    Link,
    Typography,
    cn,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation"
import {
    ArrowLeftIcon,
    ArrowSquareOutIcon,
    InfoIcon,
    LightbulbIcon,
    MapPinIcon,
    WarningCircleIcon,
} from "@phosphor-icons/react"
import { dayjs, getTimeAgoLabel, getTimeAgoMessage } from "@/modules/dayjs"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { ModelByline, VerdictIcon } from "@/components/blocks/grading/GradingByline"
import { FlexWrapButtonRadio } from "@/components/blocks/navigation/FlexWrapButtonRadio"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { PersonalProjectTaskResultHistoryDrawer } from "@/components/drawers/PersonalProjectTaskResultHistoryDrawer"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useQueryUserPersonalTaskAttemptsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserPersonalTaskAttemptsSwr"
import { useQueryUserPersonalTaskAttemptFeedbacksSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserPersonalTaskAttemptFeedbacksSwr"
import { useQueryMilestoneTaskSwr } from "@/hooks/swr/api/graphql/queries/useQueryMilestoneTaskSwr"
import { useQueryAiModelsSwr } from "@/hooks/swr/api/graphql/queries/useQueryAiModelsSwr"
import { usePersonalProjectGithubStore } from "@/hooks/zustand/personalProjectGithub/store"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setSelectedAttemptId } from "@/redux/slices/milestone"
import { MilestoneSeverity } from "@/modules/types/enums/milestone-severity"
import type { AiModelCategory } from "@/modules/api/graphql/queries/query-ai-models"
import type { UserMilestoneTaskAttemptEntity, UserMilestoneTaskAttemptFeedbackEntity } from "@/modules/types/entities/user-milestone-task"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link PersonalProjectTaskResult}. */
export type PersonalProjectTaskResultProps = WithClassNames<undefined>

/** Icon + tone per finding severity (drives the accordion item header). */
const SEVERITY_VISUAL: Record<MilestoneSeverity, { Icon: typeof WarningCircleIcon, text: string, rank: number }> = {
    [MilestoneSeverity.High]: { Icon: WarningCircleIcon, text: "text-danger", rank: 0 },
    [MilestoneSeverity.Medium]: { Icon: WarningCircleIcon, text: "text-warning", rank: 1 },
    [MilestoneSeverity.Low]: { Icon: InfoIcon, text: "text-muted", rank: 2 },
}

/** Render up to this many attempt buttons inline; beyond it, show the newest few + a "+N" overflow. */
const ATTEMPT_CHIPS_MAX = 6
/** When overflowing, how many newest buttons stay visible. */
const ATTEMPT_CHIPS_VISIBLE = 5

/**
 * One finding as an accordion item: header = severity icon + (clamped) message +
 * file location; expanding reveals the linked file location and the suggested fix.
 * Personal-project feedback has no `detail` field, so the panel is location +
 * suggestion only.
 *
 * @param props - the finding + the repo URL used to deep-link its file location.
 */
const FindingAccordionItem = ({
    feedback,
    repositoryUrl,
}: {
    feedback: UserMilestoneTaskAttemptFeedbackEntity
    repositoryUrl?: string
}) => {
    const visual = SEVERITY_VISUAL[feedback.severity] ?? SEVERITY_VISUAL[MilestoneSeverity.Medium]
    const { Icon } = visual
    const locationHref = feedback.location && repositoryUrl
        ? `${repositoryUrl.replace(/\.git$/, "")}/blob/HEAD/${feedback.location.replace(/^\//, "")}`
        : undefined

    return (
        <Accordion.Item id={feedback.id} aria-label={feedback.message}>
            <Accordion.Heading>
                <Accordion.Trigger className="w-full">
                    <div className="flex w-full items-center gap-3 text-start">
                        <Icon aria-hidden focusable="false" className={cn("size-4 shrink-0", visual.text)} />
                        <MarkdownContent
                            markdown={feedback.message}
                            className="min-w-0 flex-1 text-sm [&_p]:m-0 [&_p]:line-clamp-1"
                        />
                        {feedback.location ? (
                            <Chip size="sm" className="hidden max-w-[34%] shrink-0 sm:inline-flex">
                                <Chip.Label className="truncate">{feedback.location}</Chip.Label>
                            </Chip>
                        ) : null}
                        <Accordion.Indicator />
                    </div>
                </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
                <Accordion.Body>
                    <div className="flex flex-col gap-2">
                        {feedback.location ? (
                            <div className="flex items-center gap-2 text-xs text-muted">
                                <MapPinIcon aria-hidden focusable="false" className="size-4 shrink-0" />
                                {locationHref ? (
                                    <Link href={locationHref} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                        {feedback.location}
                                    </Link>
                                ) : (
                                    <span>{feedback.location}</span>
                                )}
                            </div>
                        ) : null}
                        {feedback.suggestion ? (
                            <div className="flex items-start gap-2">
                                <LightbulbIcon aria-hidden focusable="false" className="mt-0.5 size-4 shrink-0 text-muted" />
                                <MarkdownContent markdown={feedback.suggestion} className="text-sm text-muted [&_p]:m-0" />
                            </div>
                        ) : null}
                    </div>
                </Accordion.Body>
            </Accordion.Panel>
        </Accordion.Item>
    )
}

/**
 * Personal-project task result page (quality-gate report) — mirrors the challenge
 * `SubmissionResult`. PageHeader (back to the task + task title) → attempt selector
 * (`FlexWrapButtonRadio` + history drawer) → two {@link LabeledCard}s: "Kết quả"
 * (score hero + verdict from `attempt.passed` + the AI model that graded it) and
 * "Góp ý" (findings accordion). Reads `?attempt=` (defaults newest); the selected
 * attempt drives the feedbacks query via redux `selectedAttemptId`.
 *
 * @param props - optional root className (placement only).
 */
export const PersonalProjectTaskResult = ({
    className,
}: PersonalProjectTaskResultProps) => {
    const t = useTranslations()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const dispatch = useAppDispatch()
    const [historyOpen, setHistoryOpen] = useState(false)

    const attemptParam = searchParams.get("attempt")

    // hydrate the selected task detail (title / description / maxScore) into redux
    useQueryMilestoneTaskSwr()
    const selectedTaskDetail = useAppSelector((state) => state.milestone.selectedTaskDetail)
    const maxScore = selectedTaskDetail?.maxScore ?? 0
    const githubUrl = usePersonalProjectGithubStore((state) => state.githubUrl)

    const attemptsSwr = useQueryUserPersonalTaskAttemptsSwr()
    const attempts = useMemo<Array<UserMilestoneTaskAttemptEntity>>(
        () => attemptsSwr.data?.data ?? [],
        [attemptsSwr.data],
    )
    // newest attempt is first (attemptNumber DESC); honour `?attempt=` when present
    const selectedAttempt = useMemo(
        () => (attemptParam ? attempts.find((attempt) => attempt.id === attemptParam) : undefined) ?? attempts[0],
        [attempts, attemptParam],
    )

    // the feedbacks hook is gated on redux `selectedAttemptId` — keep it in sync
    useEffect(() => {
        dispatch(setSelectedAttemptId(selectedAttempt?.id))
    }, [dispatch, selectedAttempt?.id])

    const feedbacksSwr = useQueryUserPersonalTaskAttemptFeedbacksSwr()
    const feedbacks = useMemo<Array<UserMilestoneTaskAttemptFeedbackEntity>>(
        () => feedbacksSwr.data?.data ?? [],
        [feedbacksSwr.data],
    )

    // model catalog → map every served model id to its cost/quality tier (chip)
    const aiModelsSwr = useQueryAiModelsSwr()
    const modelCategoryMap = useMemo(() => {
        const map = new Map<string, AiModelCategory>()
        for (const model of aiModelsSwr.data?.aiModels?.data?.gradableModels ?? []) {
            map.set(model.model, model.category)
        }
        return map
    }, [aiModelsSwr.data])
    const servedCategory = selectedAttempt?.servedModel ? modelCategoryMap.get(selectedAttempt.servedModel) : undefined

    // findings sorted by severity (high → low), then by their stored order
    const sortedFeedbacks = useMemo(
        () => [...feedbacks].sort((a, b) => {
            const rankDiff = (SEVERITY_VISUAL[a.severity]?.rank ?? 1) - (SEVERITY_VISUAL[b.severity]?.rank ?? 1)
            return rankDiff !== 0 ? rankDiff : (a.sortIndex ?? 0) - (b.sortIndex ?? 0)
        }),
        [feedbacks],
    )

    // selector: render up to ATTEMPT_CHIPS_MAX; beyond that show the newest few + "+N"
    const isOverflow = attempts.length > ATTEMPT_CHIPS_MAX
    const visibleAttempts = isOverflow ? attempts.slice(0, ATTEMPT_CHIPS_VISIBLE) : attempts
    const overflowCount = attempts.length - visibleAttempts.length

    /** Back to the task page (strip the trailing /result). */
    const taskHref = pathname.replace(/\/result\/?$/, "")
    /** URL that selects a given attempt on this result page. */
    const attemptHref = (id: string) => `${pathname}?attempt=${id}`

    const scoreLabel = (score: number | null) => (maxScore > 0 ? `${score ?? 0}/${maxScore}` : `${score ?? 0}`)

    const attemptsLoading = attemptsSwr.data === null || attemptsSwr.data === undefined ? !attemptsSwr.error : false
    const feedbacksLoading = feedbacksSwr.data === null || feedbacksSwr.data === undefined ? !feedbacksSwr.error : false

    const passing = selectedAttempt?.passed ?? false
    const timeAgo = selectedAttempt?.processedAt
        ? getTimeAgoLabel(getTimeAgoMessage(dayjs(selectedAttempt.processedAt)), t)
        : null

    return (
        // PageHeader (header) → content cluster, gap-10. No p-6 here — the learn
        // shell already pads the PP content column (unlike the full-bleed challenge layout).
        <div className={cn("mx-auto flex w-full max-w-5xl flex-col gap-10", className)}>
            <PageHeader
                breadcrumb={(
                    <Link
                        onPress={() => router.push(taskHref)}
                        className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted"
                    >
                        <ArrowLeftIcon aria-hidden focusable="false" className="size-5" />
                        {t("personalProjectResult.backToTask")}
                    </Link>
                )}
                title={selectedTaskDetail?.title ?? t("personalProjectResult.title")}
                description={selectedTaskDetail?.description || undefined}
            />

            <div className="flex flex-col gap-6">
                {/* attempt buttons (newest few) that wrap; a "+N" button opens the full history drawer */}
                <AsyncContent
                    isLoading={attemptsLoading}
                    skeleton={(
                        <div className="flex gap-2">
                            {[0, 1].map((row) => (
                                <Skeleton key={row} className="h-9 w-32 rounded-full" />
                            ))}
                        </div>
                    )}
                    isEmpty={attempts.length === 0}
                    emptyContent={{
                        title: t("personalProjectResult.emptyAttempts"),
                        description: t("personalProjectResult.emptyAttemptsHint"),
                    }}
                    error={!attemptsSwr.data ? attemptsSwr.error : undefined}
                    errorContent={{
                        title: t("personalProjectResult.error"),
                        onRetry: () => { void attemptsSwr.mutate() },
                        retryLabel: t("personalProjectResult.retry"),
                    }}
                >
                    <div className="flex flex-col gap-3">
                        <Label>{t("personalProjectResult.attempts")}</Label>
                        <FlexWrapButtonRadio
                            insideCard={false}
                            ariaLabel={t("personalProjectResult.history")}
                            value={selectedAttempt?.id ?? ""}
                            onChange={(id) => router.push(attemptHref(id))}
                            items={visibleAttempts.map((attempt) => ({
                                value: attempt.id,
                                content: (
                                    <>
                                        <VerdictIcon pass={attempt.passed} />
                                        <span>{t("submissionAttempts.attemptLine", { number: attempt.attemptNumber })}</span>
                                        <span className="text-xs opacity-70">{scoreLabel(attempt.score)}</span>
                                    </>
                                ),
                            }))}
                            trailing={overflowCount > 0 ? (
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    aria-label={t("personalProjectResult.history")}
                                    onPress={() => setHistoryOpen(true)}
                                >
                                    {`+${overflowCount}`}
                                </Button>
                            ) : undefined}
                        />
                    </div>
                </AsyncContent>

                {/* selected attempt detail — two labeled cards: "Kết quả" + "Góp ý" */}
                {selectedAttempt ? (
                    <div className="flex flex-col gap-6">
                        <LabeledCard label={t("personalProjectResult.resultLabel")} contentClassName="flex flex-col gap-3">
                            {/* score hero — the #1 signal, tinted by pass/fail */}
                            <div className="flex items-start gap-3">
                                <div className="flex items-baseline">
                                    <span className={cn("text-4xl font-bold leading-none", passing ? "text-success" : "text-danger")}>
                                        {selectedAttempt.score ?? 0}
                                    </span>
                                    {maxScore > 0 ? (
                                        <span className="text-base text-muted">/{maxScore}</span>
                                    ) : null}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <Chip color={passing ? "success" : "danger"} variant="soft" size="sm">
                                        <VerdictIcon pass={passing} />
                                        <Chip.Label>
                                            {t(passing ? "personalProjectResult.passed" : "personalProjectResult.failed")}
                                        </Chip.Label>
                                    </Chip>
                                    {selectedAttempt.shortFeedback ? (
                                        <Typography type="body-sm" color="muted" className="mt-1">
                                            {selectedAttempt.shortFeedback}
                                        </Typography>
                                    ) : null}
                                </div>
                                {githubUrl ? (
                                    <Link
                                        href={githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex shrink-0 items-center gap-2 text-sm text-accent hover:underline"
                                    >
                                        {t("personalProjectResult.viewRepo")}
                                        <ArrowSquareOutIcon aria-hidden focusable="false" className="size-5" />
                                    </Link>
                                ) : null}
                            </div>

                            {/* model byline — which AI model actually graded this attempt + when */}
                            <div className="flex flex-wrap items-center gap-2 border-t border-default pt-3">
                                <ModelByline model={selectedAttempt.servedModel} category={servedCategory} withLabel />
                                {timeAgo ? (
                                    <Typography type="body-xs" color="muted" className="ml-auto">
                                        {timeAgo}
                                    </Typography>
                                ) : null}
                            </div>
                        </LabeledCard>

                        {/* findings — a labeled accordion card (each finding expands) */}
                        <LabeledCard label={t("personalProjectResult.feedbackLabel")} frameless>
                            <AsyncContent
                                isLoading={feedbacksLoading}
                                skeleton={<Skeleton className="h-40 w-full rounded-2xl" />}
                                isEmpty={feedbacks.length === 0}
                                emptyContent={{ title: t("personalProjectResult.noFeedback") }}
                                error={!feedbacksSwr.data ? feedbacksSwr.error : undefined}
                                errorContent={{
                                    title: t("personalProjectResult.error"),
                                    onRetry: () => { void feedbacksSwr.mutate() },
                                    retryLabel: t("personalProjectResult.retry"),
                                }}
                            >
                                {/* Accordion Card: the surface accordion IS the card (frameless
                                    label outside, p-0) — surface bakes bg + radius + separators. */}
                                <Accordion
                                    variant="surface"
                                    className="overflow-hidden border border-default"
                                    allowsMultipleExpanded
                                >
                                    {sortedFeedbacks.map((feedback) => (
                                        <FindingAccordionItem
                                            key={feedback.id}
                                            feedback={feedback}
                                            repositoryUrl={githubUrl || undefined}
                                        />
                                    ))}
                                </Accordion>
                            </AsyncContent>
                        </LabeledCard>
                    </div>
                ) : null}
            </div>

            <PersonalProjectTaskResultHistoryDrawer
                isOpen={historyOpen}
                onOpenChange={setHistoryOpen}
                attempts={attempts}
                selectedAttemptId={selectedAttempt?.id}
                maxScore={maxScore}
                modelCategoryMap={modelCategoryMap}
                onSelect={(id) => router.push(attemptHref(id))}
            />
        </div>
    )
}

export default PersonalProjectTaskResult

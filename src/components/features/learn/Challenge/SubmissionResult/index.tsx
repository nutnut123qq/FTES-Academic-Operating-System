"use client"

import React, { useMemo, useState } from "react"
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
import { SubmissionResultHistoryDrawer } from "@/components/drawers/SubmissionResultHistoryDrawer"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useQuerySubmissionResultAttemptsSwr } from "@/hooks/swr/api/graphql/queries/useQuerySubmissionResultAttemptsSwr"
import { useQuerySubmissionResultFeedbacksSwr } from "@/hooks/swr/api/graphql/queries/useQuerySubmissionResultFeedbacksSwr"
import { useQueryAiModelsSwr } from "@/hooks/swr/api/graphql/queries/useQueryAiModelsSwr"
import { useAppSelector } from "@/redux/hooks"
import { SubmissionFeedbackSeverity } from "@/modules/types/enums/submission-feedback-severity"
import type { AiModelCategory } from "@/modules/api/graphql/queries/query-ai-models"
import type { SubmissionAttemptEntity } from "@/modules/types/entities/submission-attempt"
import type { SubmissionFeedbackEntity } from "@/modules/types/entities/submission-feedback"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SubmissionResult}. */
export type SubmissionResultProps = WithClassNames<undefined>

/** Icon + tone per finding severity (drives the accordion item header). */
const SEVERITY_VISUAL: Record<SubmissionFeedbackSeverity, { Icon: typeof WarningCircleIcon, text: string, rank: number }> = {
    [SubmissionFeedbackSeverity.High]: { Icon: WarningCircleIcon, text: "text-danger", rank: 0 },
    [SubmissionFeedbackSeverity.Medium]: { Icon: WarningCircleIcon, text: "text-warning", rank: 1 },
    [SubmissionFeedbackSeverity.Low]: { Icon: InfoIcon, text: "text-muted", rank: 2 },
}

/** Render up to this many attempt chips inline; beyond it, show the newest few + a "+N" overflow pill. */
const ATTEMPT_CHIPS_MAX = 6
/** When overflowing, how many newest chips stay visible (the rest collapse into the "+N" pill). */
const ATTEMPT_CHIPS_VISIBLE = 5

/**
 * One finding as an accordion item: the header shows the severity icon + the
 * (clamped) message + the file location; expanding reveals the detail, a linked
 * file location, and the suggested fix.
 *
 * @param props - the finding + the repo URL used to deep-link its file location.
 */
const FindingAccordionItem = ({
    feedback,
    repositoryUrl,
}: {
    feedback: SubmissionFeedbackEntity
    repositoryUrl?: string
}) => {
    const visual = SEVERITY_VISUAL[feedback.severity] ?? SEVERITY_VISUAL[SubmissionFeedbackSeverity.Medium]
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
                        {feedback.detail ? (
                            <MarkdownContent markdown={feedback.detail} className="text-sm text-muted [&_p]:m-0" />
                        ) : null}
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
 * Challenge-result page (quality-gate report). TIER-1/2 {@link PageHeader} (back-link
 * + requirement title); below it a single column: an attempt selector (a chip strip
 * for few attempts, a {@link Button} that opens the {@link SubmissionResultHistoryDrawer}
 * for many), then the selected attempt as two {@link LabeledCard}s — "Kết quả" (score
 * hero + verdict + the AI model that graded it) and "Góp ý" (findings as an accordion).
 * Reads `?submission=` (requirement) + `?attempt=` (defaults newest).
 *
 * @param props - optional root className (placement only).
 */
export const SubmissionResult = ({
    className,
}: SubmissionResultProps) => {
    const t = useTranslations()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    // history drawer (the "many attempts" picker; the chip strip handles few)
    const [historyOpen, setHistoryOpen] = useState(false)

    const challengeSubmissionId = searchParams.get("submission")
    const attemptParam = searchParams.get("attempt")

    const config = useAppSelector((state) => state.system.config)
    const passThreshold = config?.challenge?.passThreshold ?? 0
    const challengeSubmissions = useAppSelector((state) => state.challenge.challengeSubmissions)
    const requirement = useMemo(
        () => (challengeSubmissions ?? []).find((submission) => submission.id === challengeSubmissionId),
        [challengeSubmissions, challengeSubmissionId],
    )
    const maxScore = requirement?.score ?? 0

    const attemptsSwr = useQuerySubmissionResultAttemptsSwr(challengeSubmissionId)
    const attempts = useMemo<Array<SubmissionAttemptEntity>>(
        () => attemptsSwr.data?.data ?? [],
        [attemptsSwr.data],
    )
    // newest attempt is first (sorted attemptNumber DESC); honour `?attempt=` when present
    const selectedAttempt = useMemo(
        () => (attemptParam ? attempts.find((attempt) => attempt.id === attemptParam) : undefined) ?? attempts[0],
        [attempts, attemptParam],
    )

    const feedbacksSwr = useQuerySubmissionResultFeedbacksSwr(selectedAttempt?.id)
    const feedbacks = useMemo<Array<SubmissionFeedbackEntity>>(
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

    // chip strip: render up to ATTEMPT_CHIPS_MAX chips; beyond that show the newest
    // few + a "+N" pill that opens the full history drawer
    const isOverflow = attempts.length > ATTEMPT_CHIPS_MAX
    const visibleAttempts = isOverflow ? attempts.slice(0, ATTEMPT_CHIPS_VISIBLE) : attempts
    const overflowCount = attempts.length - visibleAttempts.length

    /** Back to the challenge solve page (strip the trailing /result). */
    const challengeHref = pathname.replace(/\/result\/?$/, "")
    /** URL that selects a given attempt on this result page. */
    const attemptHref = (id: string) => `${pathname}?submission=${challengeSubmissionId}&attempt=${id}`

    // Verdict for a score against the requirement's pass threshold. Guard the
    // threshold/maxScore: while system config is still loading (passThreshold=0)
    // or a requirement has no max, `0 >= 0` would falsely mark every attempt as
    // passed (the "Đạt 0/100" bug) — treat an unknown threshold as NOT passing.
    const isPassing = (score: number | null) => passThreshold > 0 && maxScore > 0 && (score ?? 0) >= passThreshold * maxScore
    const scoreLabel = (score: number | null) => (maxScore > 0 ? `${score ?? 0}/${maxScore}` : `${score ?? 0}`)
    /** Minimum score needed to pass (for the verdict sub-line). */
    const passScore = Math.ceil(passThreshold * maxScore)

    const attemptsLoading = attemptsSwr.data === null || attemptsSwr.data === undefined ? !attemptsSwr.error : false
    const feedbacksLoading = feedbacksSwr.data === null || feedbacksSwr.data === undefined ? !feedbacksSwr.error : false

    const passing = selectedAttempt ? isPassing(selectedAttempt.score) : false
    const timeAgo = selectedAttempt?.processedAt
        ? getTimeAgoLabel(getTimeAgoMessage(dayjs(selectedAttempt.processedAt)), t)
        : null

    return (
        // PageHeader (header) → content cluster, gap-10 (page-heading debt)
        <div className={cn("mx-auto flex w-full max-w-5xl flex-col gap-10 p-6", className)}>
            <PageHeader
                breadcrumb={(
                    <Link
                        onPress={() => router.push(challengeHref)}
                        className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted"
                    >
                        <ArrowLeftIcon aria-hidden focusable="false" className="size-5" />
                        {t("submissionResult.backToChallenge")}
                    </Link>
                )}
                title={requirement?.title ?? t("submissionResult.title")}
                description={requirement?.description || undefined}
            />

            <div className="flex flex-col gap-6">
                {/* attempt selector — chip strip (few) or a Button that opens the history drawer (many) */}
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
                        title: t("submissionResult.emptyAttempts"),
                        description: t("submissionResult.emptyAttemptsHint"),
                    }}
                    error={!attemptsSwr.data ? attemptsSwr.error : undefined}
                    errorContent={{
                        title: t("submissionResult.error"),
                        onRetry: () => { void attemptsSwr.mutate() },
                        retryLabel: t("submissionResult.retry"),
                    }}
                >
                    {/* attempt buttons (newest few) that wrap; a "+N" button opens the full history drawer.
                        Label → radio-group = gap-3 (airy), not gap-2 (that's the tight text-input pairing). */}
                    <div className="flex flex-col gap-3">
                        <Label>{t("submissionResult.attempts")}</Label>
                        <FlexWrapButtonRadio
                            insideCard={false}
                            ariaLabel={t("submissionResult.history")}
                            value={selectedAttempt?.id ?? ""}
                            onChange={(id) => router.push(attemptHref(id))}
                            items={visibleAttempts.map((attempt) => ({
                                value: attempt.id,
                                content: (
                                    <>
                                        <VerdictIcon pass={isPassing(attempt.score)} />
                                        <span>{t("submissionAttempts.attemptLine", { number: attempt.attemptNumber })}</span>
                                        <span className="text-xs opacity-70">{scoreLabel(attempt.score)}</span>
                                    </>
                                ),
                            }))}
                            trailing={overflowCount > 0 ? (
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    aria-label={t("submissionResult.history")}
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
                        <LabeledCard label={t("submissionResult.resultLabel")} contentClassName="flex flex-col gap-3">
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
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Chip color={passing ? "success" : "danger"} variant="soft" size="sm">
                                            <VerdictIcon pass={passing} />
                                            <Chip.Label>
                                                {t(passing ? "submissionResult.passed" : "submissionResult.failed")}
                                            </Chip.Label>
                                        </Chip>
                                        {passScore > 0 ? (
                                            <Typography type="body-sm" color="muted">
                                                {t("submissionResult.passNeeded", { score: passScore })}
                                            </Typography>
                                        ) : null}
                                    </div>
                                    {selectedAttempt.shortFeedback ? (
                                        <Typography type="body-sm" color="muted" className="mt-1">
                                            {selectedAttempt.shortFeedback}
                                        </Typography>
                                    ) : null}
                                </div>
                                {selectedAttempt.submissionUrl ? (
                                    <Link
                                        href={selectedAttempt.submissionUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex shrink-0 items-center gap-2 text-sm text-accent hover:underline"
                                    >
                                        {t("submissionAttempts.viewSubmission")}
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
                        <LabeledCard label={t("submissionResult.feedbackLabel")} frameless>
                            <AsyncContent
                                isLoading={feedbacksLoading}
                                skeleton={<Skeleton className="h-40 w-full rounded-2xl" />}
                                isEmpty={feedbacks.length === 0}
                                emptyContent={{ title: t("submissionResult.noFeedback") }}
                                error={!feedbacksSwr.data ? feedbacksSwr.error : undefined}
                                errorContent={{
                                    title: t("submissionResult.error"),
                                    onRetry: () => { void feedbacksSwr.mutate() },
                                    retryLabel: t("submissionResult.retry"),
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
                                            repositoryUrl={selectedAttempt.submissionUrl}
                                        />
                                    ))}
                                </Accordion>
                            </AsyncContent>
                        </LabeledCard>
                    </div>
                ) : null}
            </div>

            <SubmissionResultHistoryDrawer
                isOpen={historyOpen}
                onOpenChange={setHistoryOpen}
                attempts={attempts}
                selectedAttemptId={selectedAttempt?.id}
                maxScore={maxScore}
                passThreshold={passThreshold}
                modelCategoryMap={modelCategoryMap}
                onSelect={(id) => router.push(attemptHref(id))}
            />
        </div>
    )
}

export default SubmissionResult

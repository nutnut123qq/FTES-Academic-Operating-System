"use client"

import {
    TrophyIcon,
    FlameIcon,
    LightbulbIcon,
    CircleIcon,
    CircleNotchIcon,
    CheckCircleIcon,
    XCircleIcon,
    PlayIcon,
    ArrowClockwiseIcon,
    EyeIcon,
    type Icon,
} from "@phosphor-icons/react"
import React, { useMemo } from "react"
import { Button, Chip, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { ChallengeDifficulty } from "@/modules/types/enums/challenge-difficulty"
import { type ChallengeEntity } from "@/modules/types/entities/challenge"
import { type WithClassNames } from "@/modules/types/base/class-name"
import type { ChallengeProgressStatus } from "@/modules/api/graphql/queries/types/challenge-submission-progress"
import { difficultyPalette } from "@/components/pallettes/difficulty"
import { useAppSelector } from "@/redux/hooks"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"

/** i18n key for each difficulty tier label (covers all 5 BE tiers). */
const DIFFICULTY_LABEL_KEY: Record<ChallengeDifficulty, string> = {
    [ChallengeDifficulty.Easy]: "challenge.difficulty.easy",
    [ChallengeDifficulty.Medium]: "challenge.difficulty.medium",
    [ChallengeDifficulty.Hard]: "challenge.difficulty.hard",
    [ChallengeDifficulty.Insane]: "challenge.difficulty.insane",
    [ChallengeDifficulty.Expert]: "challenge.difficulty.expert",
}

/** Status → eyebrow chip (icon + label color). */
const STATUS_META: Record<ChallengeProgressStatus, { labelKey: string; className: string; icon: Icon }> = {
    notStarted: { labelKey: "challenge.status.notStarted", className: "text-muted", icon: CircleIcon },
    inProgress: { labelKey: "challenge.status.inProgress", className: "text-warning", icon: CircleNotchIcon },
    failed: { labelKey: "challenge.status.failed", className: "text-danger", icon: XCircleIcon },
    completed: { labelKey: "challenge.status.completed", className: "text-success", icon: CheckCircleIcon },
}

/** Status → primary action label + icon (resume semantics). */
const CTA_META: Record<ChallengeProgressStatus, { labelKey: string; icon: Icon }> = {
    notStarted: { labelKey: "challenge.cta.start", icon: FlameIcon },
    inProgress: { labelKey: "challenge.cta.continue", icon: PlayIcon },
    failed: { labelKey: "challenge.cta.retry", icon: ArrowClockwiseIcon },
    completed: { labelKey: "challenge.cta.review", icon: EyeIcon },
}

export interface ChallengeCardProps extends WithClassNames<undefined> {
    /** Challenge row displayed in content tab. */
    challenge: ChallengeEntity
}

/**
 * One challenge in the "Thử thách" tab — a single card (bounded object): puzzle
 * eyebrow + status chip → title → difficulty/score/hint chips → clamped description
 * → footer (attempts + best score on the left, status-driven primary action on the
 * right). The card is a static surface — only the footer button navigates.
 * @param {ChallengeCardProps} props Challenge card props.
 */
export const ChallengeCard = ({ challenge, className }: ChallengeCardProps) => {
    const t = useTranslations()
    const router = useRouter()
    const params = useParams()
    // Per-challenge progress, populated by `useQueryChallengeSubmissionProgressSwr`.
    const completionTasks = useAppSelector((state) => state.challenge.completionTasks)
    const progress = useMemo(
        () => completionTasks.find((completionTask) => completionTask.id === challenge.id) ?? null,
        [completionTasks, challenge.id],
    )
    const status: ChallengeProgressStatus = progress?.status ?? "notStarted"
    const statusMeta = STATUS_META[status]
    const ctaMeta = CTA_META[status]
    const StatusIcon = statusMeta.icon
    const CtaIcon = ctaMeta.icon

    // Footer-left progress line: attempts + best score, or "not attempted yet".
    const maxScore = progress?.maxScore ?? challenge.score
    const attemptsLine = useMemo(() => {
        const attempts = progress?.numAttempts ?? 0
        if (attempts <= 0) {
            return t("challenge.attempts.none")
        }
        const base = t("challenge.attempts.some", { count: attempts })
        if (progress?.lastScore == null) {
            return base
        }
        return `${base} · ${t("challenge.attempts.bestScore", { score: progress.lastScore, maxScore })}`
    }, [progress?.numAttempts, progress?.lastScore, maxScore, t])

    const openChallenge = () => {
        const courseId = params.courseId as string
        const moduleId = params.moduleId as string
        const contentId = params.contentId as string
        router.push(`/courses/${courseId}/learn/content/modules/${moduleId}/contents/${contentId}/challenges/${challenge.id}`)
    }

    return (
        // each challenge is its OWN distinct card (surface fill + border on a plain div so
        // the utilities aren't overridden by HeroUI Card's unlayered styles). The card itself
        // is static (NOT clickable, no hover/cursor) — only the footer "Làm" button navigates.
        // Completed rows are de-emphasized.
        <div className={cn("rounded-3xl border border-default bg-surface p-4", status === "completed" && "opacity-80", className)}>
            <div className="flex flex-col gap-3">
                <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                        {/* quiet eyebrow — the challenge number is a low-key label, not a heading;
                            the title below is the meaningful line. No motif icon (it lives once on
                            the section's LabeledCard label). */}
                        <span className="text-xs text-muted">
                            {t("challenge.number", { index: challenge.sortIndex })}
                        </span>
                        <span className={cn("inline-flex items-center gap-1.5 text-xs", statusMeta.className)}>
                            <StatusIcon className="size-4 shrink-0" />
                            {t(statusMeta.labelKey)}
                        </span>
                    </div>
                    <div className="font-medium">{challenge.title}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Chip color="default" className={difficultyPalette[challenge.difficulty]?.text ?? "text-muted"}>
                        <FlameIcon className="size-5" />
                        <Chip.Label>{t(DIFFICULTY_LABEL_KEY[challenge.difficulty] ?? "challenge.difficulty.easy")}</Chip.Label>
                    </Chip>
                    <Chip variant="secondary" color="accent">
                        <TrophyIcon className="size-5" />
                        <Chip.Label>{challenge.score}</Chip.Label>
                    </Chip>
                    {challenge.hint ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                            <LightbulbIcon className="size-4 shrink-0" />
                            {t("challenge.hintTag")}
                        </span>
                    ) : null}
                </div>
                {challenge.description ? (
                    <MarkdownContent
                        markdown={challenge.description}
                        className="text-xs text-muted [&_p]:m-0 [&_p]:line-clamp-2"
                    />
                ) : null}
                <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                        <ArrowClockwiseIcon className="size-4 shrink-0" />
                        {attemptsLine}
                    </span>
                    <Button onPress={openChallenge}>
                        <CtaIcon className="size-5" />
                        {t(ctaMeta.labelKey)}
                    </Button>
                </div>
            </div>
        </div>
    )
}

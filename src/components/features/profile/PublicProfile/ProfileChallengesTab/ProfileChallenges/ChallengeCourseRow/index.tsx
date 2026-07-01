"use client"

import React, {
    useState,
} from "react"
import {
    Link,
    Typography,
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    CaretDownIcon,
    LinkIcon,
    PuzzlePieceIcon,
} from "@phosphor-icons/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    buildDifficultySegments,
    difficultyLevel,
} from "../difficultyMeta"
import { dayjs } from "@/modules/dayjs"
import { DifficultyChip } from "@/components/blocks/chips/DifficultyChip"
import { IconTile } from "@/components/blocks/identity/IconTile"
import { LanguageChip } from "@/components/blocks/chips/LanguageChip"
import { SegmentBar } from "@/components/blocks/stats/SegmentBar"
import type { QueryUserSolvedChallengeItemData } from "@/modules/api/graphql/queries/types/user-solved-challenges"

/** Submission rows shown before the "see more" link kicks in. */
const INITIAL_ROWS = 3

/**
 * Score → attention colour the eye catches fast: high green, mid yellow, low red.
 * @param score - the graded score (0–100).
 * @returns a `text-{token}` class for the score label.
 */
const scoreToneClass = (score: number): string => {
    if (score >= 90) {
        return "text-success"
    }
    if (score >= 70) {
        return "text-warning"
    }
    return "text-danger"
}

/** Props for {@link ChallengeCourseRow}. */
export interface ChallengeCourseRowProps extends WithClassNames<undefined> {
    /** Course title for this group, or null for ungrouped (V1-legacy) rows. */
    courseTitle: string | null
    /** Solved-challenge rows under this course, in source order (list-item data). */
    items: Array<QueryUserSolvedChallengeItemData>
    /**
     * Total challenges in the course — makes the bar a PROGRESS bar (done coloured
     * by difficulty, the rest the empty track). Omit/0 → pure passed-mix (100% fill).
     */
    totalChallenges?: number
}

/**
 * One course group on the Challenges tab, styled like a Projects-tab capstone row:
 * a framed puzzle {@link IconTile}, the course title, a 4-tone difficulty
 * {@link SegmentBar} and a passed-count summary. Collapsed by default — a
 * disclosure {@link Link} reveals the submission list (capped to
 * {@link INITIAL_ROWS} + a "show more" link). Each submission shows its title with
 * the date + {@link DifficultyChip} + GitHub-style {@link LanguageChip} BELOW it,
 * and the score (coloured by band) + repo link on the right.
 *
 * @param props - {@link ChallengeCourseRowProps}
 */
export const ChallengeCourseRow = ({
    courseTitle,
    items,
    totalChallenges,
    className,
}: ChallengeCourseRowProps) => {
    const t = useTranslations()
    const locale = useLocale()
    /** Whether the submission list is revealed. */
    const [expanded, setExpanded] = useState(false)
    /** Whether the full submission list (past the cap) is shown. */
    const [showAll, setShowAll] = useState(false)

    const segments = buildDifficultySegments(items)
    const visible = showAll ? items : items.slice(0, INITIAL_ROWS)
    const hiddenCount = items.length - INITIAL_ROWS

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            {/* glance row: icon tile + title + difficulty bar + count summary */}
            <div className="flex items-start gap-3">
                <IconTile
                    size="sm"
                    icon={<PuzzlePieceIcon aria-hidden focusable="false" />}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Typography type="body-sm" weight="medium" truncate>
                        {courseTitle ?? t("publicProfile.challengesTab.ungrouped")}
                    </Typography>
                    <SegmentBar
                        hideLegend
                        max={totalChallenges && totalChallenges > 0 ? totalChallenges : undefined}
                        ariaLabel={t("publicProfile.challengesTab.submissionCount", { count: items.length })}
                        segments={segments}
                    />
                    <Typography type="body-xs" color="muted">
                        {totalChallenges && totalChallenges > 0
                            ? t("publicProfile.challengesTab.submissionProgress", { passed: items.length, total: totalChallenges })
                            : t("publicProfile.challengesTab.submissionCount", { count: items.length })}
                    </Typography>
                </div>
            </div>

            {/* disclosure → the submission list (on demand) */}
            <Link
                onPress={() => setExpanded((open) => !open)}
                className="inline-flex w-fit cursor-pointer items-center gap-2 text-accent"
            >
                {expanded
                    ? t("publicProfile.challengesTab.hideSubmissions")
                    : t("publicProfile.challengesTab.viewSubmissions")}
                <CaretDownIcon
                    aria-hidden
                    focusable="false"
                    className="size-4 transition-transform data-[open=true]:rotate-180"
                    data-open={expanded}
                />
            </Link>

            {expanded ? (
                <div className="flex flex-col gap-3 pt-1">
                    <div className="flex flex-col gap-3">
                        {visible.map((challenge, index) => {
                            const level = difficultyLevel(challenge.difficulty)
                            const passedAt = challenge.passedAt
                                ? dayjs(challenge.passedAt).locale(locale).format("hh:mm MMMM DD, YYYY")
                                : undefined
                            return (
                                <div
                                    key={`${challenge.submissionUrl}-${index}`}
                                    className="flex items-center justify-between gap-6"
                                >
                                    {/* title; below it: date on the LEFT, chips pushed RIGHT */}
                                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                                        <Typography type="body-sm" weight="medium" truncate>
                                            {challenge.title}
                                        </Typography>
                                        <div className="flex flex-wrap items-center gap-2 sm:grid sm:grid-cols-[6rem_5.5rem_1fr]">
                                            {level ? <DifficultyChip difficulty={level} /> : null}
                                            {
                                                challenge.selectedLang ? (
                                                    <LanguageChip language={challenge.selectedLang} />
                                                ) : null
                                            }
                                            {passedAt ? (
                                                <Typography type="body-xs" color="muted">
                                                    {passedAt}
                                                </Typography>
                                            ) : null}
                                        </div>
                                    </div>
                                    {/* score (coloured by band) + repo link */}
                                    <div className="ml-auto flex shrink-0 items-center gap-3">
                                        {typeof challenge.score === "number" ? (
                                            <Typography
                                                type="body-xs"
                                                weight="medium"
                                                className={scoreToneClass(challenge.score)}
                                            >
                                                {t("publicProfile.challengesTab.score", { score: challenge.score })}
                                            </Typography>
                                        ) : null}
                                        {challenge.submissionUrl ? (
                                            <Link
                                                href={challenge.submissionUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex shrink-0 items-center gap-2 text-accent underline"
                                                aria-label={t("publicProfile.openRepo", { title: challenge.title })}
                                            >
                                                <LinkIcon aria-hidden focusable="false" className="size-5" />
                                                <Typography type="body-xs">
                                                    {t("publicProfile.repoLink")}
                                                </Typography>
                                            </Link>
                                        ) : null}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* long list → reveal the rest behind one link (muted, secondary) */}
                    {hiddenCount > 0 ? (
                        <Link
                            onPress={() => setShowAll((open) => !open)}
                            className="inline-flex w-fit cursor-pointer items-center gap-2 text-muted"
                        >
                            {showAll
                                ? t("publicProfile.challengesTab.showLess")
                                : t("publicProfile.challengesTab.showMore", { count: hiddenCount })}
                        </Link>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}

"use client"

import React from "react"
import useSWR from "swr"
import { Button, Typography } from "@heroui/react"
import { PuzzlePieceIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter } from "next/navigation"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { queryChallenges } from "@/modules/api/graphql/queries/query-challenges"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { DifficultyChip } from "@/components/blocks/chips/DifficultyChip"
import { LabeledList } from "@/components/blocks/lists/LabeledList"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { Difficulty } from "@/components/blocks/chips/DifficultyChip"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { ContentTab, setContentTab } from "@/redux/slices/tabs"

/** Props for {@link LessonChallenges}. */
export type LessonChallengesProps = WithClassNames<undefined>

/**
 * Normalize a raw challenge difficulty (easy | medium | hard | insane) into the
 * `DifficultyChip` enum; unknown values fall back to `beginner`.
 *
 * @param raw - The backend difficulty string.
 */
const toDifficulty = (raw: string): Difficulty => {
    switch (raw) {
    case "medium":
        return "intermediate"
    case "hard":
        return "advanced"
    case "insane":
        return "insane"
    default:
        return "beginner"
    }
}

/**
 * Right-rail "practice this lesson" panel: the challenges attached to the lesson
 * currently being read, with a primary CTA that opens the lesson's Challenges tab.
 * Closes the read → review → practice loop next to the on-this-page outline.
 *
 * Uses its OWN read-only SWR for `challenges({ contentId })` (NOT the tab-coupled
 * {@link import("@/hooks").useQueryChallengesSwr}, which gates on the active tab and
 * writes Redux). Self-hides when the lesson has no challenges (AsyncContent empty →
 * null), so it never leaves an empty box.
 *
 * @param props - {@link LessonChallengesProps}
 */
export const LessonChallenges = ({ className }: LessonChallengesProps) => {
    const t = useTranslations()
    const dispatch = useAppDispatch()
    const router = useRouter()
    const pathname = usePathname()
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const contentId = useAppSelector((state) => state.content.id)

    // challenges of THIS lesson; key null until both ids hydrate
    const { data, isLoading } = useSWR(
        courseId && contentId ? ["lesson-challenges", courseId, contentId] : null,
        async () => {
            const response = await queryChallenges({
                request: {
                    contentId: contentId as string,
                    // omit pageNumber/limit → server defaults (mirrors the proven
                    // tab hook); avoids an off-by-one page that would return empty
                    filters: { sorts: [] },
                },
                headers: { [GraphQLHeadersKey.XCourseId]: courseId as string },
            })
            return response.data?.challenges?.data?.data ?? null
        },
    )

    const challenges = data ?? []

    // open the lesson's Challenges tab in place (same content route)
    const onPractice = () => {
        dispatch(setContentTab(ContentTab.Challenges))
        router.replace(`${pathname}?tab=${ContentTab.Challenges}`)
    }

    return (
        <AsyncContent
            isLoading={isLoading && !data}
            skeleton={
                <div className="flex flex-col gap-3">
                    <Skeleton.Typography type="body-sm" width="1/2" />
                    <Skeleton.Typography type="body-xs" width="3/4" />
                    <Skeleton.Button />
                </div>
            }
            isEmpty={challenges.length === 0}
        >
            <LabeledList
                className={className}
                icon={<PuzzlePieceIcon className="size-5" aria-hidden focusable="false" />}
                label={t("lessonRail.challenges.title")}
                action={(
                    <Button size="sm" variant="primary" className="self-start" onPress={onPractice}>
                        {t("lessonRail.challenges.practice")}
                    </Button>
                )}
            >
                {challenges.map((challenge) => (
                    <div key={challenge.id} className="flex items-center justify-between gap-2">
                        <Typography type="body-sm" color="muted" truncate>
                            {challenge.title}
                        </Typography>
                        {challenge.difficulty ? (
                            <DifficultyChip difficulty={toDifficulty(challenge.difficulty)} />
                        ) : null}
                    </div>
                ))}
            </LabeledList>
        </AsyncContent>
    )
}

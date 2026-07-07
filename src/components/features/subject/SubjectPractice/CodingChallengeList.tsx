"use client"

import React, { useMemo, useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import {
    ArrowLeftIcon,
    CaretRightIcon,
    CheckCircleIcon,
    CircleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SearchInput } from "@/components/reuseable/SearchInput"
import {
    useQuerySubjectCodingChallengesSwr,
    type CodingChallenge,
    type CodingDifficulty,
    type CodingStatus,
} from "../hooks/useQuerySubjectCodingChallengesSwr"
import { CodingChallengeDetail } from "./CodingChallengeDetail"

/** difficulty → chip color (shared idiom with SubjectOverview). */
const DIFFICULTY_COLOR: Record<CodingDifficulty, "success" | "warning" | "danger"> = {
    easy: "success",
    medium: "warning",
    hard: "danger",
}

/** Difficulty filter values (`all` = no difficulty constraint). */
const DIFFICULTY_FILTERS: Array<"all" | CodingDifficulty> = ["all", "easy", "medium", "hard"]
/** Status filter values (`all` = no status constraint). */
const STATUS_FILTERS: Array<"all" | CodingStatus> = ["all", "solved", "unsolved"]

/** Props for {@link CodingChallengeList}. */
export interface CodingChallengeListProps {
    /** Owning subject — the SWR key. */
    subjectId: string
    /** Back to the practice hub. */
    onBack: () => void
}

/**
 * The coding-challenge BANK (LeetCode problems list). Renders the problems as rows —
 * title, difficulty chip, tags, solved/unsolved status, acceptance % — with difficulty +
 * status + search filters. Selecting a row swaps to the in-panel {@link CodingChallengeDetail}.
 * Mock data via `useQuerySubjectCodingChallengesSwr`; read + attempt only (no CRUD).
 */
export const CodingChallengeList = ({ subjectId, onBack }: CodingChallengeListProps) => {
    const t = useTranslations("subjects")
    const { challenges, isLoading, error, mutate } =
        useQuerySubjectCodingChallengesSwr(subjectId)

    const [difficulty, setDifficulty] = useState<"all" | CodingDifficulty>("all")
    const [status, setStatus] = useState<"all" | CodingStatus>("all")
    const [search, setSearch] = useState("")
    const [selectedId, setSelectedId] = useState<string | null>(null)

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase()
        return challenges.filter((challenge) => {
            if (difficulty !== "all" && challenge.difficulty !== difficulty) {
                return false
            }
            if (status !== "all" && challenge.status !== status) {
                return false
            }
            if (query.length > 0) {
                const haystack = [challenge.title, ...challenge.tags].join(" ").toLowerCase()
                if (!haystack.includes(query)) {
                    return false
                }
            }
            return true
        })
    }, [challenges, difficulty, status, search])

    const selected = useMemo(
        () => challenges.find((challenge) => challenge.id === selectedId) ?? null,
        [challenges, selectedId],
    )

    // detail view takes over the whole panel when a problem is open
    if (selected) {
        return (
            <CodingChallengeDetail challenge={selected} onBack={() => setSelectedId(null)} />
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Button size="sm" variant="tertiary" className="shrink-0" onPress={onBack}>
                    <ArrowLeftIcon aria-hidden focusable="false" className="size-4" />
                    {t("practice.backToHub")}
                </Button>
                <Typography type="h5" weight="bold" className="min-w-0 flex-1">
                    {t("practice.modules.coding.title")}
                </Typography>
            </div>

            {/* filters: difficulty pills · status pills · search */}
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    {DIFFICULTY_FILTERS.map((item) => (
                        <Button
                            key={item}
                            size="sm"
                            variant={difficulty === item ? "secondary" : "ghost"}
                            onPress={() => setDifficulty(item)}
                        >
                            {item === "all"
                                ? t("practice.coding.filters.allDifficulties")
                                : t(`practice.difficulty.${item}`)}
                        </Button>
                    ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {STATUS_FILTERS.map((item) => (
                        <Button
                            key={item}
                            size="sm"
                            variant={status === item ? "secondary" : "ghost"}
                            onPress={() => setStatus(item)}
                        >
                            {item === "all"
                                ? t("practice.coding.filters.allStatuses")
                                : t(`practice.coding.status.${item}`)}
                        </Button>
                    ))}
                </div>
                <SearchInput
                    value={search}
                    onValueChange={setSearch}
                    variant="secondary"
                    placeholder={t("practice.coding.searchPlaceholder")}
                    className="sm:max-w-none"
                />
            </div>

            <AsyncContent
                isLoading={isLoading && challenges.length === 0}
                skeleton={<CodingListSkeleton />}
                error={challenges.length === 0 ? error : undefined}
                errorContent={{
                    title: t("practice.coding.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("practice.coding.retry"),
                }}
            >
                {filtered.length === 0 ? (
                    <EmptyContent title={t("practice.coding.empty")} />
                ) : (
                    <div className="flex flex-col gap-2">
                        {filtered.map((challenge) => (
                            <CodingChallengeRow
                                key={challenge.id}
                                challenge={challenge}
                                onOpen={() => setSelectedId(challenge.id)}
                            />
                        ))}
                    </div>
                )}
            </AsyncContent>
        </div>
    )
}

/** One problem row — status icon · title + tags · difficulty chip + acceptance + caret. */
const CodingChallengeRow = ({
    challenge,
    onOpen,
}: {
    challenge: CodingChallenge
    onOpen: () => void
}) => {
    const t = useTranslations("subjects")
    return (
        <button
            type="button"
            onClick={onOpen}
            className="flex w-full items-center gap-3 rounded-2xl border border-separator p-4 text-left transition-colors hover:border-accent/50 hover:bg-accent/5"
        >
            {challenge.status === "solved" ? (
                <CheckCircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-success" />
            ) : (
                <CircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Typography type="body-sm" weight="medium" truncate>
                    {challenge.title}
                </Typography>
                <div className="flex flex-wrap items-center gap-2">
                    {challenge.tags.map((tag) => (
                        <Chip key={tag} size="sm" variant="soft" color="default">
                            {tag}
                        </Chip>
                    ))}
                </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
                <Chip size="sm" variant="soft" color={DIFFICULTY_COLOR[challenge.difficulty]}>
                    {t(`practice.difficulty.${challenge.difficulty}`)}
                </Chip>
                <Typography type="body-xs" color="muted">
                    {t("practice.coding.acceptance", { rate: challenge.acceptance })}
                </Typography>
            </div>
            <CaretRightIcon aria-hidden focusable="false" className="size-4 shrink-0 text-muted" />
        </button>
    )
}

/** Loading skeleton — mirrors the problem rows. */
const CodingListSkeleton = () => (
    <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-2xl" />
        ))}
    </div>
)

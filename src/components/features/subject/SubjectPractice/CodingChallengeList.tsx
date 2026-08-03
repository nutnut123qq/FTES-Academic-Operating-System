"use client"

import React, { useMemo, useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { ArrowLeftIcon, CaretRightIcon, InfoIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SearchInput } from "@/components/reuseable/SearchInput"
import {
    CHALLENGE_LIFECYCLES,
    CHALLENGE_TYPES,
    challengeTypeKey,
    useQuerySubjectCodingChallengesSwr,
    type ChallengeLifecycle,
    type ChallengeType,
    type CodingChallenge,
} from "../hooks/useQuerySubjectCodingChallengesSwr"
import { Link } from "@/i18n/navigation"

/** lifecycle → chip color. */
const LIFECYCLE_COLOR: Record<ChallengeLifecycle, "success" | "warning" | "default"> = {
    running: "success",
    upcoming: "warning",
    closed: "default",
}

/** Type filter values (`all` = no type constraint). */
const TYPE_FILTERS: Array<"all" | ChallengeType> = ["all", ...CHALLENGE_TYPES]
/** Lifecycle filter values (`all` = no lifecycle constraint). */
const LIFECYCLE_FILTERS: Array<"all" | ChallengeLifecycle> = ["all", ...CHALLENGE_LIFECYCLES]

/** Props for {@link CodingChallengeList}. */
export interface CodingChallengeListProps {
    /** Owning subject (the `[subjectId]` route segment = subject CODE) — the SWR key. */
    subjectId: string
    /** Back to the practice hub. */
    onBack: () => void
}

/**
 * The practice challenge BANK, backed by `GET /api/v1/challenges`.
 *
 * Rows are the subject's own challenges when it owns any; otherwise the global public
 * bank is shown with an explicit note (the BE list endpoint has no subject filter, so
 * the narrowing happens client-side). Filters: challenge type · lifecycle · search.
 * Selecting a row swaps to the in-panel {@link CodingChallengeDetail}.
 */
export const CodingChallengeList = ({ subjectId, onBack }: CodingChallengeListProps) => {
    const t = useTranslations("subjects")
    const { challenges, scoped, isLoading, error, mutate } =
        useQuerySubjectCodingChallengesSwr(subjectId)

    const [type, setType] = useState<"all" | ChallengeType>("all")
    const [lifecycle, setLifecycle] = useState<"all" | ChallengeLifecycle>("all")
    const [search, setSearch] = useState("")

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase()
        return challenges.filter((challenge) => {
            if (type !== "all" && challenge.type !== type) {
                return false
            }
            if (lifecycle !== "all" && challenge.lifecycle !== lifecycle) {
                return false
            }
            if (query.length > 0) {
                const haystack = [challenge.title, challenge.slug, challenge.description]
                    .join(" ")
                    .toLowerCase()
                if (!haystack.includes(query)) {
                    return false
                }
            }
            return true
        })
    }, [challenges, type, lifecycle, search])

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

            {/* filters: type pills · lifecycle pills · search */}
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    {TYPE_FILTERS.map((item) => (
                        <Button
                            key={item}
                            size="sm"
                            variant={type === item ? "secondary" : "ghost"}
                            onPress={() => setType(item)}
                        >
                            {item === "all"
                                ? t("practice.coding.filters.allTypes")
                                : t(`practice.coding.types.${challengeTypeKey(item) ?? "coding"}`)}
                        </Button>
                    ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {LIFECYCLE_FILTERS.map((item) => (
                        <Button
                            key={item}
                            size="sm"
                            variant={lifecycle === item ? "secondary" : "ghost"}
                            onPress={() => setLifecycle(item)}
                        >
                            {item === "all"
                                ? t("practice.coding.filters.allLifecycles")
                                : t(`practice.coding.lifecycle.${item}`)}
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

            {/* honesty note: the rows are NOT this subject's challenges */}
            {!scoped && challenges.length > 0 ? (
                <div className="flex items-start gap-2 rounded-2xl border border-separator p-3">
                    <InfoIcon aria-hidden focusable="false" className="mt-0.5 size-4 shrink-0 text-muted" />
                    <Typography type="body-xs" color="muted">
                        {t("practice.coding.scopeNote")}
                    </Typography>
                </div>
            ) : null}

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
                            />
                        ))}
                    </div>
                )}
            </AsyncContent>
        </div>
    )
}

/** One challenge row — title + slug · type/mode chips · lifecycle chip + caret. */
const CodingChallengeRow = ({
    challenge,
}: {
    challenge: CodingChallenge
}) => {
    const t = useTranslations("subjects")
    const typeKey = challengeTypeKey(challenge.type)

    return (
        <Link
            href={`/challenges/${challenge.id}`}
            className="flex w-full items-center gap-3 rounded-2xl border border-separator p-4 text-left transition-colors hover:border-accent/50 hover:bg-accent/5"
        >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Typography type="body-sm" weight="medium" truncate>
                    {challenge.title}
                </Typography>
                <div className="flex flex-wrap items-center gap-2">
                    <Chip size="sm" variant="soft" color="accent">
                        {typeKey ? t(`practice.coding.types.${typeKey}`) : challenge.type}
                    </Chip>
                    <Chip size="sm" variant="soft" color="default">
                        {challenge.mode === "TEAM"
                            ? t("practice.coding.modes.team")
                            : t("practice.coding.modes.individual")}
                    </Chip>
                </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
                <Chip size="sm" variant="soft" color={LIFECYCLE_COLOR[challenge.lifecycle]}>
                    {t(`practice.coding.lifecycle.${challenge.lifecycle}`)}
                </Chip>
                <Typography type="body-xs" color="muted">
                    {t("practice.coding.maxSubmissions", { count: challenge.maxSubmissions })}
                </Typography>
            </div>
            <CaretRightIcon aria-hidden focusable="false" className="size-4 shrink-0 text-muted" />
        </Link>
    )
}

/** Loading skeleton — mirrors the challenge rows. */
const CodingListSkeleton = () => (
    <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-2xl" />
        ))}
    </div>
)

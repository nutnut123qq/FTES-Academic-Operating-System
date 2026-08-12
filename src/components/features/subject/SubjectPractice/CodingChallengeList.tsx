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
    collectChallengeTags,
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

/** Sort options: `newest` (startsAt desc) · `hot` (submissionCount desc). */
const SORT_OPTIONS = ["newest", "hot"] as const
/** One sort option. */
type SortOption = (typeof SORT_OPTIONS)[number]

/** Props for {@link CodingChallengeList}. */
export interface CodingChallengeListProps {
    /** Owning subject (the `[subjectId]` route segment = subject CODE) — the SWR key. */
    subjectId: string
    /** Back to the practice hub. */
    onBack: () => void
}

/**
 * The practice challenge BANK, backed by `GET /api/v1/challenges?subjectId=&tags=`.
 *
 * Rows are the subject's own challenges when it owns any; otherwise the global public
 * bank is shown with an explicit note. **Practical Exam (PE) papers are in this bank** —
 * they are challenges tagged `pe` + the subject code, so the TAG row is how a learner
 * pulls them out (`Đề PE` chip → only the papers).
 *
 * Filters: tag (server-side, AND semantics) · challenge type · lifecycle · search.
 * Selecting a row opens the challenge's own solve/read page.
 */
export const CodingChallengeList = ({ subjectId, onBack }: CodingChallengeListProps) => {
    const t = useTranslations("subjects")
    const [tags, setTags] = useState<Array<string>>([])
    const { challenges, scoped, isLoading, error, mutate } =
        useQuerySubjectCodingChallengesSwr(subjectId, tags)

    const [type, setType] = useState<"all" | ChallengeType>("all")
    const [lifecycle, setLifecycle] = useState<"all" | ChallengeLifecycle>("all")
    const [search, setSearch] = useState("")
    const [sort, setSort] = useState<SortOption>("newest")

    /** Facet row — the tags present on the returned rows, plus whatever is picked. */
    const tagFacets = useMemo(
        () => collectChallengeTags(challenges, tags),
        [challenges, tags],
    )

    /** Adds/removes one slug from the picked set (the query re-runs on the new key). */
    const toggleTag = (slug: string) =>
        setTags((current) =>
            current.includes(slug)
                ? current.filter((item) => item !== slug)
                : [...current, slug],
        )

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

    // Apply the chosen sort to the filtered rows: "hot" = most-submitted first; "newest" =
    // latest start first (the BE list carries no createdAt, so startsAt is the recency proxy).
    const sorted = useMemo(() => {
        const rows = [...filtered]
        if (sort === "hot") {
            rows.sort((a, b) => b.submissionCount - a.submissionCount)
        } else {
            rows.sort((a, b) => Date.parse(b.startsAt ?? "") - Date.parse(a.startsAt ?? ""))
        }
        return rows
    }, [filtered, sort])

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Button size="sm" variant="tertiary" className="shrink-0" onPress={onBack}>
                    <ArrowLeftIcon aria-hidden focusable="false" className="size-4" />
                    {t("practice.backToHub")}
                </Button>
                {/* `practice.modes.*` never existed in either catalog — the header was
                    rendering the raw key path. The hub card's title is the same string. */}
                <Typography type="h5" weight="bold" className="min-w-0 flex-1">
                    {t("practice.modules.coding.title")}
                </Typography>
            </div>

            {/* filters: tag pills · type pills · lifecycle pills · search */}
            <div className="flex flex-col gap-3">
                {/* tags — the PE papers' way in; server-side AND filter, so the facets
                    narrow to what still co-occurs with the current pick */}
                {tagFacets.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <Typography type="body-xs" color="muted" className="mr-1">
                            {t("practice.coding.tags.label")}
                        </Typography>
                        <Button
                            size="sm"
                            variant={tags.length === 0 ? "secondary" : "ghost"}
                            onPress={() => setTags([])}
                        >
                            {t("practice.coding.tags.all")}
                        </Button>
                        {tagFacets.map((tag) => (
                            <Button
                                key={tag.slug}
                                size="sm"
                                variant={tags.includes(tag.slug) ? "secondary" : "ghost"}
                                aria-pressed={tags.includes(tag.slug)}
                                onPress={() => toggleTag(tag.slug)}
                            >
                                {tag.label}
                            </Button>
                        ))}
                    </div>
                ) : null}
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
                {/* sort: newest (startsAt desc) · hot (submissionCount desc) — same pill idiom */}
                <div className="flex flex-wrap items-center gap-2">
                    <Typography type="body-xs" color="muted" className="mr-1">
                        {t("practice.coding.sort.label")}
                    </Typography>
                    {SORT_OPTIONS.map((item) => (
                        <Button
                            key={item}
                            size="sm"
                            variant={sort === item ? "secondary" : "ghost"}
                            onPress={() => setSort(item)}
                        >
                            {t(`practice.coding.sort.${item}`)}
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
                {sorted.length === 0 ? (
                    <EmptyContent title={t("practice.coding.empty")} />
                ) : (
                    <div className="flex flex-col gap-2">
                        {sorted.map((challenge) => (
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
                    {/* the challenge's own tags (`pe`, the subject code, …) */}
                    {challenge.tags.map((tag) => (
                        <Chip key={tag.slug} size="sm" variant="tertiary" color="default">
                            {tag.label}
                        </Chip>
                    ))}
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

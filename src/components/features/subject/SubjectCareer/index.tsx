"use client"

import React, { useCallback, useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import {
    ArrowRightIcon,
    BracketsCurlyIcon,
    BriefcaseIcon,
    BrowserIcon,
    ChartLineIcon,
    CloudIcon,
    CompassIcon,
    DeviceMobileIcon,
    LockKeyIcon,
    RobotIcon,
} from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { SkillGraph } from "@/components/features/skill-graph"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { usePostApplyCareerOpportunitySwr } from "@/hooks/swr/api/rest/mutations/usePostApplyCareerOpportunitySwr"
import { usePostEnrollCareerRoadmapSwr } from "@/hooks/swr/api/rest/mutations/usePostEnrollCareerRoadmapSwr"
import { Link, useRouter } from "@/i18n/navigation"
import { useRestWithToast } from "@/modules/toast/hooks"
import {
    useQuerySubjectCareerSwr,
    type CareerSectionStatus,
    type SubjectCareerData,
    type SubjectOpportunityView,
    type SubjectRoadmapView,
    type SubjectSkillView,
} from "../hooks/useQuerySubjectCareerSwr"
import { CareerAdminPanel } from "./CareerAdminPanel"
import { OPPORTUNITY_TYPE_KEY } from "./taxonomy"

/** Icon per roadmap track (lower-cased BE `track`); unknown tracks get the briefcase. */
const ROADMAP_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
    backend: BracketsCurlyIcon,
    frontend: BrowserIcon,
    mobile: DeviceMobileIcon,
    ai: RobotIcon,
    data: ChartLineIcon,
    devops: CloudIcon,
}

/**
 * Career Bridge tab (§3 → §21) — wired to the real career module.
 *
 * Subject-scoped data (the skills `career.skill_subject_map` maps to this subject, the
 * `NEXT_SUBJECT` relations, and the roadmaps whose steps require those skills) sits on
 * top; the platform-wide sections (roadmaps with no match, open opportunities) are
 * labelled as general suggestions rather than dressed up as subject data. The backend
 * has no per-subject career list and no demand facet, so neither is rendered.
 */
export const SubjectCareer = () => {
    const t = useTranslations("subjects")
    const router = useRouter()
    const { subjectId } = useParams<{ subjectId: string }>()
    const { career, isLoading, error, mutate } = useQuerySubjectCareerSwr(subjectId)

    // "Nothing here" may only be claimed when every career read actually answered —
    // for a guest they all 401, and an unavailable section is not an empty one.
    const isEmpty =
        !!career &&
        career.skillCatalogueStatus === "loaded" &&
        career.roadmapsStatus === "loaded" &&
        career.opportunitiesStatus === "loaded" &&
        career.skills.length === 0 &&
        career.unresolvedSkillCount === 0 &&
        career.roadmaps.length === 0 &&
        career.opportunities.length === 0 &&
        career.nextSubjects.length === 0 &&
        !career.careerPath

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* header — static chrome, stays outside the async switch */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0">
                    <Typography type="h5" weight="bold">
                        {t("career.title")}
                    </Typography>
                    <Typography type="body-sm" color="muted">
                        {t("career.subtitle")}
                    </Typography>
                </div>
                <Button
                    size="sm"
                    variant="secondary"
                    onPress={() => router.push("/career")}
                >
                    {t("career.openCenter")}
                </Button>
            </div>

            <AsyncContent
                isLoading={isLoading && !career}
                skeleton={<CareerSkeleton />}
                isEmpty={isEmpty}
                emptyContent={{
                    title: t("career.empty"),
                    onRetry: () => {
                        void mutate()
                    },
                    retryLabel: t("career.retry"),
                }}
                error={!career ? error : undefined}
                errorContent={{
                    title: t("career.loadError"),
                    onRetry: () => {
                        void mutate()
                    },
                    retryLabel: t("career.retry"),
                }}
            >
                {career ? (
                    <CareerView career={career} subjectId={subjectId} mutate={mutate} />
                ) : null}
            </AsyncContent>

            {/*
              * Authoring — OUTSIDE the async switch on purpose: the state where a curator
              * most needs it is precisely the empty one ("the backend listed nothing"),
              * which replaces the whole tab body. Self-hides for a viewer the career module
              * would 403.
              */}
            <CareerAdminPanel
                onChanged={() => {
                    void mutate()
                }}
            />
        </div>
    )
}

/** Mutator of the tab's SWR entry (used for the optimistic enroll / apply writes). */
type CareerMutate = ReturnType<typeof useQuerySubjectCareerSwr>["mutate"]

/** Presentation of the loaded career bridge. */
const CareerView = ({
    career,
    subjectId,
    mutate,
}: {
    career: SubjectCareerData
    subjectId: string
    mutate: CareerMutate
}) => {
    const t = useTranslations("subjects")
    const runRest = useRestWithToast()
    const { guard } = useRequireAuth()
    // Raw BE tokens -> reader labels; the fallback is the TOKEN itself (a word, never an
    // id), so a value we have no translation for still reads (cf. CommunityModeration).
    const trackLabel = (track: string) =>
        t.has(`career.tracks.${track}`) ? t(`career.tracks.${track}`) : track
    const { trigger: enrollRoadmap } = usePostEnrollCareerRoadmapSwr()
    const { trigger: applyToOpportunity } = usePostApplyCareerOpportunitySwr()
    const [pendingRoadmap, setPendingRoadmap] = useState<string | null>(null)
    const [pendingOpportunity, setPendingOpportunity] = useState<string | null>(null)

    /** Rewrites one roadmap row off the FRESHEST cached value (optimistic + rollback). */
    const writeRoadmap = useCallback(
        (slug: string, enrolled: boolean) =>
            mutate(
                (current) =>
                    current
                        ? {
                            ...current,
                            roadmaps: current.roadmaps.map((roadmap) =>
                                roadmap.slug === slug ? { ...roadmap, enrolled } : roadmap,
                            ),
                        }
                        : current,
                { revalidate: false },
            ),
        [mutate],
    )

    /** Rewrites one opportunity row off the FRESHEST cached value. */
    const writeOpportunity = useCallback(
        (id: string, applied: boolean) =>
            mutate(
                (current) =>
                    current
                        ? {
                            ...current,
                            opportunities: current.opportunities.map((opportunity) =>
                                opportunity.id === id ? { ...opportunity, applied } : opportunity,
                            ),
                        }
                        : current,
                { revalidate: false },
            ),
        [mutate],
    )

    /** `POST /career/roadmaps/{slug}/enroll` — optimistic, rolled back on failure. */
    const onEnroll = guard(async (slug: string) => {
        setPendingRoadmap(slug)
        await writeRoadmap(slug, true)
        const result = await runRest(() => enrollRoadmap(slug), {
            successMessage: t("career.roadmapEnrollSuccess"),
        })
        if (!result) {
            await writeRoadmap(slug, false)
        }
        setPendingRoadmap(null)
    }, "auth.context.enroll")

    /** `POST /career/opportunities/{id}/apply` — optimistic, rolled back on failure. */
    const onApply = guard(async (id: string) => {
        setPendingOpportunity(id)
        await writeOpportunity(id, true)
        const result = await runRest(() => applyToOpportunity({ id, request: {} }), {
            successMessage: t("career.opportunityApplySuccess"),
        })
        if (!result) {
            await writeOpportunity(id, false)
        }
        setPendingOpportunity(null)
    }, "auth.context.generic")

    /*
     * Every `/career/**` read sits behind platform auth while this workspace page is
     * PUBLIC, so a guest 401s on all three at once. Repeating the identical "sign in"
     * card in each section (and letting the skill graph fail separately next to them)
     * says the same thing four times — one card for the whole tab instead, with the
     * PUBLIC facet (the subject's `NEXT_SUBJECT` relations) still rendered below it.
     */
    const allUnauthorized =
        career.skillCatalogueStatus === "unauthorized" &&
        career.roadmapsStatus === "unauthorized" &&
        career.opportunitiesStatus === "unauthorized"

    if (allUnauthorized) {
        return (
            <div className="flex flex-col gap-6">
                <SectionUnavailable
                    status="unauthorized"
                    onRetry={() => {
                        void mutate()
                    }}
                />
                <NextSubjectsSection nextSubjects={career.nextSubjects} />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* best-fit track — only when the BE actually computed one */}
            {career.careerPath ? (
                <div className="flex items-center gap-3 rounded-2xl border border-separator p-4">
                    <div
                        className="flex size-11 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent"
                        aria-hidden
                    >
                        <CompassIcon className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <Typography type="body-sm" weight="medium" truncate>
                            {t("career.careerPath", {
                                track: trackLabel(career.careerPath.track),
                            })}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {t("career.careerPathHint")}
                        </Typography>
                    </div>
                </div>
            ) : null}

            {/* skills mapped to THIS subject */}
            <section className="flex flex-col gap-3">
                <div className="flex flex-col gap-0">
                    <Typography type="h6" weight="bold">
                        {t("career.skills")}
                    </Typography>
                    {career.skillCatalogueStatus === "loaded" ? (
                        <Typography type="body-xs" color="muted">
                            {t("career.skillsHint")}
                        </Typography>
                    ) : null}
                </div>
                {career.skillCatalogueStatus !== "loaded" ? (
                    // the catalogue is what names a skill and carries its level ladder —
                    // without it there is no honest row to draw
                    <SectionUnavailable
                        status={career.skillCatalogueStatus}
                        onRetry={() => {
                            void mutate()
                        }}
                    />
                ) : (
                    <>
                        {career.skills.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {career.skills.map((skill) => (
                                    <SkillRow key={skill.id} skill={skill} />
                                ))}
                            </div>
                        ) : (
                            <EmptyContent title={t("career.skillsEmpty")} />
                        )}
                        {career.unresolvedSkillCount > 0 ? (
                            <Typography type="body-xs" color="muted">
                                {t("career.skillsUnresolved", {
                                    count: career.unresolvedSkillCount,
                                })}
                            </Typography>
                        ) : null}
                    </>
                )}
            </section>

            {/*
              * Subject-scoped skill graph (§21) — only when this subject HAS mapped skills
              * the catalogue could name. Without them the graph either falls back to the
              * whole platform catalogue (a second, unscoped copy of the section above) or
              * fails on its own auth-gated read, in both cases as a 400px block saying
              * nothing about this subject.
              */}
            {career.skillCatalogueStatus === "loaded" && career.skills.length > 0 ? (
                <section className="flex flex-col gap-3 border-t border-separator pt-6">
                    <Typography type="h6" weight="bold">
                        {t("career.skillGraph")}
                    </Typography>
                    <SkillGraph subjectId={subjectId} heightClassName="h-[400px]" />
                </section>
            ) : null}

            {/* roadmaps — related ones first, the rest honestly labelled as general */}
            <section className="flex flex-col gap-3 border-t border-separator pt-6">
                <div className="flex flex-col gap-0">
                    <Typography type="h6" weight="bold">
                        {t("career.roadmaps")}
                    </Typography>
                    {/*
                      * "no roadmap is tied to this subject" may only be claimed once EVERY
                      * published roadmap's steps were read; a bounded fan-out leaves the
                      * tail UNKNOWN, so it reports the coverage instead.
                      */}
                    {career.roadmapsStatus === "loaded" ? (
                        <Typography type="body-xs" color="muted">
                            {career.hasRelatedRoadmaps
                                ? t("career.roadmapsRelatedHint")
                                : career.roadmapsChecked >= career.roadmapsTotal
                                    ? t("career.roadmapsGeneralHint")
                                    : t("career.roadmapsPartialHint", {
                                        checked: career.roadmapsChecked,
                                        total: career.roadmapsTotal,
                                    })}
                        </Typography>
                    ) : null}
                </div>
                {career.roadmapsStatus !== "loaded" ? (
                    <SectionUnavailable
                        status={career.roadmapsStatus}
                        onRetry={() => {
                            void mutate()
                        }}
                    />
                ) : career.roadmaps.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {career.roadmaps.map((roadmap) => (
                            <RoadmapCard
                                key={roadmap.id}
                                roadmap={roadmap}
                                trackLabel={trackLabel}
                                isPending={pendingRoadmap === roadmap.slug}
                                onEnroll={() => onEnroll(roadmap.slug)}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyContent title={t("career.roadmapsEmpty")} />
                )}
            </section>

            {/* opportunities — platform-wide; only track-matched ones claim relevance */}
            <section className="flex flex-col gap-3 border-t border-separator pt-6">
                <div className="flex flex-col gap-0">
                    <Typography type="h6" weight="bold">
                        {t("career.opportunities")}
                    </Typography>
                    {career.opportunitiesStatus === "loaded" ? (
                        <Typography type="body-xs" color="muted">
                            {career.hasRelatedOpportunities
                                ? t("career.opportunitiesRelatedHint")
                                : t("career.opportunitiesGeneralHint")}
                        </Typography>
                    ) : null}
                </div>
                {career.opportunitiesStatus !== "loaded" ? (
                    <SectionUnavailable
                        status={career.opportunitiesStatus}
                        onRetry={() => {
                            void mutate()
                        }}
                    />
                ) : career.opportunities.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {career.opportunities.map((opportunity) => (
                            <OpportunityRow
                                key={opportunity.id}
                                opportunity={opportunity}
                                isPending={pendingOpportunity === opportunity.id}
                                onApply={() => onApply(opportunity.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyContent title={t("career.opportunitiesEmpty")} />
                )}
            </section>

            <NextSubjectsSection nextSubjects={career.nextSubjects} />
        </div>
    )
}

/** `NEXT_SUBJECT` relations of this subject — hidden when the BE lists none. */
const NextSubjectsSection = ({
    nextSubjects,
}: {
    nextSubjects: SubjectCareerData["nextSubjects"]
}) => {
    const t = useTranslations("subjects")

    if (nextSubjects.length === 0) {
        return null
    }

    return (
        <section className="flex flex-col gap-3 border-t border-separator pt-6">
            <div className="flex flex-col gap-0">
                <Typography type="h6" weight="bold">
                    {t("career.nextSubject")}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {t("career.nextSubjectHint")}
                </Typography>
            </div>
            {nextSubjects.map((next) => (
                <Link
                    key={next.id}
                    href={`/subjects/${next.code}`}
                    className="group flex items-center gap-3 rounded-2xl border border-separator p-4 transition-colors hover:border-accent/40"
                >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-large bg-accent/10 text-sm font-bold text-accent">
                        {next.code.slice(0, 3).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <Typography
                            type="body-sm"
                            weight="medium"
                            className="group-hover:underline"
                            truncate
                        >
                            {next.code} · {next.name}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {t("career.viewSubject")}
                        </Typography>
                    </div>
                    <ArrowRightIcon className="size-4 shrink-0 text-muted" aria-hidden />
                </Link>
            ))}
        </section>
    )
}

/**
 * Stands in for a career section whose read did not answer.
 *
 * `/career/**` is auth-gated while the subject workspace page is public, so a guest 401s
 * on every one of them; the section must invite a sign-in instead of reusing the "the
 * backend listed nothing" copy. Anything else is a real failure and offers a retry.
 */
const SectionUnavailable = ({
    status,
    onRetry,
}: {
    status: Exclude<CareerSectionStatus, "loaded">
    onRetry: () => void
}) => {
    const t = useTranslations("subjects")
    const { requireAuth } = useRequireAuth()

    if (status === "unauthorized") {
        return (
            <EmptyContent
                icon={<LockKeyIcon className="size-8 text-muted" aria-hidden focusable="false" />}
                title={t("career.signInTitle")}
                action={
                    <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => {
                            requireAuth("auth.context.generic")
                        }}
                    >
                        {t("career.signIn")}
                    </Button>
                }
            />
        )
    }

    return (
        <EmptyContent
            title={t("career.sectionError")}
            onRetry={onRetry}
            retryLabel={t("career.retry")}
        />
    )
}

/** One subject skill: mastery bar + the caller's level / target facets. */
const SkillRow = ({ skill }: { skill: SubjectSkillView }) => {
    const t = useTranslations("subjects")
    // `category` is a raw CHECK token (`LANGUAGE`, `CS_FOUNDATION`, …) — translate it, and
    // fall back to the token itself rather than shouting SQL at the reader.
    const categoryLabel = t.has(`career.skillCategories.${skill.category}`)
        ? t(`career.skillCategories.${skill.category}`)
        : skill.category

    return (
        <div className="flex flex-col gap-2">
            <ProgressMeter
                value={skill.mastery}
                label={skill.name}
                showValue
                aria-label={skill.name}
            />
            <div className="flex flex-wrap items-center gap-2">
                <Chip size="sm" variant="soft" color="default">
                    {t("career.skillLevel", { level: skill.level, max: skill.maxLevel })}
                </Chip>
                {skill.category ? (
                    <Chip size="sm" variant="soft" color="default">
                        {categoryLabel}
                    </Chip>
                ) : null}
                {skill.targetLevel !== null ? (
                    <Chip size="sm" variant="soft" color="accent">
                        {t("career.skillTarget", {
                            level: skill.targetLevel,
                            gap: skill.gap ?? 0,
                        })}
                    </Chip>
                ) : null}
                {skill.eligibleLevel > skill.level ? (
                    <Chip size="sm" variant="soft" color="success">
                        {t("career.skillEligible", { level: skill.eligibleLevel })}
                    </Chip>
                ) : null}
            </div>
        </div>
    )
}

/** One roadmap card: track icon + title + why-related line + the enroll action. */
const RoadmapCard = ({
    roadmap,
    trackLabel,
    isPending,
    onEnroll,
}: {
    roadmap: SubjectRoadmapView
    /** Translates a raw BE `track` token. */
    trackLabel: (track: string) => string
    isPending: boolean
    onEnroll: () => void
}) => {
    const t = useTranslations("subjects")
    const Icon = ROADMAP_ICON[roadmap.track.toLowerCase()] ?? BriefcaseIcon

    return (
        // `h-full` + the `mt-auto` action: grid cells stretch, so without them the enroll
        // buttons of a row sit at four different heights (the "related" block is optional).
        <div className="flex h-full flex-col gap-3 rounded-2xl border border-separator p-4 transition-colors hover:border-accent/40">
            <div className="flex items-center gap-3">
                <div
                    className="flex size-11 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent"
                    aria-hidden
                >
                    <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                    <Typography type="body-sm" weight="medium" truncate>
                        {roadmap.title}
                    </Typography>
                    {/* the icon alone never says which track this is */}
                    {roadmap.track ? (
                        <Typography type="body-xs" color="muted" truncate>
                            {trackLabel(roadmap.track)}
                        </Typography>
                    ) : null}
                </div>
            </div>
            {roadmap.related ? (
                <div className="flex flex-col gap-1">
                    <Chip size="sm" variant="soft" color="accent" className="self-start">
                        {t("career.related")}
                    </Chip>
                    {roadmap.matchedSkillNames.length > 0 ? (
                        <Typography type="body-xs" color="muted">
                            {t("career.roadmapMatched", {
                                skills: roadmap.matchedSkillNames.join(", "),
                            })}
                        </Typography>
                    ) : null}
                </div>
            ) : null}
            <Button
                className="mt-auto"
                size="sm"
                variant="ghost"
                isPending={isPending}
                isDisabled={roadmap.enrolled || isPending}
                onPress={onEnroll}
            >
                {roadmap.enrolled ? t("career.roadmapEnrolled") : t("career.roadmapEnroll")}
            </Button>
        </div>
    )
}

/** One opportunity row: title/company + facets + the apply action. */
const OpportunityRow = ({
    opportunity,
    isPending,
    onApply,
}: {
    opportunity: SubjectOpportunityView
    isPending: boolean
    onApply: () => void
}) => {
    const t = useTranslations("subjects")
    const locale = useLocale()

    /** company · location · remote · deadline — every part degrades away on its own. */
    const meta: Array<string> = []
    if (opportunity.company) {
        meta.push(opportunity.company)
    }
    if (opportunity.location) {
        meta.push(opportunity.location)
    }
    if (opportunity.remote) {
        meta.push(t("career.remote"))
    }
    if (opportunity.applyDeadline) {
        const deadline = new Date(opportunity.applyDeadline)
        if (!Number.isNaN(deadline.getTime())) {
            meta.push(t("career.deadline", { date: deadline.toLocaleDateString(locale) }))
        }
    }

    const typeKey = OPPORTUNITY_TYPE_KEY[opportunity.type] ?? "other"

    return (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-separator p-4 transition-colors hover:border-accent/40">
            <div className="min-w-0 flex-1">
                <Typography type="body-sm" weight="medium" truncate>
                    {opportunity.title}
                </Typography>
                {meta.length > 0 ? (
                    <Typography type="body-xs" color="muted" className="truncate">
                        {meta.join(" · ")}
                    </Typography>
                ) : null}
            </div>
            {/* facets + action travel together, so a narrow row wraps as one block
                instead of scattering a lone chip onto its own line */}
            <div className="flex flex-wrap items-center gap-2">
                {opportunity.related ? (
                    <Chip size="sm" variant="soft" color="accent">
                        {t("career.related")}
                    </Chip>
                ) : null}
                <Chip size="sm" variant="soft" color="default">
                    {t(`career.opportunityTypes.${typeKey}`)}
                </Chip>
                <Button
                    size="sm"
                    variant="secondary"
                    isPending={isPending}
                    isDisabled={opportunity.applied || isPending}
                    onPress={onApply}
                >
                    {opportunity.applied
                        ? t("career.opportunityApplied")
                        : t("career.opportunityApply")}
                </Button>
            </div>
        </div>
    )
}

/** Loading skeleton — mirrors skill bars + graph block + roadmap cards + job rows. */
const CareerSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-32 rounded-sm" />
            {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-40 rounded-full" />
                    <Skeleton className="h-2 w-full rounded-full" />
                </div>
            ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-separator pt-6">
            <Skeleton className="h-5 w-32 rounded-sm" />
            <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
        <div className="flex flex-col gap-3 border-t border-separator pt-6">
            <Skeleton className="h-5 w-32 rounded-sm" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-[132px] w-full rounded-2xl" />
                ))}
            </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-separator pt-6">
            <Skeleton className="h-5 w-32 rounded-sm" />
            {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-[76px] w-full rounded-2xl" />
            ))}
        </div>
    </div>
)

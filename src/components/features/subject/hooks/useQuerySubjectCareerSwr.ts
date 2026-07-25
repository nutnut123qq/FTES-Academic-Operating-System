"use client"

import useSWR from "swr"
import {
    masteryOf,
    maxLevelOf,
} from "@/components/features/skill-graph/hooks/skillGraphModel"
import {
    getCareerOpportunities,
    getCareerRoadmapDetail,
    getCareerRoadmaps,
    getCareerSkills,
    getMyCareerApplications,
    getMyCareerRecommendations,
    getMyCareerRoadmaps,
    getMyCareerSkills,
    type CareerMyRoadmap,
    type CareerOpportunity,
    type CareerOpportunityApplication,
    type CareerRecommendation,
    type CareerRoadmap,
    type CareerRoadmapDetail,
    type CareerSkill,
    type CareerSkillGraph,
    type CareerSkillProgress,
} from "@/modules/api/rest/career"
import { getSubjectWorkspace } from "@/modules/api/rest/subject/subject"

/**
 * One skill the backend maps to THIS subject (`career.skill_subject_map`, surfaced by
 * the workspace aggregate as `careerBridge.relatedSkills` — a list of skill UUIDs),
 * joined with the skill catalogue for its name and with the caller's own progress row.
 */
export interface SubjectSkillView {
    /** Skill UUID (`career.skills.id`). */
    id: string
    /** Catalogue name — a row only exists when the catalogue resolved the id. */
    name: string
    /** Raw BE category (`LANGUAGE`, `FRAMEWORK`, `DATABASE`, …); `""` when unknown. */
    category: string
    /** The caller's attained level (0 for guests / no progress row). */
    level: number
    /** Top of this skill's own `levels` ladder. */
    maxLevel: number
    /** `level` normalised to 0–100 against `maxLevel`. */
    mastery: number
    /** Level an assessment confirmed but points have not unlocked yet (0 = none). */
    eligibleLevel: number
    /** Target level from the caller's `NEXT_SKILL` recommendation, or `null`. */
    targetLevel: number | null
    /** Levels still missing to reach `targetLevel`, or `null` when there is no target. */
    gap: number | null
}

/** A subject the BE relates to this one with `NEXT_SUBJECT` (a real subject relation). */
export interface SubjectNextSubjectView {
    /** Related subject UUID. */
    id: string
    code: string
    name: string
}

/** A published career roadmap, flagged when it provably touches this subject. */
export interface SubjectRoadmapView {
    id: string
    slug: string
    title: string
    /** Raw BE track (`BACKEND`, `FRONTEND`, …); `""` when the roadmap has none. */
    track: string
    /**
     * True when a step of this roadmap references one of the subject's skills or the
     * subject itself (`career.roadmap_steps.skill_ids` / `subject_ids`) — never guessed.
     */
    related: boolean
    /** Names of the subject skills this roadmap requires (drives the "why" line). */
    matchedSkillNames: Array<string>
    /** True when the caller already follows it (`GET /career/me/roadmaps`). */
    enrolled: boolean
}

/** An open opportunity. `related` only when its track comes from a related roadmap. */
export interface SubjectOpportunityView {
    id: string
    title: string
    company: string
    /** Raw BE type (`INTERNSHIP` | `JOB` | `PORTFOLIO_REVIEW`). */
    type: string
    track: string
    location: string
    remote: boolean
    /** ISO instant, or `""` when the posting has no deadline. */
    applyDeadline: string
    /** True when the track matches a roadmap related to this subject. */
    related: boolean
    /** True when the caller already applied (`GET /career/me/applications`). */
    applied: boolean
}

/** The caller's `CAREER_PATH` recommendation (best-fit track + its weighted score). */
export interface CareerPathView {
    track: string
    score: number
}

/**
 * Outcome of one `/career/*` read.
 *
 * The subject workspace page is PUBLIC (`GET /subjects/{code}/workspace` is issued
 * unauthenticated) while every `/career/**` endpoint sits behind platform auth, so a
 * guest gets `401 PLATFORM_UNAUTHORIZED` on each career read. An empty section must
 * therefore not be reported as "the backend has nothing" — the tab needs to tell a
 * genuine empty `200` apart from "not signed in" and from a real failure.
 */
export type CareerSectionStatus = "loaded" | "unauthorized" | "failed"

/** Everything the Career Bridge tab renders. */
export interface SubjectCareerData {
    /** Skills the BE maps to this subject — the genuinely subject-scoped facet. */
    skills: Array<SubjectSkillView>
    /** `NEXT_SUBJECT` relations of this subject. */
    nextSubjects: Array<SubjectNextSubjectView>
    /** Published roadmaps, subject-related first. */
    roadmaps: Array<SubjectRoadmapView>
    /** Open opportunities, subject-related first. */
    opportunities: Array<SubjectOpportunityView>
    /** The caller's best-fit track, or `null` when the worker computed none. */
    careerPath: CareerPathView | null
    /** True when at least one roadmap is provably related to this subject. */
    hasRelatedRoadmaps: boolean
    /** True when at least one opportunity sits on a subject-related track. */
    hasRelatedOpportunities: boolean
    /** Outcome of `GET /career/skills` — the catalogue every skill row is named from. */
    skillCatalogueStatus: CareerSectionStatus
    /** Outcome of `GET /career/roadmaps`. */
    roadmapsStatus: CareerSectionStatus
    /** Outcome of `GET /career/opportunities?status=OPEN`. */
    opportunitiesStatus: CareerSectionStatus
    /** Mapped skill ids the catalogue could not name — dropped from {@link skills}. */
    unresolvedSkillCount: number
    /** Published roadmaps whose steps we could actually read (relatedness tested). */
    roadmapsChecked: number
    /** Published roadmaps returned by the BE. */
    roadmapsTotal: number
}

/**
 * Upper bound on the roadmap-detail fan-out used to test relatedness.
 *
 * The relatedness of a roadmap only shows in its STEPS, which the list endpoint does not
 * carry, so each roadmap needs its own (backend Redis-cached) detail read. The bound
 * keeps a pathological catalogue from firing hundreds of requests; whenever it bites,
 * `roadmapsChecked < roadmapsTotal` and the tab must NOT claim the unchecked tail is
 * unrelated. Slugs are sorted before slicing because `RoadmapRepository.findByStatus`
 * has no `ORDER BY` — without that, which roadmaps get checked would vary per request.
 */
const ROADMAP_DETAIL_LIMIT = 24

/**
 * Reads a backend jsonb-as-string column (`recommendations.payload`, `skills.levels`, …).
 *
 * Hibernate maps those `jsonb` columns onto a Java `String`, so Jackson emits an ESCAPED
 * JSON string; a plain object is accepted too, so the mapping survives either shape.
 *
 * @param raw - the value as it arrived.
 * @returns the parsed value, or `null` when it is absent/unparsable.
 */
export const parseJsonColumn = (raw: unknown): unknown => {
    if (raw === null || raw === undefined) {
        return null
    }
    if (typeof raw === "object") {
        return raw
    }
    if (typeof raw !== "string") {
        return null
    }
    try {
        return JSON.parse(raw)
    } catch {
        return null
    }
}

/** Narrows an unknown value to a plain record. */
const asRecord = (value: unknown): Record<string, unknown> | null =>
    typeof value === "object" && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null

/** Reads a finite number out of an unknown field; `null` when it is not numeric. */
const asNumber = (value: unknown): number | null => {
    if (value === null || value === undefined || value === "") {
        return null
    }
    const parsed = typeof value === "number" ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

/** Collects the string entries out of an unknown array-ish field. */
const asStringList = (value: unknown): Array<string> =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []

/**
 * Reads the per-skill targets out of the caller's `NEXT_SKILL` recommendation
 * (`payload.items[] = {skillId, currentLevel, targetLevel, gap, reasonCodes}`).
 *
 * @param recommendations - `GET /career/me/recommendations` rows.
 * @returns skillId → `{targetLevel, gap}`; empty when the worker computed none.
 */
export const readSkillTargets = (
    recommendations: Array<CareerRecommendation>,
): Map<string, { targetLevel: number; gap: number }> => {
    const targets = new Map<string, { targetLevel: number; gap: number }>()
    for (const recommendation of recommendations ?? []) {
        if (recommendation?.kind !== "NEXT_SKILL") {
            continue
        }
        const payload = asRecord(parseJsonColumn(recommendation.payload))
        const items = Array.isArray(payload?.items) ? payload.items : []
        for (const rawItem of items) {
            const item = asRecord(rawItem)
            const skillId = item?.skillId
            const targetLevel = asNumber(item?.targetLevel)
            if (typeof skillId !== "string" || targetLevel === null) {
                continue
            }
            const gap = asNumber(item?.gap)
            const currentLevel = asNumber(item?.currentLevel) ?? 0
            targets.set(skillId, {
                targetLevel,
                gap: gap ?? Math.max(0, targetLevel - currentLevel),
            })
        }
    }
    return targets
}

/**
 * Reads the caller's `CAREER_PATH` recommendation (`{track, score, reasonCodes}`).
 *
 * @param recommendations - `GET /career/me/recommendations` rows.
 * @returns the best-fit track, or `null` when there is none — the BE emits no track
 * for a caller without levelled skills, and nothing is invented here.
 */
export const readCareerPath = (
    recommendations: Array<CareerRecommendation>,
): CareerPathView | null => {
    for (const recommendation of recommendations ?? []) {
        if (recommendation?.kind !== "CAREER_PATH") {
            continue
        }
        const payload = asRecord(parseJsonColumn(recommendation.payload))
        const track = payload?.track
        if (typeof track !== "string" || track.length === 0) {
            continue
        }
        return { track, score: asNumber(payload?.score) ?? 0 }
    }
    return null
}

/**
 * Joins the subject's skill ids with the catalogue, the caller's progress and the
 * `NEXT_SKILL` targets.
 *
 * A mapped id the catalogue does NOT resolve produces NO row: its name would be the raw
 * UUID and its level ceiling would be `maxLevelOf(undefined)` = a hard-coded 5 that no BE
 * ladder declares — i.e. a fabricated denominator behind a real-looking mastery bar.
 * Callers surface the drop through `unresolvedSkillCount` instead.
 *
 * @param relatedSkillIds - `careerBridge.relatedSkills` (skill UUIDs).
 * @param catalogue - `GET /career/skills` → `skills[]`.
 * @param progress - `GET /career/me/skills` (empty for guests / 403).
 * @param targets - output of {@link readSkillTargets}.
 * @returns one row per RESOLVED mapped skill, least-mastered first (what to study next).
 */
export const mapSubjectSkills = (
    relatedSkillIds: Array<string>,
    catalogue: Array<CareerSkill>,
    progress: Array<CareerSkillProgress>,
    targets: Map<string, { targetLevel: number; gap: number }>,
): Array<SubjectSkillView> => {
    const skillById = new Map((catalogue ?? []).map((skill) => [skill.id, skill]))
    const progressById = new Map((progress ?? []).map((row) => [row.skillId, row]))

    return (relatedSkillIds ?? [])
        .filter((id): id is string => typeof id === "string" && id.length > 0)
        .flatMap((id) => {
            const skill = skillById.get(id)
            // No catalogue entry → no name and no level ladder: skip rather than print a
            // UUID against an invented 5-level ceiling.
            if (!skill) {
                return []
            }
            const row = progressById.get(id)
            const maxLevel = maxLevelOf(skill.levels)
            const level = asNumber(row?.level) ?? 0
            const target = targets.get(id) ?? null
            return [
                {
                    id,
                    name: skill.name,
                    category: skill.category ?? "",
                    level,
                    maxLevel,
                    mastery: masteryOf(level, maxLevel),
                    eligibleLevel: asNumber(row?.eligibleLevel) ?? 0,
                    targetLevel: target?.targetLevel ?? null,
                    gap: target?.gap ?? null,
                },
            ]
        })
        .sort((a, b) => a.mastery - b.mastery || a.name.localeCompare(b.name))
}

/**
 * Reads one `GET /career/roadmaps/{slug}` step row.
 *
 * The backend serves the steps straight from a `JdbcTemplate.queryForList`, so the keys
 * arrive snake_case (`skill_ids`, `subject_ids`) while the shared FE type declares
 * camelCase — both spellings are accepted, exactly like the skill-graph relation rows.
 *
 * @param raw - one entry of `detail.steps`.
 * @returns the referenced skill ids + subject ids (empty when the row is unusable).
 */
export const readRoadmapStepRefs = (
    raw: unknown,
): { skillIds: Array<string>; subjectIds: Array<string> } => {
    const row = asRecord(raw)
    if (!row) {
        return { skillIds: [], subjectIds: [] }
    }
    return {
        skillIds: asStringList(row.skillIds ?? row.skill_ids),
        subjectIds: asStringList(row.subjectIds ?? row.subject_ids),
    }
}

/**
 * Flags each published roadmap as subject-related when one of its steps references a
 * skill mapped to the subject (or the subject itself), and marks the ones the caller
 * already follows. Related roadmaps come first; nothing is filtered out, so the list
 * stays honest — a general suggestion — when no roadmap touches the subject.
 *
 * @param roadmaps - `GET /career/roadmaps` (published).
 * @param detailBySlug - `GET /career/roadmaps/{slug}` for the slugs we could load.
 * @param subjectSkillIds - the subject's mapped skill ids.
 * @param subjectId - the subject UUID (`workspace.overview.id`).
 * @param enrolled - roadmap ids the caller is enrolled in.
 * @param skillNameById - skill id → name, for the "why related" line.
 */
export const mapRoadmaps = (
    roadmaps: Array<CareerRoadmap>,
    detailBySlug: Map<string, CareerRoadmapDetail>,
    subjectSkillIds: Array<string>,
    subjectId: string,
    enrolled: Set<string>,
    skillNameById: Map<string, string>,
): Array<SubjectRoadmapView> => {
    const anchors = new Set(subjectSkillIds ?? [])

    const views = (roadmaps ?? []).map((roadmap) => {
        const detail = detailBySlug.get(roadmap.slug)
        const matched = new Set<string>()
        let touchesSubject = false
        for (const step of detail?.steps ?? []) {
            const refs = readRoadmapStepRefs(step)
            for (const skillId of refs.skillIds) {
                if (anchors.has(skillId)) {
                    matched.add(skillId)
                }
            }
            if (subjectId && refs.subjectIds.includes(subjectId)) {
                touchesSubject = true
            }
        }
        return {
            id: roadmap.id,
            slug: roadmap.slug,
            title: roadmap.title,
            track: roadmap.track ?? "",
            related: matched.size > 0 || touchesSubject,
            matchedSkillNames: [...matched].map((id) => skillNameById.get(id) ?? id).sort(),
            enrolled: enrolled.has(roadmap.id),
        }
    })

    return views.sort(
        (a, b) => Number(b.related) - Number(a.related) || a.title.localeCompare(b.title),
    )
}

/**
 * Flags each open opportunity whose track belongs to a subject-related roadmap and marks
 * the ones the caller already applied to. Related first, then by title.
 *
 * @param opportunities - `GET /career/opportunities?status=OPEN`.
 * @param relatedTracks - tracks of the roadmaps related to the subject (upper-cased).
 * @param appliedOpportunityIds - opportunity ids from `GET /career/me/applications`.
 */
export const mapOpportunities = (
    opportunities: Array<CareerOpportunity>,
    relatedTracks: Set<string>,
    appliedOpportunityIds: Set<string>,
): Array<SubjectOpportunityView> => {
    const views = (opportunities ?? []).map((opportunity) => {
        const track = opportunity.track ?? ""
        return {
            id: opportunity.id,
            title: opportunity.title,
            company: opportunity.company ?? "",
            type: opportunity.type ?? "",
            track,
            location: opportunity.location ?? "",
            remote: Boolean(opportunity.remote),
            applyDeadline: opportunity.applyDeadline ?? "",
            related: track.length > 0 && relatedTracks.has(track.toUpperCase()),
            applied: appliedOpportunityIds.has(opportunity.id),
        }
    })

    return views.sort(
        (a, b) => Number(b.related) - Number(a.related) || a.title.localeCompare(b.title),
    )
}

/** Unwraps a settled promise, degrading a rejection to `fallback`. */
const settledOr = <T>(result: PromiseSettledResult<T>, fallback: T): T =>
    result.status === "fulfilled" ? result.value : fallback

/**
 * Classifies a settled `/career/*` read so the tab can tell "the BE has nothing" apart
 * from "you are not signed in" and from a transient failure.
 *
 * The rejection is a `RestError` carrying the HTTP `status` (duck-typed here to keep the
 * mapping module free of the REST client); `401`/`403` mean the guest/role gate fired.
 */
export const sectionStatusOf = (
    result: PromiseSettledResult<unknown>,
): CareerSectionStatus => {
    if (result.status === "fulfilled") {
        return "loaded"
    }
    const status = (result.reason as { status?: unknown } | null | undefined)?.status
    return status === 401 || status === 403 ? "unauthorized" : "failed"
}

/**
 * Loads everything the Career Bridge tab shows, from the real career REST surface.
 *
 * The subject-scoped anchor is `GET /subjects/{code}/workspace → careerBridge`
 * (`relatedSkills` = the skill UUIDs of `career.skill_subject_map`, `nextSubjects` = the
 * subject's `NEXT_SUBJECT` relations); it is PUBLIC and the only call allowed to fail the
 * tab. Every `/career/*` read below is auth-gated, so a guest gets 401 on all of them:
 * each degrades to an empty section AND reports its {@link CareerSectionStatus}, so the
 * renderer can prompt for sign-in instead of claiming the backend listed nothing:
 *
 * - `GET /career/skills` → skill names / categories / level ladders,
 * - `GET /career/me/skills` → the caller's level per skill (guests get none),
 * - `GET /career/roadmaps` (+ `/{slug}` details) → published tracks, flagged related when
 *   a step references one of the subject's skills or the subject itself,
 * - `GET /career/me/roadmaps` → which of those the caller already follows,
 * - `GET /career/opportunities?status=OPEN` → open postings, flagged related when their
 *   track belongs to a related roadmap,
 * - `GET /career/me/applications` → the postings the caller already applied to,
 * - `GET /career/me/recommendations` → `NEXT_SKILL` targets + the `CAREER_PATH` track.
 *
 * The backend has NO per-subject career list — `careerBridge.relatedCareers` has no
 * source behind it and always comes back empty, and there is no demand facet anywhere —
 * so no "related careers" figure is produced here.
 *
 * @param code - the subject CODE (the `[subjectId]` route segment), upper-cased.
 */
export const fetchSubjectCareer = async (code: string): Promise<SubjectCareerData> => {
    const workspace = await getSubjectWorkspace(code)
    const bridge = workspace.careerBridge?.data ?? null
    const subjectId = workspace.overview?.id ?? ""
    const relatedSkillIds = (bridge?.relatedSkills ?? []).filter(
        (id): id is string => typeof id === "string" && id.length > 0,
    )

    const [
        catalogueResult,
        progressResult,
        roadmapsResult,
        myRoadmapsResult,
        opportunitiesResult,
        applicationsResult,
        recommendationsResult,
    ] = await Promise.allSettled([
        getCareerSkills(),
        getMyCareerSkills(),
        getCareerRoadmaps(),
        getMyCareerRoadmaps(),
        getCareerOpportunities({ status: "OPEN" }),
        getMyCareerApplications(),
        getMyCareerRecommendations(),
    ])

    const catalogue = settledOr<CareerSkillGraph | null>(catalogueResult, null)
    const progress = settledOr<Array<CareerSkillProgress>>(progressResult, [])
    const roadmaps = settledOr<Array<CareerRoadmap>>(roadmapsResult, []) ?? []
    const myRoadmaps = settledOr<Array<CareerMyRoadmap>>(myRoadmapsResult, []) ?? []
    const opportunities = settledOr<Array<CareerOpportunity>>(opportunitiesResult, []) ?? []
    const applications =
        settledOr<Array<CareerOpportunityApplication>>(applicationsResult, []) ?? []
    const recommendations =
        settledOr<Array<CareerRecommendation>>(recommendationsResult, []) ?? []

    // Relatedness lives in the roadmap STEPS, which only the per-slug detail carries
    // (Redis-cached backend side). Skip the fan-out when there is nothing to match on.
    const detailBySlug = new Map<string, CareerRoadmapDetail>()
    if (roadmaps.length > 0 && (relatedSkillIds.length > 0 || subjectId)) {
        const slugs = roadmaps
            .map((roadmap) => roadmap.slug)
            .filter((slug): slug is string => typeof slug === "string" && slug.length > 0)
            // deterministic slice: the BE lists published roadmaps without an ORDER BY
            .sort((left, right) => left.localeCompare(right))
            .slice(0, ROADMAP_DETAIL_LIMIT)
        const details = await Promise.allSettled(
            slugs.map((slug) => getCareerRoadmapDetail(slug)),
        )
        details.forEach((result, index) => {
            if (result.status === "fulfilled" && result.value) {
                detailBySlug.set(slugs[index], result.value)
            }
        })
    }

    const catalogueSkills = catalogue?.skills ?? []
    const catalogueIds = new Set(catalogueSkills.map((skill) => skill.id))
    const unresolvedSkillCount = relatedSkillIds.filter((id) => !catalogueIds.has(id)).length
    const skillNameById = new Map(catalogueSkills.map((skill) => [skill.id, skill.name]))
    const skills = mapSubjectSkills(
        relatedSkillIds,
        catalogueSkills,
        progress ?? [],
        readSkillTargets(recommendations),
    )

    const mappedRoadmaps = mapRoadmaps(
        roadmaps,
        detailBySlug,
        relatedSkillIds,
        subjectId,
        new Set(myRoadmaps.map((entry) => entry.roadmapId)),
        skillNameById,
    )
    const relatedTracks = new Set(
        mappedRoadmaps
            .filter((roadmap) => roadmap.related && roadmap.track)
            .map((roadmap) => roadmap.track.toUpperCase()),
    )
    const mappedOpportunities = mapOpportunities(
        opportunities,
        relatedTracks,
        new Set(applications.map((application) => application.opportunityId)),
    )

    return {
        skills,
        nextSubjects: (bridge?.nextSubjects ?? []).map((related) => ({
            id: related.relatedId,
            code: related.code,
            name: related.name,
        })),
        roadmaps: mappedRoadmaps,
        opportunities: mappedOpportunities,
        careerPath: readCareerPath(recommendations),
        hasRelatedRoadmaps: mappedRoadmaps.some((roadmap) => roadmap.related),
        hasRelatedOpportunities: mappedOpportunities.some((opportunity) => opportunity.related),
        skillCatalogueStatus: sectionStatusOf(catalogueResult),
        roadmapsStatus: sectionStatusOf(roadmapsResult),
        opportunitiesStatus: sectionStatusOf(opportunitiesResult),
        unresolvedSkillCount,
        // Only the roadmaps whose steps we actually read were TESTED for relatedness;
        // the rest are unknown, never "unrelated".
        roadmapsChecked: detailBySlug.size,
        roadmapsTotal: roadmaps.length,
    }
}

/**
 * SWR wrapper around {@link fetchSubjectCareer} for the Career Bridge tab.
 *
 * @param subjectId - the `[subjectId]` route segment (the subject CODE).
 * @returns `{ career, isLoading, error, mutate }`; `mutate` accepts an updater, so the
 * enroll / apply actions can write optimistically off the freshest cached value.
 */
export const useQuerySubjectCareerSwr = (subjectId: string) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { data, isLoading, error, mutate } = useSWR(
        code ? (["subject-career", code] as const) : null,
        () => fetchSubjectCareer(code),
    )
    return { career: data, isLoading, error, mutate }
}

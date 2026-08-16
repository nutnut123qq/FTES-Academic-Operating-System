/**
 * Request/response DTOs for the career REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.career.web.CareerController`,
 * `CareerSkillController`, and the `vn.ftes.aos.career.domain` entities they return.
 * StarCI identifiers are kept exactly as named in the backend contract.
 */

// ---- Roadmap ----

export interface CreateCareerRoadmapRequest {
    slug: string
    title: string
    track?: string
}

export interface PatchCareerRoadmapRequest {
    title?: string
    status?: string
}

export interface CareerRoadmap {
    id: string
    slug: string
    title: string
    description?: string
    track?: string
    starciRoadmapId?: string
    status: string
    createdAt: string
    updatedAt: string
}

/**
 * One step of `GET /career/roadmaps/{slug}` → `steps[]`.
 *
 * WIRE SHAPE: the backend serves these rows straight from a
 * `JdbcTemplate.queryForList` (`RoadmapService#steps`), so the keys arrive
 * **snake_case** (`step_order`, `skill_ids`, `subject_ids`, `target_levels`,
 * `starci_course_refs`); `uuid[]` columns are flattened to `string[]` and `jsonb`
 * columns to plain JSON before serialisation. The camelCase spellings are kept as
 * optional aliases so a future DTO-based response keeps type-checking — read the row
 * tolerantly (accept both) instead of assuming one.
 */
export interface CareerRoadmapStep {
    id: string
    title: string
    description?: string
    /** Step position; `step_order` on the wire today. */
    stepOrder?: number
    step_order?: number
    /** Skill UUIDs required by the step (`uuid[]` → `string[]`). */
    skillIds?: unknown
    skill_ids?: unknown
    /** `{skillId: targetLevel}` object. */
    targetLevels?: unknown
    target_levels?: unknown
    /** Subject UUIDs the step points at (`uuid[]` → `string[]`). */
    subjectIds?: unknown
    subject_ids?: unknown
    /** StarCI course refs; only filled once the integration hub syncs them. */
    starciCourseRefs?: unknown
    starci_course_refs?: unknown
}

export interface CareerRoadmapDetail {
    roadmap: CareerRoadmap
    steps: CareerRoadmapStep[]
}

export interface CareerRoadmapEnrollment {
    userId: string
    roadmapId: string
    currentStep: number
    status: string
    enrolledAt: string
    updatedAt: string
}

export interface CareerMyRoadmapStepSkill {
    skillId: string
    currentLevel: number
    targetLevel: number
    met: boolean
}

export interface CareerMyRoadmapStep {
    stepOrder: number
    title: string
    skills: CareerMyRoadmapStepSkill[]
    completed: boolean
}

export interface CareerMyRoadmap {
    roadmapId: string
    currentStep: number
    status: string
    steps: CareerMyRoadmapStep[]
}

// ---- Opportunity ----

export interface CreateCareerOpportunityRequest {
    type: string
    title: string
    description: string
}

export interface PatchCareerOpportunityRequest {
    status: string
}

export interface ApplyCareerOpportunityRequest {
    coverNote?: string
    resumeAssetRef?: string
}

export interface PatchCareerApplicationStatusRequest {
    status: string
}

export interface CareerOpportunity {
    id: string
    type: string
    title: string
    company?: string
    description: string
    /** Backend JSON string of required skills. */
    requiredSkills: string
    track?: string
    location?: string
    remote: boolean
    source: string
    starciRef?: string
    applyDeadline?: string
    status: string
    createdBy?: string
    createdAt: string
    updatedAt: string
}

export interface CareerOpportunityApplication {
    id: string
    opportunityId: string
    userId: string
    coverNote?: string
    resumeAssetRef?: string
    status: string
    createdAt: string
    updatedAt: string
}

// ---- Mentorship ----

export interface RequestCareerMentorRequest {
    track: string
    message: string
}

export interface CareerMentorshipActionRequest {
    action: string
}

export interface CareerMentorship {
    id: string
    mentorId: string
    menteeId: string
    track?: string
    status: string
    message?: string
    startedAt?: string
    endedAt?: string
    createdAt: string
}

// ---- Recommendation ----

export interface CareerRecommendation {
    userId: string
    kind: string
    /** Backend JSON string payload. */
    payload: string
    computedAt: string
}

// ---- Skill ----

export interface CreateCareerSkillRequest {
    slug: string
    name: string
    category: string
    levels: string
}

export interface PatchCareerSkillRequest {
    name?: string
    description?: string
    levels?: string
}

export interface CareerSkill {
    id: string
    slug: string
    name: string
    description?: string
    category: string
    /** Backend JSON string of proficiency levels. */
    levels: string
    starciSkillId?: string
    status: string
    createdAt: string
    updatedAt: string
}

export interface CareerSkillRelation {
    skillId: string
    relatedId: string
    relation: string
}

export interface CareerSkillGraph {
    skills: CareerSkill[]
    relations: CareerSkillRelation[]
}

export interface CareerSkillProgress {
    userId: string
    skillId: string
    level: number
    progressPoints: number
    eligibleLevel: number
    /** Backend JSON string of source breakdown. */
    sourceBreakdown: string
    lastAssessedAt?: string
    updatedAt: string
}

export interface CareerSelfAssessmentRequest {
    resultingLevel?: number
    attemptId?: string
}

export interface CareerMentorAssessmentRequest {
    kind?: string
    score?: number
    resultingLevel?: number
    evidenceRef?: string
}

export interface CareerSkillAssessment {
    id: string
    userId: string
    skillId: string
    kind: string
    score?: number
    resultingLevel?: number
    assessedBy?: string
    evidenceRef?: string
    createdAt: string
}

// ---- Skill categories & EXP (change `course-skill-exp`) ----
//
// A SECOND, coarser taxonomy that sits beside the per-skill graph above: ten managed
// CATEGORIES (`career.skill_categories`) plus a learner's uncapped running EXP total per
// category (`career.user_category_exp`), credited as they cross 30/50/80/100% of a course.
// Kept separate on purpose — `CareerSkill` / `CareerSkillProgress` and the skill graph are
// untouched by this taxonomy.

/**
 * One bucket of the managed skill-category catalogue (`GET /career/skill-categories`).
 * Mirrors `SkillExpDtos.CategoryView` — the row id stays server-side; the slug is the
 * public key.
 */
export interface CareerSkillCategory {
    /** Stable slug (`programming`, `cs-fundamentals`, …) — also the i18n key suffix. */
    slug: string
    /** Backend display label; the FE falls back to it when a slug has no translation. */
    label: string
    /** Catalogue display order (`sort_order`). */
    sortOrder: number
}

/**
 * One category total from `GET /career/me/skill-exp` (`SkillExpDtos.CategoryExpView`).
 * Categories the learner has not earned in yet come back with `totalExp: 0` — so a
 * chart over this payload always has a full set of bars.
 */
export interface CareerUserSkillExp {
    slug: string
    label: string
    sortOrder: number
    /** Accumulated EXP for the category. Uncapped: more courses keep adding. */
    totalExp: number
}

/**
 * Where the returned set of categories came from (`SkillExpDtos.SkillSetSource`).
 *
 * Keep the two apart in the UI: `MAJOR_DEFAULTS` means "this is your major's skill
 * set", `FULL_CATALOGUE` means "we don't know your major yet, so here is everything"
 * — the second one earns a prompt to pick a major, the first one does not.
 */
export type CareerSkillSetSource = "MAJOR_DEFAULTS" | "FULL_CATALOGUE"

/**
 * `GET /career/me/skill-exp` (`SkillExpDtos.MySkillExpView`) — the learner's skill set
 * plus their REAL EXP in each bucket.
 *
 * The buckets are the DEFAULT SKILL SET OF THE LEARNER'S MAJOR (change
 * `default-skills-by-major`), which is what stops a brand-new learner from getting an
 * empty panel: every category of their major comes back at `totalExp: 0`. Zeros are
 * DERIVED server-side — no placeholder progress row is ever written — so "not studied
 * yet" stays distinguishable from "studied but below the first milestone".
 *
 * `majorLabel` is `null` both when no major is chosen and when the major catalogue
 * (a separate service) could not be reached; the chart must still draw its bars.
 */
export interface CareerMySkillExp {
    majorCode: string | null
    majorLabel: string | null
    source: CareerSkillSetSource
    items: Array<CareerUserSkillExp>
}

// ---- CV Builder (Harvard) ----
//
// Mirrors the jsonb `career.cv_profiles.sections` shape validated in the backend
// `CvProfileService` (change ai-cv-review-and-builder). Every field is optional so
// a half-built CV round-trips: the BE only checks that each PRESENT top-level
// section matches the declared JSON type (header=object, summary=string, the rest
// arrays) and rejects unknown keys — it does not require any field to be filled.

/** A labelled external link in the CV header (portfolio, GitHub, LinkedIn…). */
export interface CvHeaderLink {
    label?: string
    url?: string
}

/** CV header block (`sections.header`). */
export interface CvHeader {
    fullName?: string
    email?: string
    phone?: string
    location?: string
    links?: CvHeaderLink[]
}

/** One education entry (`sections.education[]`). */
export interface CvEducationItem {
    school?: string
    degree?: string
    major?: string
    start?: string
    end?: string
    gpa?: string
    highlights?: string[]
}

/** One work-experience entry (`sections.experience[]`). */
export interface CvExperienceItem {
    company?: string
    title?: string
    start?: string
    end?: string
    bullets?: string[]
}

/** One project entry (`sections.projects[]`). */
export interface CvProjectItem {
    name?: string
    role?: string
    tech?: string[]
    bullets?: string[]
    link?: string
}

/** One grouped skill list (`sections.skills[]`). */
export interface CvSkillGroup {
    group?: string
    items?: string[]
}

/** One award entry (`sections.awards[]`). */
export interface CvAwardItem {
    name?: string
    by?: string
    year?: string
}

/** The full Harvard-shape `sections` object stored per CV. */
export interface CvSections {
    header?: CvHeader
    summary?: string
    education?: CvEducationItem[]
    experience?: CvExperienceItem[]
    projects?: CvProjectItem[]
    skills?: CvSkillGroup[]
    awards?: CvAwardItem[]
}

/** CV lifecycle status. */
export type CvStatus = "DRAFT" | "FINAL"

/** Response of `GET /career/cv/me` and `GET /career/cv/{id}` (`CvProfileView`). */
export interface CvProfileView {
    id: string
    title: string
    sections: CvSections
    status: CvStatus
    createdAt: string
    updatedAt: string
}

/** Body of `PUT /career/cv/me` (`UpsertCvBody`). */
export interface UpsertCvRequest {
    title?: string
    sections: CvSections
    status?: CvStatus
}

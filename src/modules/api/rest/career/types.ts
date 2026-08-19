/**
 * Request/response DTOs for the career REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.career.web.CareerSkillController`, the
 * Elo endpoints, and `CvProfileController`. StarCI identifiers are kept exactly as
 * named in the backend contract.
 *
 * SCOPE (2026-08-19): the roadmap / opportunity / mentorship / recommendation DTOs
 * lived here for the Career Center and the subject Career Bridge tab. Both surfaces
 * were removed from the product, so those DTOs went with them — what is left is what
 * the skill graph, the profile Elo chart and the CV builder still read.
 */

// ---- Skill ----

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

// ---- Skill categories & Elo (change `course-skill-exp`, renamed in `skill-elo-rename`) ----
//
// A SECOND, coarser taxonomy that sits beside the per-skill graph above: ten managed
// CATEGORIES (`career.skill_categories`) plus a learner's uncapped running Elo total per
// category (`career.user_category_elo`), credited as they cross 30/50/80/100% of a course.
// Kept separate on purpose — `CareerSkill` / `CareerSkillProgress` and the skill graph are
// untouched by this taxonomy.
//
// NAME: this was called "skill EXP" until `skill-elo-rename`. It was renamed because
// gamification XP — level, league, leaderboards — is a DIFFERENT number, and two labels
// both reading "EXP" made users treat them as one. Elo here ONLY ACCUMULATES; there is
// no opponent and no deduction, so do not add one because the chess meaning suggests it.

/**
 * One bucket of the managed skill-category catalogue (`GET /career/skill-categories`).
 * Mirrors `EloDtos.CategoryView` — the row id stays server-side; the slug is the
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
 * One category total from `GET /career/me/elo` (`EloDtos.CategoryEloView`).
 * Categories the learner has not earned in yet come back with `totalElo: 0` — so a
 * chart over this payload always has a full set of bars.
 */
export interface CareerUserElo {
    slug: string
    label: string
    sortOrder: number
    /** Accumulated Elo for the category. Uncapped: more courses keep adding. */
    totalElo: number
    /**
     * PRE-RENAME spelling, still served by the deprecated `/career/me/skill-exp` alias
     * this client falls back to while the renamed backend is not deployed yet. Optional
     * so today's payload type-checks; delete together with the fallback.
     */
    totalExp?: number
}

/**
 * Where the returned set of categories came from (`EloDtos.SkillSetSource`).
 *
 * Keep the two apart in the UI: `MAJOR_DEFAULTS` means "this is your major's skill
 * set", `FULL_CATALOGUE` means "we don't know your major yet, so here is everything"
 * — the second one earns a prompt to pick a major, the first one does not.
 */
export type CareerEloSetSource = "MAJOR_DEFAULTS" | "FULL_CATALOGUE"

/**
 * `GET /career/me/elo` (`EloDtos.MyEloView`) — the learner's skill set plus their REAL
 * Elo in each bucket.
 *
 * The buckets are the DEFAULT SKILL SET OF THE LEARNER'S MAJOR (change
 * `default-skills-by-major`), which is what stops a brand-new learner from getting an
 * empty panel: every category of their major comes back at `totalElo: 0`. Zeros are
 * DERIVED server-side — no placeholder progress row is ever written — so "not studied
 * yet" stays distinguishable from "studied but below the first milestone".
 *
 * `majorLabel` is `null` both when no major is chosen and when the major catalogue
 * (a separate service) could not be reached; the chart must still draw its bars.
 */
export interface CareerMyElo {
    majorCode: string | null
    majorLabel: string | null
    source: CareerEloSetSource
    items: Array<CareerUserElo>
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

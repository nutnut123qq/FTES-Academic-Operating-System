import { restRequest } from "@/modules/api/rest/client"
import type {
    ApplyCareerOpportunityRequest,
    CareerMentorship,
    CareerMentorshipActionRequest,
    CareerMyRoadmap,
    CareerOpportunity,
    CareerOpportunityApplication,
    CareerRecommendation,
    CareerRoadmap,
    CareerRoadmapDetail,
    CareerRoadmapEnrollment,
    CareerSelfAssessmentRequest,
    CareerSkill,
    CareerSkillAssessment,
    CareerSkillCategory,
    CareerSkillGraph,
    CareerSkillProgress,
    CareerUserSkillExp,
    CreateCareerOpportunityRequest,
    CreateCareerRoadmapRequest,
    CareerMentorAssessmentRequest,
    CreateCareerSkillRequest,
    CvProfileView,
    PatchCareerApplicationStatusRequest,
    PatchCareerOpportunityRequest,
    PatchCareerRoadmapRequest,
    PatchCareerSkillRequest,
    RequestCareerMentorRequest,
    UpsertCvRequest,
} from "./types"

// ---------------- CareerController ----------------

// ---- Roadmaps ----

export const getCareerRoadmaps = async (params?: {
    track?: string
}): Promise<CareerRoadmap[]> =>
    restRequest<CareerRoadmap[]>({
        method: "GET",
        url: "/career/roadmaps",
        params: { ...params },
        // Career endpoints sit behind platform auth (401 PLATFORM_UNAUTHORIZED without a
        // bearer token) — unlike the public courses catalog. Attach the token for reads.
        authenticated: true,
    })

export const getCareerRoadmapDetail = async (
    slug: string,
): Promise<CareerRoadmapDetail> =>
    restRequest<CareerRoadmapDetail>({
        method: "GET",
        url: `/career/roadmaps/${slug}`,
        authenticated: true,
    })

export const createCareerRoadmap = async (
    request: CreateCareerRoadmapRequest,
): Promise<CareerRoadmap> =>
    restRequest<CareerRoadmap>({
        method: "POST",
        url: "/career/roadmaps",
        data: request,
    })

export const patchCareerRoadmap = async (
    slug: string,
    request: PatchCareerRoadmapRequest,
): Promise<CareerRoadmap> =>
    restRequest<CareerRoadmap>({
        method: "PATCH",
        url: `/career/roadmaps/${slug}`,
        data: request,
    })

export const enrollCareerRoadmap = async (
    slug: string,
): Promise<CareerRoadmapEnrollment> =>
    restRequest<CareerRoadmapEnrollment>({
        method: "POST",
        url: `/career/roadmaps/${slug}/enroll`,
    })

export const getMyCareerRoadmaps = async (): Promise<CareerMyRoadmap[]> =>
    restRequest<CareerMyRoadmap[]>({
        method: "GET",
        url: "/career/me/roadmaps",
        authenticated: true,
    })

// ---- Opportunities ----

export const getCareerOpportunities = async (params?: {
    type?: string
    track?: string
    status?: string
}): Promise<CareerOpportunity[]> =>
    restRequest<CareerOpportunity[]>({
        method: "GET",
        url: "/career/opportunities",
        params: { ...params },
        authenticated: true,
    })

export const createCareerOpportunity = async (
    request: CreateCareerOpportunityRequest,
): Promise<CareerOpportunity> =>
    restRequest<CareerOpportunity>({
        method: "POST",
        url: "/career/opportunities",
        data: request,
    })

export const patchCareerOpportunity = async (
    id: string,
    request: PatchCareerOpportunityRequest,
): Promise<CareerOpportunity> =>
    restRequest<CareerOpportunity>({
        method: "PATCH",
        url: `/career/opportunities/${id}`,
        data: request,
    })

export const applyCareerOpportunity = async (
    id: string,
    request: ApplyCareerOpportunityRequest,
): Promise<CareerOpportunityApplication> =>
    restRequest<CareerOpportunityApplication>({
        method: "POST",
        url: `/career/opportunities/${id}/apply`,
        data: request,
    })

export const getMyCareerApplications = async (): Promise<
    CareerOpportunityApplication[]
> =>
    restRequest<CareerOpportunityApplication[]>({
        method: "GET",
        url: "/career/me/applications",
        authenticated: true,
    })

export const getCareerApplication = async (
    id: string,
): Promise<CareerOpportunityApplication> =>
    restRequest<CareerOpportunityApplication>({
        method: "GET",
        url: `/career/applications/${id}`,
        authenticated: true,
    })

export const patchCareerApplicationStatus = async (
    id: string,
    request: PatchCareerApplicationStatusRequest,
): Promise<CareerOpportunityApplication> =>
    restRequest<CareerOpportunityApplication>({
        method: "PATCH",
        url: `/career/applications/${id}/status`,
        data: request,
    })

export const withdrawCareerApplication = async (
    id: string,
): Promise<CareerOpportunityApplication> =>
    restRequest<CareerOpportunityApplication>({
        method: "POST",
        url: `/career/applications/${id}/withdraw`,
    })

// ---- Mentors ----

export const requestCareerMentor = async (
    mentorId: string,
    request: RequestCareerMentorRequest,
): Promise<CareerMentorship> =>
    restRequest<CareerMentorship>({
        method: "POST",
        url: `/career/mentors/${mentorId}/request`,
        data: request,
    })

export const patchCareerMentorship = async (
    id: string,
    request: CareerMentorshipActionRequest,
): Promise<CareerMentorship> =>
    restRequest<CareerMentorship>({
        method: "PATCH",
        url: `/career/mentorships/${id}`,
        data: request,
    })

// ---- Recommendations ----

export const getMyCareerRecommendations = async (params?: {
    kind?: string
}): Promise<CareerRecommendation[]> =>
    restRequest<CareerRecommendation[]>({
        method: "GET",
        url: "/career/me/recommendations",
        params: { ...params },
        authenticated: true,
    })

// ---------------- CareerSkillController ----------------

export const getCareerSkills = async (params?: {
    category?: string
    q?: string
}): Promise<CareerSkillGraph> =>
    restRequest<CareerSkillGraph>({
        method: "GET",
        url: "/career/skills",
        params: { ...params },
        authenticated: true,
    })

export const createCareerSkill = async (
    request: CreateCareerSkillRequest,
): Promise<CareerSkill> =>
    restRequest<CareerSkill>({
        method: "POST",
        url: "/career/skills",
        data: request,
    })

export const patchCareerSkill = async (
    slug: string,
    request: PatchCareerSkillRequest,
): Promise<CareerSkill> =>
    restRequest<CareerSkill>({
        method: "PATCH",
        url: `/career/skills/${slug}`,
        data: request,
    })

export const getMyCareerSkills = async (): Promise<CareerSkillProgress[]> =>
    restRequest<CareerSkillProgress[]>({
        method: "GET",
        url: "/career/me/skills",
        authenticated: true,
    })

/**
 * Reads the managed skill-category catalogue (change `course-skill-exp`).
 *
 * @returns every category in catalogue order — the buckets of the profile EXP chart.
 */
export const getCareerSkillCategories = async (): Promise<Array<CareerSkillCategory>> =>
    restRequest<Array<CareerSkillCategory>>({
        method: "GET",
        url: "/career/skill-categories",
        authenticated: true,
    })

/**
 * Reads the CURRENT learner's accumulated EXP per skill category.
 *
 * @returns every category with its running total; categories not earned in yet come
 *          back at `0`, so the caller never has to fill gaps itself.
 */
export const getMyCareerSkillExp = async (): Promise<Array<CareerUserSkillExp>> =>
    restRequest<Array<CareerUserSkillExp>>({
        method: "GET",
        url: "/career/me/skill-exp",
        authenticated: true,
    })

export const submitCareerSelfAssessment = async (
    slug: string,
    request: CareerSelfAssessmentRequest,
): Promise<CareerSkillAssessment> =>
    restRequest<CareerSkillAssessment>({
        method: "POST",
        url: `/career/me/skills/${slug}/assessments`,
        data: request,
    })

export const submitCareerMentorAssessment = async (
    slug: string,
    userId: string,
    request: CareerMentorAssessmentRequest,
): Promise<CareerSkillAssessment> =>
    restRequest<CareerSkillAssessment>({
        method: "POST",
        url: `/career/skills/${slug}/assessments/${userId}`,
        data: request,
    })

// ---- Skill ↔ subject map (`career.skill_subject_map`) ----

/**
 * One row of `GET /api/v1/career/skills/{slug}/subjects` — the subjects ONE skill is
 * mapped to.
 *
 * ⚠️ ID-ONLY: the row carries the subject UUID and the weight and NOTHING else — no
 * code, no name. Naming it needs a join against the subject catalogue, and an id the
 * catalogue does not resolve is a STALE mapping (the V121 dev seed left two behind),
 * which has to read as such instead of as a blank label.
 *
 * WIRE SHAPE: snake_case (`subject_id`), like the roadmap step rows; the camelCase
 * spelling is kept as an optional alias so a future DTO rename still type-checks.
 */
export interface CareerSkillSubjectLink {
    subject_id: string
    /** camelCase alias of {@link subject_id}; absent on today's wire. */
    subjectId?: string
    /** `career.skill_subject_map.weight` — `numeric(3,2)`, CHECK 0..1 (V120). */
    weight: number
}

/** `GET /career/skills/{slug}/subjects` — the skill's mapped subjects (`career.manage`). */
export const getCareerSkillSubjects = async (
    slug: string,
): Promise<CareerSkillSubjectLink[]> =>
    restRequest<CareerSkillSubjectLink[]>({
        method: "GET",
        url: `/career/skills/${slug}/subjects`,
        authenticated: true,
    })

/**
 * `POST /career/skills/{slug}/subjects/{subjectId}` — maps the skill onto a subject
 * (`career.manage`). Idempotent: re-posting an existing pair updates its weight.
 *
 * @param subjectId - the subject **UUID** (the route segment is the CODE — not it).
 * @param weight - `career.skill_subject_map.weight` (0..1); omitted → the BE default.
 */
export const mapCareerSkillToSubject = async (
    slug: string,
    subjectId: string,
    weight?: number,
): Promise<void> =>
    restRequest<void>({
        method: "POST",
        url: `/career/skills/${slug}/subjects/${subjectId}`,
        ...(weight === undefined ? {} : { data: { weight } }),
    })

/**
 * `DELETE /career/skills/{slug}/subjects/{subjectId}` — unmaps (`career.manage`),
 * idempotent. A subject the backend cannot resolve answers `404
 * CAREER_SUBJECT_NOT_FOUND`.
 */
export const unmapCareerSkillFromSubject = async (
    slug: string,
    subjectId: string,
): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/career/skills/${slug}/subjects/${subjectId}`,
    })

// ---------------- CvProfileController (Harvard CV builder) ----------------

/**
 * The caller's CV, or `null` when they have never built one.
 *
 * `GET /api/v1/career/cv/me` — authenticated. The backend answers `data: null`
 * (envelope code 200) for a first-time user, which {@link restRequest} unwraps to
 * `null`, so the builder shows an empty form rather than erroring.
 */
export const getMyCv = async (): Promise<CvProfileView | null> =>
    restRequest<CvProfileView | null>({
        method: "GET",
        url: "/career/cv/me",
        authenticated: true,
    })

/**
 * Upserts the caller's CV (create on first save, update thereafter — one CV/user).
 *
 * `PUT /api/v1/career/cv/me`. The backend validates `sections` against the Harvard
 * shape and a 64KB cap, rejecting violations with 400 `CV_PROFILE_INVALID`.
 */
export const putMyCv = async (request: UpsertCvRequest): Promise<CvProfileView> =>
    restRequest<CvProfileView>({
        method: "PUT",
        url: "/career/cv/me",
        data: request,
    })

/**
 * A CV by id, owner-only.
 *
 * `GET /api/v1/career/cv/{id}` — 404 `CV_PROFILE_NOT_FOUND` both when the id does
 * not exist and when it belongs to another user (existence is not leaked).
 */
export const getCv = async (id: string): Promise<CvProfileView> =>
    restRequest<CvProfileView>({
        method: "GET",
        url: `/career/cv/${id}`,
        authenticated: true,
    })

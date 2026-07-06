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

export interface CareerRoadmapStep {
    id: string
    stepOrder: number
    title: string
    description?: string
    /** Backend JSON column; shape depends on roadmap definition. */
    skillIds: unknown
    /** Backend JSON column; shape depends on roadmap definition. */
    targetLevels: unknown
    /** Backend JSON column; shape depends on roadmap definition. */
    subjectIds: unknown
    /** Backend JSON column; shape depends on roadmap definition. */
    starciCourseRefs: unknown
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

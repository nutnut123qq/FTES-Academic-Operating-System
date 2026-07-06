/**
 * Request / response shapes for the subject REST controller cluster.
 *
 * Inferred from backend `vn.ftes.aos.subject.web.dto.SubjectDtos`,
 * `vn.ftes.aos.subject.web.dto.WorkspaceDtos`, and the four controllers:
 * SubjectCatalog, Workspace, Membership, Statistics.
 */

// ---------------------------------------------------------------- catalog

/** Body sent to `POST /api/v1/subjects`. */
export interface CreateSubjectRequest {
    code: string
    name: string
    nameVi?: string | null
    description?: string | null
    credits: number
    recommendedSemester?: number | null
    difficulty: string
    learningOutcomes?: Array<string> | null
    roadmap?: Array<string> | null
    thumbnailUrl?: string | null
}

/** Body sent to `PATCH /api/v1/subjects/{code}`. */
export interface UpdateSubjectRequest {
    name?: string | null
    nameVi?: string | null
    description?: string | null
    credits?: number | null
    recommendedSemester?: number | null
    difficulty?: string | null
    learningOutcomes?: Array<string> | null
    roadmap?: Array<string> | null
    thumbnailUrl?: string | null
}

/** Single prerequisite item in a replace request. */
export interface PrerequisiteItem {
    subjectId: string
    kind: string
}

/** Body sent to `PUT /api/v1/subjects/{code}/prerequisites`. */
export interface ReplacePrerequisitesRequest {
    prerequisites: Array<PrerequisiteItem>
}

/** Prerequisite returned by the replace endpoint. */
export interface PrerequisiteView {
    subjectId: string
    code: string
    name: string
    kind: string
}

/** Single related-subject item in a replace request. */
export interface RelatedItem {
    relatedId: string
    relation: string
}

/** Body sent to `PUT /api/v1/subjects/{code}/related`. */
export interface ReplaceRelatedRequest {
    related: Array<RelatedItem>
}

/** Related subject returned by the replace endpoint. */
export interface RelatedView {
    relatedId: string
    code: string
    name: string
    relation: string
}

/** Lecturer attached to a subject. */
export interface LecturerView {
    userId: string
    joinedAt: string
}

/** Full subject detail. */
export interface SubjectDetail {
    id: string
    code: string
    name: string
    nameVi: string
    description: string
    credits: number
    recommendedSemester: number | null
    difficulty: string
    learningOutcomes: Array<string>
    roadmap: Array<string>
    thumbnailUrl: string
    status: string
    prerequisites: Array<PrerequisiteView>
    related: Array<RelatedView>
    lecturers: Array<LecturerView>
    createdAt: string
    updatedAt: string
}

/** Subject summary row in catalog list. */
export interface SubjectSummary {
    id: string
    code: string
    name: string
    nameVi: string
    credits: number
    recommendedSemester: number | null
    difficulty: string
    thumbnailUrl: string
    status: string
}

/** Generic paginated response returned by backend list endpoints. */
export interface PageResponse<T> {
    items: Array<T>
    page: number
    size: number
    totalElements: number
    totalPages: number
}

// ---------------------------------------------------------------- membership

/** Body sent to `PUT /api/v1/subjects/{code}/members/{userId}/role`. */
export interface ChangeRoleRequest {
    role: string
}

/** Member row in paginated member list. */
export interface MemberView {
    userId: string
    role: string
    joinedAt: string
}

/** My membership row. */
export interface MyMembershipView {
    subjectId: string
    code: string
    name: string
    role: string
    joinedAt: string
}

/** Response from `POST /api/v1/subjects/{code}/join`. */
export interface JoinResponse {
    membershipId: string
    role: string
}

/** Caller membership embedded in workspace. */
export interface CallerMembership {
    role: string
    joinedAt: string
}

// ---------------------------------------------------------------- links

/** Body sent to `POST /api/v1/subjects/{code}/links`. */
export interface CreateLinkRequest {
    tab: string
    targetType: string
    targetId: string
    titleOverride?: string | null
    sortOrder?: number | null
    pinned?: boolean | null
}

/** Body sent to `PATCH /api/v1/subjects/{code}/links/{id}`. */
export interface UpdateLinkRequest {
    titleOverride?: string | null
    sortOrder?: number | null
    pinned?: boolean | null
}

/** Curated link returned by workspace endpoints. */
export interface LinkView {
    id: string
    tab: string
    targetType: string
    targetId: string
    title: string
    sortOrder: number
    pinned: boolean
}

// ---------------------------------------------------------------- workspace

/** Generic tab envelope used by the workspace aggregate. */
export interface TabEnvelope<T> {
    available: boolean
    data: T | null
}

/** Link item inside workspace tabs. */
export interface LinkItem {
    id: string
    targetType: string
    targetId: string
    title: string
    pinned: boolean
    sortOrder: number
}

/** Learning tab payload. */
export interface LearningTab {
    links: Array<LinkItem>
}

/** Resources tab payload. */
export interface ResourcesTab {
    categoryCounts: Record<string, number>
    links: Array<LinkItem>
}

/** Community tab payload. */
export interface CommunityTab {
    feedRef: string
    endpoint: string
}

/** Practice tab payload. */
export interface PracticeTab {
    links: Array<LinkItem>
    leaderboardRef: string
}

/** AI tab payload. */
export interface AiTab {
    scopeRef: string
    links: Array<LinkItem>
}

/** Members tab payload. */
export interface MembersTab {
    countsByRole: Record<string, number>
    totalActive: number
}

/** Statistics tab payload (reference only). */
export interface StatisticsRef {
    statsRef: string
}

/** Career bridge tab payload. */
export interface CareerBridgeTab {
    relatedSkills: Array<string>
    relatedCareers: Array<string>
    suggestedRoadmap: string
    nextSubjects: Array<RelatedView>
    links: Array<LinkItem>
}

/** Full workspace aggregate. */
export interface WorkspaceView {
    overview: SubjectDetail
    learning: TabEnvelope<LearningTab>
    resources: TabEnvelope<ResourcesTab>
    community: TabEnvelope<CommunityTab>
    practice: TabEnvelope<PracticeTab>
    ai: TabEnvelope<AiTab>
    members: TabEnvelope<MembersTab>
    statistics: TabEnvelope<StatisticsRef>
    careerBridge: TabEnvelope<CareerBridgeTab>
    callerMembership: CallerMembership
}

// ---------------------------------------------------------------- statistics

/** Single leaderboard entry inside subject statistics. */
export interface SubjectLeaderboardEntry {
    userId: string
    score: number
    rank: number
}

/** Top student row. */
export interface TopStudentView {
    userId: string
    xp: number
    rank: number
}

/** Top contributor row. */
export interface TopContributorView {
    userId: string
    contributions: number
}

/** Popular resource row. */
export interface PopularResourceView {
    resourceId: string
    views: number
    downloads: number
}

/** Subject statistics payload. */
export interface StatisticsView {
    topStudents: Array<TopStudentView>
    topContributors: Array<TopContributorView>
    popularResources: Array<PopularResourceView>
    completionRate: string
    memberCount: number
    postCount: number
    resourceCount: number
    leaderboard: Array<SubjectLeaderboardEntry>
    computedAt: string
}

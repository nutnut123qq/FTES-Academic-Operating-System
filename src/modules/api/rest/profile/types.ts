/**
 * Request/response DTOs for the profile REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.profile.web.dto.ProfileViews` and the
 * request DTOs in the same package.
 */

/** Cursor-paginated page. */
export interface CursorPage<T> {
    items: Array<T>
    nextCursor: string | null
}

/** Academic section of a profile. */
export interface AcademicSection {
    university: string | null
    campus: string | null
    /** Chuyên ngành CHỮ TỰ DO người dùng tự gõ (cột cũ `profiles.major`). */
    major: string | null
    /**
     * NGÀNH chọn từ danh mục (BE V335, mã trong `subject.majors` — vd `"SE"`), `null` = CHƯA chọn.
     * Khác {@link major} ngay trên: cái đó là chữ tự do, cái này tra được và dùng để lọc workplace.
     * Optional vì bản BE chưa deploy V335 không trả ba trường này.
     */
    majorCode?: string | null
    /** Tên ngành (tiếng Anh) đã dịch sẵn BE-side để FE khỏi gọi thêm `GET /majors` chỉ để dịch mã. */
    majorName?: string | null
    /** Tên ngành tiếng Việt — dùng cho locale `vi`. */
    majorNameVi?: string | null
    currentSemester: number | null
    gpa: number | null
    studentCode: string | null
    enrollmentYear: number | null
}

/** One social link on a profile. */
export interface SocialLinkView {
    id: string
    platform: string
    url: string
    sortOrder: number
}

/** Input for one social link (replace-all). */
export interface ProfileSocialLinkInput {
    platform: string
    url: string
    sortOrder?: number | null
}

/** One portfolio project. */
export interface ProjectView {
    id: string
    title: string
    description: string | null
    repoUrl: string | null
    demoUrl: string | null
    thumbnailUrl: string | null
    techStack: Array<string>
    subjectCode: string | null
    highlighted: boolean
    sortOrder: number
}

/** One portfolio asset. */
export interface AssetView {
    id: string
    type: string | null
    title: string | null
    fileUrl: string
    mimeType: string | null
}

/** One achievement on a profile. */
export interface AchievementView {
    id: string
    source: string
    title: string
    description: string | null
    iconUrl: string | null
    achievedAt: string | null
}

/** A certificate shown on a public profile. */
export interface ProfileCertificateView {
    code: string
    name: string
    issueDate: string
}

/** Gamification progress shown on a public profile. */
export interface ProfileProgressView {
    xp: number
    level: number
    reputation: number
    coinBalance: number
}

/** Follower/following counters. */
export interface FollowCounters {
    followers: number
    following: number
}

/** One entry in a followers/following list. */
export interface FollowEntry {
    userId: string
    username: string
    displayName: string | null
    avatarUrl: string | null
}

/** Full self profile (GET /api/v1/profiles/me). */
export interface SelfProfile {
    userId: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    coverUrl: string | null
    bio: string | null
    jobTitle: string | null
    contactEmail: string | null
    phone: string | null
    address: string | null
    dateOfBirth: string | null
    gender: string | null
    academic: AcademicSection | null
    /**
     * Appearance synced with the ACCOUNT (not just this browser): an accent preset
     * id (`"indigo"`) or a free-form hex (`"#3f51b5"`). `null` = never chosen, in
     * which case this device's localStorage value stands.
     */
    accentColor: string | null
    /** Ambient background effect name (`"none"` = off); `null` = never chosen. */
    backgroundEffect: string | null
    socialLinks: Array<SocialLinkView>
    projects: Array<ProjectView>
    assets: Array<AssetView>
    achievements: Array<AchievementView>
    privacy: ProfilePrivacySettings
    createdAt: string
    updatedAt: string
}

/** Public profile view (GET /api/v1/profiles/{username}). */
export interface PublicProfile {
    userId: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    coverUrl: string | null
    bio: string | null
    jobTitle: string | null
    contactEmail: string | null
    phone: string | null
    academic: AcademicSection | null
    socialLinks: Array<SocialLinkView>
    projects: Array<ProjectView>
    assets: Array<AssetView>
    achievements: Array<AchievementView>
    certificates: Array<ProfileCertificateView>
    progress: ProfileProgressView | null
    counters: FollowCounters
    /**
     * Whether the CALLER follows this profile. Always `false` for anonymous visitors and
     * when looking at your own profile (`PublicProfileAssembler.resolveFollowedByMe`), and
     * it degrades to `false` rather than failing when the community module is unreachable.
     */
    isFollowedByMe: boolean
}

/** Body of `PATCH /api/v1/profiles/me` (null fields are ignored). */
export interface ProfileUpdateRequest {
    displayName?: string | null
    bio?: string | null
    jobTitle?: string | null
    contactEmail?: string | null
    phone?: string | null
    address?: string | null
    dateOfBirth?: string | null
    gender?: string | null
    university?: string | null
    campus?: string | null
    major?: string | null
    /**
     * Mã ngành chọn từ danh mục (BE V335). `undefined`/`null` = KHÔNG ĐỔI; chuỗi RỖNG = bỏ chọn
     * ngành. Mã không có trong danh mục bị BE từ chối 400 `PROFILE_INVALID_MAJOR`.
     */
    majorCode?: string | null
    currentSemester?: number | null
    gpa?: number | null
    studentCode?: string | null
    enrollmentYear?: number | null
    /** Accent preset id or `#rrggbb`; the BE rejects anything else. */
    accentColor?: string | null
    /** One of the known background effect names; the BE rejects anything else. */
    backgroundEffect?: string | null
}

/** Body of `PUT /api/v1/profiles/me/social-links`. */
export interface ProfileReplaceSocialLinksRequest {
    links: Array<ProfileSocialLinkInput>
}

/** Privacy settings read/write. */
export interface ProfilePrivacySettings {
    profileVisibility: string | null
    showEmail: boolean | null
    showPhone: boolean | null
    showGpa: boolean | null
    showAcademic: boolean | null
    showProgress: boolean | null
    showTimeline: boolean | null
    showFollowers: boolean | null
}

/** Body of `PATCH /api/v1/profiles/me/portfolio/projects/{id}`. */
export interface ProfileProjectRequest {
    title?: string | null
    description?: string | null
    repoUrl?: string | null
    demoUrl?: string | null
    thumbnailUrl?: string | null
    techStack?: Array<string>
    subjectCode?: string | null
    highlighted?: boolean | null
    sortOrder?: number | null
}

/** Body of `POST /api/v1/profiles/me/portfolio/projects`. */
export interface ProfileProjectCreateRequest {
    title: string
    description?: string | null
    repoUrl?: string | null
    demoUrl?: string | null
    thumbnailUrl?: string | null
    techStack?: Array<string>
    subjectCode?: string | null
    highlighted?: boolean | null
    sortOrder?: number | null
}

/** Body of `POST /api/v1/profiles/me/achievements`. */
export interface ProfileAchievementRequest {
    title: string
    description?: string | null
    iconUrl?: string | null
}

/** One timeline entry. */
export interface TimelineEntry {
    eventId: string
    type: string
    summary: string
    occurredAt: string
}

/**
 * Một khung viền avatar trong danh mục (`profile.avatar_frames`, V341).
 *
 * `cssGradient` là chuỗi CSS backend cấp để vẽ vòng viền; `assetUrl` là ảnh khung cho các
 * khung có hoạ tiết. Khung có thể có một trong hai, hoặc cả hai — tầng vẽ ưu tiên ảnh.
 */
export interface AvatarFrameView {
    code: string
    name: string
    nameVi: string | null
    description: string | null
    cssGradient: string | null
    assetUrl: string | null
    sortOrder: number
}

/** `GET /api/v1/profiles/me/appearance/catalog`. */
export interface AppearanceCatalogView {
    frames: Array<AvatarFrameView>
    avatars?: Array<unknown>
}

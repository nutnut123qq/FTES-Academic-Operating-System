// Admin & Moderator console — data model, RBAC section map, and deterministic seed.
// ponytail: FE-only mock domain. When the BE admin-service lands these types should
// move to `modules/types` mirroring the real entities; the seed dies with the mock.

/** The four RBAC roles (mirrors rbac-roles `Role["key"]`). */
export type AdminRole = "member" | "moderator" | "admin" | "superAdmin"

/** One navigable section of the admin console (route segment under `/admin`). */
export type AdminSection =
    | "dashboard"
    | "users"
    | "moderation"
    | "courses"
    | "resources"
    | "communities"
    | "events"
    | "roles"
    | "config"
    | "tools"

/**
 * Single source of truth: which console sections each role may enter.
 * The section nav filters by this AND the section guard enforces it on deep-link.
 * FE gate is a UX guard only — the real BE must enforce authorization itself.
 */
export const SECTION_ACCESS: Record<AdminRole, Array<AdminSection>> = {
    member: [],
    moderator: ["dashboard", "moderation"],
    admin: [
        "dashboard",
        "users",
        "moderation",
        "courses",
        "resources",
        "communities",
        "events",
        "roles",
        "tools",
    ],
    superAdmin: [
        "dashboard",
        "users",
        "moderation",
        "courses",
        "resources",
        "communities",
        "events",
        "roles",
        "tools",
        "config",
    ],
}

/** Account standing of a managed user. */
export type UserStatus = "active" | "suspended" | "banned"

/** A managed user row in the admin console. */
export interface AdminUser {
    id: string
    name: string
    email: string
    role: AdminRole
    status: UserStatus
    /** ISO date the account was created. */
    joinedAt: string
    /** ISO date of the last activity. */
    lastActiveAt: string
}

/** What kind of content a report points at. */
export type ReportTarget = "post" | "comment" | "resource"

/** Lifecycle of a report in the moderation queue. */
export type ReportStatus = "pending" | "approved" | "rejected" | "removed"

/** One report in the moderation queue. */
export interface Report {
    id: string
    target: ReportTarget
    /** Id of the reported post/comment/resource. */
    targetId: string
    reason: string
    reportedBy: string
    /** ISO timestamp the report was filed. */
    createdAt: string
    status: ReportStatus
    /** Short excerpt of the reported content. */
    excerpt: string
}

/** One entry in the moderation audit log. */
export interface ModerationLogEntry {
    id: string
    reportId: string
    action: "approve" | "reject" | "remove"
    /** Display name of the moderator who acted. */
    by: string
    /** ISO timestamp of the action. */
    at: string
    /** Target type of the moderated report (denormalized for display). */
    target: ReportTarget
}

/** Publication status of a CMS item. */
export type ContentStatus = "draft" | "published" | "archived"

/** The four CMS domains managed by the console. */
export type CmsDomain = "courses" | "resources" | "communities" | "events"

/** One row in a domain CMS list. */
export interface CmsItem {
    id: string
    title: string
    domain: CmsDomain
    status: ContentStatus
    featured: boolean
    pinned: boolean
    /** Route of the existing user-facing detail page for this item. */
    detailHref: string
}

/** Dashboard overview metrics. */
export interface AdminStats {
    totalUsers: number
    totalCourses: number
    totalResources: number
    totalCommunities: number
    totalEvents: number
    pendingReports: number
}

// ---------------------------------------------------------------------------
// Deterministic seed (fixed ids + ISO dates so every load renders identically)
// ---------------------------------------------------------------------------

/** Seed users for the mock admin service. */
export const ADMIN_USERS_SEED: Array<AdminUser> = [
    { id: "u-01", name: "Nguyễn Văn An", email: "an.nguyen@ftes.edu.vn", role: "superAdmin", status: "active", joinedAt: "2024-01-12", lastActiveAt: "2026-07-01" },
    { id: "u-02", name: "Trần Thị Bình", email: "binh.tran@ftes.edu.vn", role: "admin", status: "active", joinedAt: "2024-03-02", lastActiveAt: "2026-06-30" },
    { id: "u-03", name: "Lê Hoàng Cường", email: "cuong.le@ftes.edu.vn", role: "moderator", status: "active", joinedAt: "2024-05-19", lastActiveAt: "2026-06-28" },
    { id: "u-04", name: "Phạm Minh Dương", email: "duong.pham@gmail.com", role: "member", status: "active", joinedAt: "2025-02-07", lastActiveAt: "2026-07-02" },
    { id: "u-05", name: "Hoàng Thu Em", email: "em.hoang@gmail.com", role: "member", status: "suspended", joinedAt: "2025-04-23", lastActiveAt: "2026-05-11" },
    { id: "u-06", name: "Vũ Quốc Phong", email: "phong.vu@gmail.com", role: "member", status: "banned", joinedAt: "2025-06-30", lastActiveAt: "2026-03-02" },
    { id: "u-07", name: "Đặng Ngọc Giang", email: "giang.dang@gmail.com", role: "moderator", status: "active", joinedAt: "2025-08-14", lastActiveAt: "2026-06-25" },
    { id: "u-08", name: "Bùi Thanh Hà", email: "ha.bui@gmail.com", role: "member", status: "active", joinedAt: "2025-11-05", lastActiveAt: "2026-06-29" },
    { id: "u-09", name: "Đỗ Khánh Huy", email: "huy.do@gmail.com", role: "member", status: "active", joinedAt: "2026-01-21", lastActiveAt: "2026-07-01" },
    { id: "u-10", name: "Ngô Yến Linh", email: "linh.ngo@gmail.com", role: "member", status: "active", joinedAt: "2026-03-15", lastActiveAt: "2026-06-27" },
]

/** Seed reports for the moderation queue. */
export const REPORTS_SEED: Array<Report> = [
    { id: "r-01", target: "post", targetId: "post-1", reason: "spam", reportedBy: "Bùi Thanh Hà", createdAt: "2026-06-29T09:15:00Z", status: "pending", excerpt: "Mua khóa học giá rẻ tại đây, inbox ngay..." },
    { id: "r-02", target: "comment", targetId: "comment-7", reason: "harassment", reportedBy: "Đỗ Khánh Huy", createdAt: "2026-06-30T14:40:00Z", status: "pending", excerpt: "Bạn học kiểu gì mà hỏi câu này..." },
    { id: "r-03", target: "resource", targetId: "res-3", reason: "copyright", reportedBy: "Ngô Yến Linh", createdAt: "2026-07-01T08:05:00Z", status: "pending", excerpt: "Trọn bộ slide môn PRF192 (bản scan)..." },
    { id: "r-04", target: "post", targetId: "post-9", reason: "offTopic", reportedBy: "Phạm Minh Dương", createdAt: "2026-07-01T19:30:00Z", status: "pending", excerpt: "Có ai bán acc game không, giá tốt..." },
    { id: "r-05", target: "comment", targetId: "comment-12", reason: "spam", reportedBy: "Hoàng Thu Em", createdAt: "2026-06-25T11:00:00Z", status: "rejected", excerpt: "Tham khảo thêm tài liệu ở link sau..." },
    { id: "r-06", target: "post", targetId: "post-4", reason: "inappropriate", reportedBy: "Bùi Thanh Hà", createdAt: "2026-06-24T16:20:00Z", status: "removed", excerpt: "Nội dung không phù hợp với cộng đồng học tập..." },
]

/** Seed moderation-log entries (past resolutions of seeded reports). */
export const MODERATION_LOG_SEED: Array<ModerationLogEntry> = [
    { id: "ml-01", reportId: "r-06", action: "remove", by: "Lê Hoàng Cường", at: "2026-06-24T17:00:00Z", target: "post" },
    { id: "ml-02", reportId: "r-05", action: "reject", by: "Đặng Ngọc Giang", at: "2026-06-25T12:30:00Z", target: "comment" },
]

/** Seed CMS items per domain, each linking to an existing user-facing detail route. */
export const CMS_SEED: Array<CmsItem> = [
    { id: "cms-c1", title: "Lập trình C (PRF192)", domain: "courses", status: "published", featured: true, pinned: true, detailHref: "/courses/prf192-course" },
    { id: "cms-c2", title: "Cấu trúc dữ liệu & Giải thuật (CSD201)", domain: "courses", status: "published", featured: false, pinned: false, detailHref: "/courses/csd201-course" },
    { id: "cms-c3", title: "Lập trình Java Web (PRJ301)", domain: "courses", status: "draft", featured: false, pinned: false, detailHref: "/courses/prj301-course" },
    { id: "cms-c4", title: "Cơ sở dữ liệu (DBI202)", domain: "courses", status: "archived", featured: false, pinned: false, detailHref: "/courses/dbi202-course" },
    { id: "cms-r1", title: "Bộ đề ôn tập PRF192", domain: "resources", status: "published", featured: true, pinned: false, detailHref: "/resources" },
    { id: "cms-r2", title: "Slide bài giảng CSD201", domain: "resources", status: "published", featured: false, pinned: true, detailHref: "/resources" },
    { id: "cms-r3", title: "Cheatsheet SQL cơ bản", domain: "resources", status: "draft", featured: false, pinned: false, detailHref: "/resources" },
    { id: "cms-m1", title: "Cộng đồng lập trình C", domain: "communities", status: "published", featured: true, pinned: true, detailHref: "/groups/group-c" },
    { id: "cms-m2", title: "Hỏi đáp giải thuật", domain: "communities", status: "published", featured: false, pinned: false, detailHref: "/groups/group-dsa" },
    { id: "cms-m3", title: "Góc chia sẻ đồ án", domain: "communities", status: "archived", featured: false, pinned: false, detailHref: "/groups/group-capstone" },
    { id: "cms-e1", title: "Hackathon FTES 2026", domain: "events", status: "published", featured: true, pinned: false, detailHref: "/events" },
    { id: "cms-e2", title: "Workshop CV & phỏng vấn", domain: "events", status: "draft", featured: false, pinned: false, detailHref: "/events" },
    { id: "cms-e3", title: "Seminar AI trong giáo dục", domain: "events", status: "published", featured: false, pinned: true, detailHref: "/events" },
]

/** Seed dashboard metrics (content counts match the CMS seed; reports match pending). */
export const ADMIN_STATS_SEED: AdminStats = {
    totalUsers: 12581,
    totalCourses: 4,
    totalResources: 3,
    totalCommunities: 3,
    totalEvents: 3,
    pendingReports: 4,
}

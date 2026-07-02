// Admin service — the single seam between the console UI and its data source.
//
// ponytail: `mockAdminService` is the only implementation for now (FE-only phase).
// BE swap: implement `httpAdminService: AdminService` against the ASSUMED admin
// endpoints (GraphQL ops `adminStats`, `adminUsers(filter)`, `adminUser(id)`,
// `changeUserRole`, `suspendUser`, `banUser`, `resetUserPassword`, `reports`,
// `moderationLog`, `moderateReport`, `adminCms(domain)`, `toggleCmsStatus`,
// `setCmsFeatured`, `setCmsPinned` — each returning the house envelope with a
// NULLABLE `data`). Those endpoints do NOT exist yet — this contract is an
// assumption, not a description of the current backend. When they land, swap the
// export below to the http implementation; every hook/component keeps its API.

import {
    ADMIN_STATS_SEED,
    ADMIN_USERS_SEED,
    CMS_SEED,
    MODERATION_LOG_SEED,
    REPORTS_SEED,
} from "@/resources/constants/admin"
import type {
    AdminRole,
    AdminStats,
    AdminUser,
    CmsDomain,
    CmsItem,
    ContentStatus,
    ModerationLogEntry,
    Report,
    UserStatus,
} from "@/resources/constants/admin"

/** Filter accepted by {@link AdminService.listUsers}. */
export interface AdminUserFilter {
    /** Free-text match against name + email (case-insensitive). */
    query?: string
    /** Restrict to one role. */
    role?: AdminRole
    /** Restrict to one status. */
    status?: UserStatus
}

/** The admin-service contract shared by the mock and the future http implementation. */
export interface AdminService {
    listStats(): Promise<AdminStats>
    listUsers(filter?: AdminUserFilter): Promise<Array<AdminUser>>
    getUser(id: string): Promise<AdminUser | null>
    changeUserRole(id: string, role: AdminRole): Promise<AdminUser>
    suspendUser(id: string): Promise<AdminUser>
    banUser(id: string): Promise<AdminUser>
    resetUserPassword(id: string): Promise<void>
    listReports(): Promise<Array<Report>>
    listModerationLog(): Promise<Array<ModerationLogEntry>>
    moderateReport(id: string, action: "approve" | "reject" | "remove", by: string): Promise<Report>
    listCms(domain: CmsDomain): Promise<Array<CmsItem>>
    toggleCmsStatus(id: string, status: ContentStatus): Promise<CmsItem>
    setCmsFeatured(id: string, featured: boolean): Promise<CmsItem>
    setCmsPinned(id: string, pinned: boolean): Promise<CmsItem>
}

/**
 * Error-simulation flag: set `adminMockFlags.failNextMutation = true` (e.g. from
 * the devtools console via `window`) to make the NEXT mutation reject, so the
 * error-toast + state-retention paths are exercisable without a backend.
 */
export const adminMockFlags = { failNextMutation: false }

/** Simulated network latency so skeletons/pending states are visible. */
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms))

/** Throws once when the error-simulation flag is armed. */
const maybeFail = () => {
    if (adminMockFlags.failNextMutation) {
        adminMockFlags.failNextMutation = false
        throw new Error("Simulated admin mutation failure")
    }
}

// Mutable in-memory state, cloned from the seed once per page load. Mutations
// write here so SWR revalidation observes the change (mock persistence = session).
const state = {
    users: ADMIN_USERS_SEED.map((user) => ({ ...user })),
    reports: REPORTS_SEED.map((report) => ({ ...report })),
    moderationLog: MODERATION_LOG_SEED.map((entry) => ({ ...entry })),
    cms: CMS_SEED.map((item) => ({ ...item })),
}

/** Looks up a user or throws (mutation target must exist). */
const requireUser = (id: string): AdminUser => {
    const user = state.users.find((candidate) => candidate.id === id)
    if (!user) throw new Error(`Unknown user: ${id}`)
    return user
}

/** Looks up a CMS item or throws. */
const requireCmsItem = (id: string): CmsItem => {
    const item = state.cms.find((candidate) => candidate.id === id)
    if (!item) throw new Error(`Unknown CMS item: ${id}`)
    return item
}

/** Mock implementation backed by the deterministic seed (see module comment for the BE seam). */
export const mockAdminService: AdminService = {
    async listStats() {
        await delay()
        const pendingReports = state.reports.filter((report) => report.status === "pending").length
        return { ...ADMIN_STATS_SEED, pendingReports }
    },

    async listUsers(filter) {
        await delay()
        const query = filter?.query?.trim().toLowerCase()
        return state.users
            .filter((user) => !query
                || user.name.toLowerCase().includes(query)
                || user.email.toLowerCase().includes(query))
            .filter((user) => !filter?.role || user.role === filter.role)
            .filter((user) => !filter?.status || user.status === filter.status)
            .map((user) => ({ ...user }))
    },

    async getUser(id) {
        await delay()
        const user = state.users.find((candidate) => candidate.id === id)
        return user ? { ...user } : null
    },

    async changeUserRole(id, role) {
        await delay()
        maybeFail()
        const user = requireUser(id)
        user.role = role
        return { ...user }
    },

    async suspendUser(id) {
        await delay()
        maybeFail()
        const user = requireUser(id)
        user.status = "suspended"
        return { ...user }
    },

    async banUser(id) {
        await delay()
        maybeFail()
        const user = requireUser(id)
        user.status = "banned"
        return { ...user }
    },

    async resetUserPassword(id) {
        await delay()
        maybeFail()
        requireUser(id)
        // mock: pretend a reset link was emailed — nothing to persist
    },

    async listReports() {
        await delay()
        return state.reports.map((report) => ({ ...report }))
    },

    async listModerationLog() {
        await delay()
        // newest first — an audit log reads back in time
        return [...state.moderationLog]
            .sort((a, b) => b.at.localeCompare(a.at))
            .map((entry) => ({ ...entry }))
    },

    async moderateReport(id, action, by) {
        await delay()
        maybeFail()
        const report = state.reports.find((candidate) => candidate.id === id)
        if (!report) throw new Error(`Unknown report: ${id}`)
        report.status = action === "approve" ? "approved" : action === "reject" ? "rejected" : "removed"
        state.moderationLog.push({
            id: `ml-${String(state.moderationLog.length + 1).padStart(2, "0")}`,
            reportId: report.id,
            action,
            by,
            at: new Date().toISOString(),
            target: report.target,
        })
        return { ...report }
    },

    async listCms(domain) {
        await delay()
        return state.cms
            .filter((item) => item.domain === domain)
            .map((item) => ({ ...item }))
    },

    async toggleCmsStatus(id, status) {
        await delay()
        maybeFail()
        const item = requireCmsItem(id)
        item.status = status
        return { ...item }
    },

    async setCmsFeatured(id, featured) {
        await delay()
        maybeFail()
        const item = requireCmsItem(id)
        item.featured = featured
        return { ...item }
    },

    async setCmsPinned(id, pinned) {
        await delay()
        maybeFail()
        const item = requireCmsItem(id)
        item.pinned = pinned
        return { ...item }
    },
}

/** The active admin service. ponytail: swap to `httpAdminService` when the BE lands. */
export const adminService: AdminService = mockAdminService

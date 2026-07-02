"use client"

// SWR-shaped read hooks for the admin console, backed by the mock admin service.
// ponytail: BE seam — these keep their signatures when `adminService` becomes the
// http implementation; only the service module changes (see `@/services/admin`).

import useSWR from "swr"
import { adminService } from "@/services/admin"
import type { AdminUserFilter } from "@/services/admin"
import type { CmsDomain } from "@/resources/constants/admin"

/** Loads the dashboard overview metrics. */
export const useQueryAdminStatsSwr = () =>
    useSWR(["ADMIN_STATS"], () => adminService.listStats())

/** Loads the managed-user list for the given search/role/status filter. */
export const useQueryAdminUsersSwr = (filter: AdminUserFilter) =>
    useSWR(
        ["ADMIN_USERS", filter.query ?? "", filter.role ?? "", filter.status ?? ""],
        () => adminService.listUsers(filter),
        // keep the previous page while a new filter loads — no skeleton per keystroke
        { keepPreviousData: true },
    )

/** Loads one managed user by id (key gated until the id exists). */
export const useQueryAdminUserSwr = (id: string | undefined) =>
    useSWR(id ? ["ADMIN_USER", id] : null, async () => {
        if (!id) throw new Error("missing user id")
        return adminService.getUser(id)
    })

/** Loads the moderation report queue (all statuses; callers split pending/resolved). */
export const useQueryReportsSwr = () =>
    useSWR(["ADMIN_REPORTS"], () => adminService.listReports())

/** Loads the moderation audit log, newest first. */
export const useQueryModerationLogSwr = () =>
    useSWR(["ADMIN_MODERATION_LOG"], () => adminService.listModerationLog())

/** Loads the CMS list for one domain. */
export const useQueryAdminCmsSwr = (domain: CmsDomain) =>
    useSWR(["ADMIN_CMS", domain], () => adminService.listCms(domain))

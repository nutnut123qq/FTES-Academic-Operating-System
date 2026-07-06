"use client"

import useSWR from "swr"
import { queryPlatformAuditLogs } from "@/modules/api/rest/platform"

/**
 * SWR query wrapper for {@link queryPlatformAuditLogs}.
 */
export const useGetPlatformAuditLogsSwr = (request?: {
    actorId?: string
    resourceType?: string
    resourceId?: string
    action?: string
    from?: string
    to?: string
    page?: number
}) => {
    const swr = useSWR<Record<string, unknown>[], Error>(
        ["GET_PLATFORM_AUDIT_LOGS_SWR", request],
        () => queryPlatformAuditLogs(request),
    )

    return swr
}

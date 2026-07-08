"use client"

import React from "react"
import { useRouter } from "@/i18n/navigation"
import { useAppSelector } from "@/redux/hooks"
import { useHasPermissions } from "@/hooks/useHasPermission"

/**
 * Admin-area RBAC guard (FE-04). The middleware (`proxy.ts`) only login-gates `/admin`; it does
 * NOT check role, so a logged-in non-admin could reach the admin shell and see it render with the
 * data 403ing underneath. This client guard redirects anyone WITHOUT an admin-area permission back
 * to the landing — defense-in-depth on top of the BE's own 403 (the real gate).
 *
 * "any" of these signals ⇒ admin-area access (avoids blocking a partial-admin who lacks `role.view`
 * but holds another admin permission). Empty until `me` resolves, so we wait for the viewer
 * (`state.user.user !== null`) before deciding — otherwise we'd bounce a real admin mid-load.
 */
const ADMIN_SIGNAL_PERMISSIONS = [
    "role.view",
    "grant.view",
    "user.view",
    "security.log.view",
    "analytics.dashboard.view",
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const viewerResolved = useAppSelector((state) => state.user.user !== null)
    const isAdmin = useHasPermissions(ADMIN_SIGNAL_PERMISSIONS, "any")

    React.useEffect(() => {
        if (viewerResolved && !isAdmin) {
            router.replace("/")
        }
    }, [viewerResolved, isAdmin, router])

    // Render admin content only once the viewer has resolved AND holds an admin permission.
    // Before that (loading, or a non-admin about to be redirected) render nothing.
    if (!viewerResolved || !isAdmin) return null

    return <>{children}</>
}

"use client"

import React, { useEffect, useState } from "react"
import { useSelectedLayoutSegment } from "next/navigation"
import { Button, Drawer, Skeleton, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ListIcon } from "@phosphor-icons/react"
import { useRouter } from "@/i18n/navigation"
import { CollapsibleSidebar } from "@/components/blocks/navigation/CollapsibleSidebar"
import { AdminLogin } from "@/components/layouts/admin/AdminLogin"
import { SECTION_ACCESS } from "@/resources/constants/admin"
import { useAdminSession } from "../hooks"
import { segmentToSection } from "../map"
import { AdminForbidden } from "../AdminForbidden"
import { AdminSectionNav } from "./AdminSectionNav"

/** Props for {@link AdminConsoleShell}. */
export interface AdminConsoleShellProps {
    /** The active section page. */
    children: React.ReactNode
}

/**
 * The admin console shell mounted by the `/admin/*` layout. Owns the TWO RBAC
 * gates from the design (D3):
 *
 * 1. **Entry guard** — guest → the {@link AdminLogin} surface (children are NOT
 *    mounted, so no admin data is fetched); member → redirected home.
 * 2. **Section guard** — the active segment's section must be in
 *    `SECTION_ACCESS[role]`, else {@link AdminForbidden} renders instead of the
 *    section content (deep-links land on a 403 surface, not a 404).
 *
 * Chrome: a desktop {@link CollapsibleSidebar} with the role-filtered
 * {@link AdminSectionNav}, and on mobile a top bar whose labeled menu button
 * opens the same nav in a bottom drawer (local open state, mirroring the
 * Navbar's mobile-menu drawer).
 *
 * FE gate only — the assumed BE admin-service must enforce authorization itself.
 */
export const AdminConsoleShell = ({ children }: AdminConsoleShellProps) => {
    const t = useTranslations()
    const router = useRouter()
    const segment = useSelectedLayoutSegment()
    const { role, isAuthenticated, isReady } = useAdminSession()
    const [isDrawerOpen, setDrawerOpen] = useState(false)

    const section = segmentToSection(segment)
    const isMember = isReady && isAuthenticated && role === "member"

    // member (no console access) → redirect away instead of showing console chrome
    useEffect(() => {
        if (isMember) router.replace("/")
    }, [isMember, router])

    /** Navigate + close the mobile drawer (no-op close on desktop). */
    const go = (href: string) => {
        setDrawerOpen(false)
        router.push(href)
    }

    // session not hydrated yet — neutral shell-chrome skeleton, no gated content
    if (!isReady) {
        return (
            <div className="flex w-full gap-6 p-6">
                <Skeleton className="hidden h-64 w-64 shrink-0 rounded-large md:block" />
                <Skeleton className="h-64 w-full rounded-large" />
            </div>
        )
    }

    // entry guard: guest → admin login surface, member → redirecting (render nothing)
    if (!isAuthenticated || role === null) return <AdminLogin />
    if (role === "member") return null

    const content = SECTION_ACCESS[role].includes(section)
        ? children
        : <AdminForbidden role={role} />

    return (
        <div className="flex w-full">
            {/* desktop rail — sticky under the 4rem navbar, like the subject workspace */}
            <div className="hidden shrink-0 md:sticky md:top-16 md:block md:h-[calc(100dvh-4rem)]">
                <CollapsibleSidebar
                    title={t("admin.shell.title")}
                    collapseLabel={t("admin.shell.collapse")}
                    expandLabel={t("admin.shell.expand")}
                    storageKey="admin-console-sidebar-collapsed"
                    className="h-full"
                >
                    <AdminSectionNav role={role} activeSection={section} onNavigate={go} />
                </CollapsibleSidebar>
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
                {/* mobile top bar: labeled menu toggle; content gets the full width below */}
                <div className="flex items-center gap-2 border-b border-separator p-3 md:hidden">
                    <Button
                        isIconOnly
                        variant="tertiary"
                        aria-label={t("admin.shell.openNav")}
                        onPress={() => setDrawerOpen(true)}
                    >
                        <ListIcon className="size-5" aria-hidden focusable="false" />
                    </Button>
                    <Typography type="body-sm" weight="medium">
                        {t("admin.shell.title")}
                    </Typography>
                </div>

                {content}
            </div>

            {/* mobile nav drawer — same rows as the rail; closes after a pick */}
            <Drawer>
                <Drawer.Backdrop isOpen={isDrawerOpen} onOpenChange={setDrawerOpen}>
                    <Drawer.Content placement="bottom">
                        <Drawer.Dialog className="flex max-h-[80dvh] flex-col">
                            <Drawer.CloseTrigger />
                            <Drawer.Header>
                                <Drawer.Heading>{t("admin.shell.title")}</Drawer.Heading>
                            </Drawer.Header>
                            <Drawer.Body className="flex flex-col gap-3">
                                <AdminSectionNav role={role} activeSection={section} onNavigate={go} />
                            </Drawer.Body>
                        </Drawer.Dialog>
                    </Drawer.Content>
                </Drawer.Backdrop>
            </Drawer>
        </div>
    )
}

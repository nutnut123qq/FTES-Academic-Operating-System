"use client"

import React from "react"
import { Card, Skeleton } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    CalendarIcon,
    FlagIcon,
    FolderIcon,
    GraduationCapIcon,
    UsersIcon,
    UsersThreeIcon,
} from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { MetricCard } from "@/components/blocks/stats/MetricCard"
import { SECTION_ACCESS } from "@/resources/constants/admin"
import type { AdminSection, AdminStats } from "@/resources/constants/admin"
import { useAdminSession, useQueryAdminStatsSwr } from "../hooks"
import { ADMIN_SECTION_META } from "../map"
import { AdminPageHeader } from "../AdminPageHeader"

/** One dashboard stat card: metric key, icon, value picker, and target section. */
const CARDS: Array<{
    key: "users" | "courses" | "resources" | "communities" | "events" | "pendingReports"
    section: AdminSection
    icon: React.ReactNode
    value: (stats: AdminStats) => number
}> = [
    { key: "users", section: "users", icon: <UsersIcon className="size-6 text-accent" aria-hidden focusable="false" />, value: (stats) => stats.totalUsers },
    { key: "courses", section: "courses", icon: <GraduationCapIcon className="size-6 text-accent" aria-hidden focusable="false" />, value: (stats) => stats.totalCourses },
    { key: "resources", section: "resources", icon: <FolderIcon className="size-6 text-accent" aria-hidden focusable="false" />, value: (stats) => stats.totalResources },
    { key: "communities", section: "communities", icon: <UsersThreeIcon className="size-6 text-accent" aria-hidden focusable="false" />, value: (stats) => stats.totalCommunities },
    { key: "events", section: "events", icon: <CalendarIcon className="size-6 text-accent" aria-hidden focusable="false" />, value: (stats) => stats.totalEvents },
    { key: "pendingReports", section: "moderation", icon: <FlagIcon className="size-6 text-accent" aria-hidden focusable="false" />, value: (stats) => stats.pendingReports },
]

/** Card-grid skeleton mirroring the loaded layout (same grid, same card shape). */
const DashboardSkeleton = ({ count }: { count: number }) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, index) => (
            <Card key={index}>
                <Card.Content className="flex flex-col gap-2">
                    <Skeleton className="size-6 rounded" />
                    <Skeleton className="h-7 w-16 rounded" />
                    <Skeleton className="my-1 h-3 w-24 rounded" />
                </Card.Content>
            </Card>
        ))}
    </div>
)

/**
 * `/admin` dashboard overview — the role-scoped stat-card grid (total users,
 * per-domain content counts, pending reports) from the mock stats. Each card is
 * a link into its section; cards whose section the operator cannot enter are
 * hidden entirely (a Moderator sees only the pending-reports card).
 */
export const AdminDashboard = () => {
    const t = useTranslations()
    const { role } = useAdminSession()
    const statsSwr = useQueryAdminStatsSwr()
    // the shell's entry guard already keeps guests/members out; default to the
    // narrowest scope while the session hydrates so no extra card flashes in
    const allowed = SECTION_ACCESS[role ?? "member"]
    const cards = CARDS.filter((card) => allowed.includes(card.section))

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <AdminPageHeader
                section="dashboard"
                title={t("admin.dashboard.title")}
                description={t("admin.dashboard.description")}
            />
            <AsyncContent
                isLoading={!statsSwr.data && !statsSwr.error}
                skeleton={<DashboardSkeleton count={cards.length} />}
                error={!statsSwr.data ? statsSwr.error : undefined}
                errorContent={{
                    title: t("admin.dashboard.error"),
                    retryLabel: t("admin.dashboard.retry"),
                    onRetry: () => { void statsSwr.mutate() },
                }}
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {cards.map((card) => (
                        <Link
                            key={card.key}
                            href={ADMIN_SECTION_META[card.section].href}
                            aria-label={t("admin.dashboard.goTo", { section: t(`admin.shell.sections.${card.section}`) })}
                            className="block rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                            <MetricCard
                                icon={card.icon}
                                value={statsSwr.data ? card.value(statsSwr.data).toLocaleString() : ""}
                                label={t(`admin.dashboard.cards.${card.key}`)}
                                className="h-full transition-colors hover:border-accent/40"
                            />
                        </Link>
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}

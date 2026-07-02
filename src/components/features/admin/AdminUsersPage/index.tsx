"use client"

import React, { useState } from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { UsersIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { StatusChip } from "@/components/blocks/chips/StatusChip"
import { SkeletonTable } from "@/components/blocks/skeleton/Skeleton/Table"
import type { AdminRole, AdminUser, UserStatus } from "@/resources/constants/admin"
import { useQueryAdminUsersSwr } from "../hooks"
import { USER_STATUS_TONE } from "../map"
import { AdminPageHeader } from "../AdminPageHeader"
import { UserFilterBar } from "./UserFilterBar"

/**
 * `/admin/users` — searchable, filterable user list. Desktop renders an
 * accessible table (caption + scoped headers); on mobile the rows stack into
 * cards. Each row links to the user's detail page where the management actions
 * live.
 */
export const AdminUsersPage = () => {
    const t = useTranslations()
    const locale = useLocale()
    const [query, setQuery] = useState("")
    const [role, setRole] = useState<AdminRole | undefined>(undefined)
    const [status, setStatus] = useState<UserStatus | undefined>(undefined)
    const usersSwr = useQueryAdminUsersSwr({ query, role, status })
    const users = usersSwr.data ?? []

    /** Localized short date for the joined column. */
    const formatDate = (iso: string) => new Date(iso).toLocaleDateString(locale)

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <AdminPageHeader
                section="users"
                title={t("admin.users.title")}
                description={t("admin.users.description")}
            />
            <UserFilterBar
                query={query}
                onQueryChange={setQuery}
                role={role}
                onRoleChange={setRole}
                status={status}
                onStatusChange={setStatus}
            />
            <AsyncContent
                isLoading={!usersSwr.data && !usersSwr.error}
                skeleton={
                    <div className="overflow-hidden rounded-large border border-separator">
                        <SkeletonTable rows={6} cols={4} />
                    </div>
                }
                error={!usersSwr.data ? usersSwr.error : undefined}
                errorContent={{
                    title: t("admin.users.error"),
                    retryLabel: t("admin.users.retry"),
                    onRetry: () => { void usersSwr.mutate() },
                }}
                isEmpty={users.length === 0}
                emptyContent={{
                    icon: <UsersIcon aria-hidden focusable="false" />,
                    title: t("admin.users.empty.title"),
                    description: t("admin.users.empty.description"),
                }}
            >
                {/* desktop: accessible table */}
                <div className="hidden overflow-x-auto rounded-large border border-separator md:block">
                    <table className="w-full border-collapse text-left">
                        <caption className="sr-only">{t("admin.users.caption")}</caption>
                        <thead>
                            <tr>
                                {(["name", "email", "role", "status"] as const).map((column) => (
                                    <th key={column} scope="col" className="border-b border-separator px-4 py-3">
                                        <Typography type="body-xs" color="muted" weight="medium">
                                            {t(`admin.users.columns.${column}`)}
                                        </Typography>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="transition-colors hover:bg-accent/5">
                                    <th scope="row" className="border-b border-separator px-4 py-3 font-normal">
                                        <Link
                                            href={`/admin/users/${user.id}`}
                                            aria-label={t("admin.users.viewDetail", { name: user.name })}
                                            className="hover:underline"
                                        >
                                            <Typography type="body-sm" weight="medium">{user.name}</Typography>
                                        </Link>
                                    </th>
                                    <td className="border-b border-separator px-4 py-3">
                                        <Typography type="body-sm" color="muted">{user.email}</Typography>
                                    </td>
                                    <td className="border-b border-separator px-4 py-3">
                                        <Typography type="body-sm">{t(`admin.roles.${user.role}`)}</Typography>
                                    </td>
                                    <td className="border-b border-separator px-4 py-3">
                                        <StatusChip tone={USER_STATUS_TONE[user.status]}>
                                            {t(`admin.users.status.${user.status}`)}
                                        </StatusChip>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* mobile: stacked cards */}
                <ul className="flex flex-col gap-2 md:hidden">
                    {users.map((user) => (
                        <UserCard key={user.id} user={user} joinedLabel={formatDate(user.joinedAt)} />
                    ))}
                </ul>
            </AsyncContent>
        </div>
    )
}

/** One mobile user card — the whole card links to the detail page. */
const UserCard = ({ user, joinedLabel }: { user: AdminUser; joinedLabel: string }) => {
    const t = useTranslations()
    return (
        <li>
            <Link
                href={`/admin/users/${user.id}`}
                aria-label={t("admin.users.viewDetail", { name: user.name })}
                className="flex flex-col gap-2 rounded-large border border-separator p-4 transition-colors hover:border-accent/40"
            >
                <div className="flex items-center justify-between gap-2">
                    <Typography type="body-sm" weight="medium" truncate>{user.name}</Typography>
                    <StatusChip tone={USER_STATUS_TONE[user.status]}>
                        {t(`admin.users.status.${user.status}`)}
                    </StatusChip>
                </div>
                <Typography type="body-xs" color="muted" truncate>{user.email}</Typography>
                <Typography type="body-xs" color="muted">
                    {t(`admin.roles.${user.role}`)} · {joinedLabel}
                </Typography>
            </Link>
        </li>
    )
}

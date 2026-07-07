"use client"

import React from "react"
import { Skeleton, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CheckIcon, ShieldIcon, XIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useQueryRolesSwr } from "../hooks/useQueryRolesSwr"

/** Rounds a member count to a compact label (e.g. 12480 → "12.5k"). */
const formatCount = (n: number): string => {
    if (n >= 1000) {
        const k = n / 1000
        return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}k`
    }
    return String(n)
}

/** Loading skeleton — mirrors the roles overview grid + the permission matrix table so the layout never jumps. */
const RolesAdminSkeleton = () => (
    <div className="flex flex-col gap-6">
        {/* Roles overview grid */}
        <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-40 rounded-full" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map((index) => (
                    <div
                        key={index}
                        className="flex flex-col gap-3 rounded-2xl border border-separator p-4"
                    >
                        <Skeleton className="size-11 rounded-large" />
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-4 w-24 rounded-full" />
                            <Skeleton className="h-3 w-16 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
        {/* Permission matrix table */}
        <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-40 rounded-full" />
            <div className="rounded-2xl border border-separator">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="flex items-center gap-4 px-4 py-3">
                        <Skeleton className="my-[5px] h-[14px] flex-[2] rounded" />
                        {[0, 1, 2, 3].map((cell) => (
                            <Skeleton key={cell} className="my-[5px] h-[14px] flex-1 rounded" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    </div>
)

/**
 * RolesAdmin (§1 Authorization) — the `/admin/roles` roles & permissions surface.
 * Roles overview cards (name + rounded member count) + a read-only permission matrix
 * table (rows = permissions, columns = roles, cell = check/x grant icon). Feature owns
 * data (mock) + rendering; tokens own the look. ponytail: read-only mock, no write path.
 */
export const RolesAdmin = () => {
    const t = useTranslations("rbac")
    const { roles, permissions, grants, isLoading, error, mutate } = useQueryRolesSwr()

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-0">
                <Typography type="h4" weight="bold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

            <AsyncContent
                isLoading={isLoading && roles.length === 0}
                skeleton={<RolesAdminSkeleton />}
                isEmpty={roles.length === 0}
                emptyContent={{ title: t("empty") }}
                error={roles.length === 0 ? error : undefined}
                errorContent={{
                    title: t("error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("states.retry"),
                }}
            >
                <div className="flex flex-col gap-6">
            {/* Roles overview */}
            <section className="flex flex-col gap-3">
                <Typography type="body" weight="medium">
                    {t("rolesOverview")}
                </Typography>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            className="flex flex-col gap-3 rounded-2xl border border-separator p-4"
                        >
                            <div className="flex size-11 items-center justify-center rounded-large bg-accent/10 text-accent">
                                <ShieldIcon className="size-5" aria-hidden />
                            </div>
                            <div className="flex flex-col gap-0">
                                <Typography type="body-sm" weight="medium">
                                    {t(`roles.${role.key}`)}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {t("memberCount", { count: formatCount(role.memberCount) })}
                                </Typography>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Permission matrix */}
            <section className="flex flex-col gap-3">
                <Typography type="body" weight="medium">
                    {t("permissionMatrix")}
                </Typography>
                <div className="overflow-x-auto rounded-2xl border border-separator">
                    <table className="w-full border-collapse text-left">
                        <caption className="sr-only">{t("permissionMatrix")}</caption>
                        <thead>
                            <tr>
                                <th
                                    scope="col"
                                    className="border-b border-separator px-4 py-3 text-left"
                                >
                                    <Typography type="body-xs" color="muted" weight="medium">
                                        {t("permissionMatrix")}
                                    </Typography>
                                </th>
                                {roles.map((role) => (
                                    <th
                                        key={role.id}
                                        scope="col"
                                        className="border-b border-l border-separator px-4 py-3 text-center"
                                    >
                                        <Typography type="body-xs" weight="medium">
                                            {t(`roles.${role.key}`)}
                                        </Typography>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {permissions.map((perm) => (
                                <tr key={perm.id}>
                                    <th
                                        scope="row"
                                        className="border-b border-separator px-4 py-3 text-left font-normal"
                                    >
                                        <Typography type="body-sm">
                                            {t(`permissions.${perm.key}`)}
                                        </Typography>
                                    </th>
                                    {roles.map((role) => {
                                        const isGranted = grants?.[role.key]?.has(perm.key) ?? false
                                        return (
                                            <td
                                                key={role.id}
                                                className="border-b border-l border-separator px-4 py-3 text-center"
                                            >
                                                <span className="inline-flex items-center justify-center">
                                                    {isGranted ? (
                                                        <CheckIcon
                                                            weight="bold"
                                                            className="size-4 text-success"
                                                            aria-label={t("granted")}
                                                        />
                                                    ) : (
                                                        <XIcon
                                                            className="size-4 text-muted"
                                                            aria-label={t("notGranted")}
                                                        />
                                                    )}
                                                </span>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
                </div>
            </AsyncContent>
        </div>
    )
}

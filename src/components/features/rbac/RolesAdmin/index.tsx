"use client"

import React from "react"
import { Chip, Skeleton, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CheckIcon, ShieldIcon, XIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useQueryRolesSwr } from "../hooks/useQueryRolesSwr"

/** Rounds a grant count to a compact label (e.g. 12480 → "12.5k"). */
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
 * Wired to the real identity-rbac REST endpoints (`GET /identity/roles` +
 * `GET /identity/roles/{id}`). Roles overview cards (name + code + grant count +
 * scope chips) + a read-only permission matrix (rows = permission codes grouped by
 * domain, columns = roles, cell = check/x grant icon). Read-only; write paths
 * (create/replace-permissions/grant) exist on the BE but are not surfaced here.
 */
export const RolesAdmin = () => {
    const t = useTranslations("rbac")
    const { roles, permissionGroups, grants, isLoading, error, mutate } = useQueryRolesSwr()

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
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex size-11 items-center justify-center rounded-large bg-accent/10 text-accent">
                                            <ShieldIcon className="size-5" aria-hidden />
                                        </div>
                                        {role.system ? (
                                            <Chip size="sm" variant="soft" color="default">
                                                <Chip.Label>{t("systemRole")}</Chip.Label>
                                            </Chip>
                                        ) : null}
                                    </div>
                                    <div className="flex flex-col gap-0">
                                        <Typography type="body-sm" weight="medium">
                                            {role.name}
                                        </Typography>
                                        <Typography type="body-xs" color="muted">
                                            {role.code}
                                        </Typography>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Typography type="body-xs" color="muted">
                                            {t("grantCount", { count: formatCount(role.grantCount) })}
                                            {" · "}
                                            {t("permissionCount", { count: role.permissionCodes.length })}
                                        </Typography>
                                        {role.allowedScopeTypes.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {role.allowedScopeTypes.map((scope) => (
                                                    <Chip
                                                        key={scope}
                                                        size="sm"
                                                        variant="soft"
                                                        color="default"
                                                    >
                                                        <Chip.Label>{scope}</Chip.Label>
                                                    </Chip>
                                                ))}
                                            </div>
                                        ) : null}
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
                        <div className="max-h-[70vh] overflow-auto rounded-2xl border border-separator">
                            <table className="w-full border-collapse text-left">
                                <caption className="sr-only">{t("permissionMatrix")}</caption>
                                <thead className="sticky top-0 z-10 bg-background">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="sticky left-0 z-20 border-b border-separator bg-background px-4 py-3 text-left"
                                        >
                                            <Typography type="body-xs" color="muted" weight="medium">
                                                {t("permissionColumn")}
                                            </Typography>
                                        </th>
                                        {roles.map((role) => (
                                            <th
                                                key={role.id}
                                                scope="col"
                                                title={role.name}
                                                className="border-b border-l border-separator px-3 py-3 text-center"
                                            >
                                                <Typography type="body-xs" weight="medium">
                                                    {role.code}
                                                </Typography>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {permissionGroups.map((group) => (
                                        <React.Fragment key={group.domain}>
                                            <tr>
                                                <th
                                                    scope="colgroup"
                                                    colSpan={roles.length + 1}
                                                    className="sticky left-0 border-b border-separator bg-content2 px-4 py-2 text-left"
                                                >
                                                    <Typography
                                                        type="body-xs"
                                                        weight="medium"
                                                        color="muted"
                                                    >
                                                        {group.domain}
                                                    </Typography>
                                                </th>
                                            </tr>
                                            {group.codes.map((code) => (
                                                <tr key={code}>
                                                    <th
                                                        scope="row"
                                                        className="sticky left-0 z-10 border-b border-separator bg-background px-4 py-3 text-left font-normal"
                                                    >
                                                        <Typography type="body-sm">
                                                            {code}
                                                        </Typography>
                                                    </th>
                                                    {roles.map((role) => {
                                                        const isGranted =
                                                            grants?.[role.id]?.has(code) ?? false
                                                        return (
                                                            <td
                                                                key={role.id}
                                                                className="border-b border-l border-separator px-3 py-3 text-center"
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
                                        </React.Fragment>
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

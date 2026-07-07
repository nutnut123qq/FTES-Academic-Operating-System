"use client"

import React from "react"
import {
    Button,
    Card,
    Chip,
    cn,
    FieldError,
    Input,
    Label,
    Skeleton,
    TextField,
    Typography,
} from "@heroui/react"
import { Controller } from "react-hook-form"
import { useTranslations } from "next-intl"
import {
    ArrowRightIcon,
    KeyIcon,
    ShieldCheckIcon,
    SlidersHorizontalIcon,
    UsersThreeIcon,
    VideoIcon,
    WaveTriangleIcon,
} from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Link } from "@/i18n/navigation"
import { useAppSelector } from "@/redux/hooks"
import { useAdminApiKeyForm } from "@/hooks/rhf/useAdminApiKeyForm"
import { useQueryAdminOverviewSwr } from "../hooks/useQueryAdminOverviewSwr"

/** Compact metric tile: a big number over a muted label. */
const StatTile = ({ value, label }: { value: number | string; label: string }) => (
    <div className="flex flex-col gap-1 rounded-2xl border border-separator p-4">
        <Typography type="h4" weight="bold">
            {value}
        </Typography>
        <Typography type="body-xs" color="muted">
            {label}
        </Typography>
    </div>
)

/** Loading skeleton mirroring the two stat rows so the layout never jumps. */
const AdminConsoleSkeleton = () => (
    <div className="flex flex-col gap-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-24 rounded-2xl" />
            ))}
        </div>
    </div>
)

/** One media/AI tool shortcut row. */
interface ToolLink {
    key: "uploadVideo" | "aiBalancer" | "mpegDash"
    href: string
    Icon: typeof VideoIcon
}

const TOOL_LINKS: Array<ToolLink> = [
    { key: "uploadVideo", href: "/admin/tools/upload-video", Icon: VideoIcon },
    { key: "aiBalancer", href: "/admin/tools/ai-balancer", Icon: WaveTriangleIcon },
    { key: "mpegDash", href: "/admin/tools/mpeg-dash", Icon: SlidersHorizontalIcon },
]

/**
 * AdminConsole — the `/admin` landing surface. Shows the signed-in admin's own
 * effective access and a platform roles/grants overview, wired to the real identity
 * RBAC REST endpoints (`GET /identity/me/permissions`, `GET /identity/roles`). Also
 * carries the media/AI tools entry (the infra API-key gate the tools depend on) so
 * those flows keep working. Read-only + graceful: any unavailable figure degrades
 * to its empty state instead of blocking the page.
 */
export const AdminConsole = () => {
    const t = useTranslations("adminConsole")
    const { overview, isLoading, error, mutate } = useQueryAdminOverviewSwr()

    // Media/AI tools infra key (kept in redux, in-memory for the session).
    const apiKey = useAppSelector((state) => state.admin.apiKey)
    const { control, watch, formState, onSubmit } = useAdminApiKeyForm()

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
                isLoading={isLoading && !overview}
                skeleton={<AdminConsoleSkeleton />}
                error={!overview ? error : undefined}
                errorContent={{
                    title: t("error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("retry"),
                }}
            >
                {overview ? (
                    <div className="flex flex-col gap-6">
                        {/* My access */}
                        <section className="flex flex-col gap-3">
                            <Typography type="body" weight="medium">
                                {t("myAccess.heading")}
                            </Typography>
                            <Card className="border border-separator">
                                <Card.Content className="flex flex-col gap-4 p-5">
                                    {overview.myAccessUnavailable ? (
                                        <Typography type="body-sm" color="muted">
                                            {t("myAccess.unavailable")}
                                        </Typography>
                                    ) : (
                                        <>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="flex size-11 items-center justify-center rounded-large bg-accent/10 text-accent">
                                                    <ShieldCheckIcon className="size-5" aria-hidden />
                                                </div>
                                                {overview.superAdmin ? (
                                                    <Chip size="sm" variant="soft" color="warning">
                                                        <Chip.Label>{t("myAccess.superAdmin")}</Chip.Label>
                                                    </Chip>
                                                ) : null}
                                                {overview.myRoleCodes.map((code) => (
                                                    <Chip key={code} size="sm" variant="soft" color="accent">
                                                        <Chip.Label>{code}</Chip.Label>
                                                    </Chip>
                                                ))}
                                                {overview.myRoleCodes.length === 0 && !overview.superAdmin ? (
                                                    <Typography type="body-sm" color="muted">
                                                        {t("myAccess.noRoles")}
                                                    </Typography>
                                                ) : null}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                                                <StatTile
                                                    value={overview.myPermissionCount}
                                                    label={t("myAccess.permissions")}
                                                />
                                                <StatTile
                                                    value={overview.myDomainCount}
                                                    label={t("myAccess.domains")}
                                                />
                                            </div>
                                        </>
                                    )}
                                </Card.Content>
                            </Card>
                        </section>

                        {/* Platform roles & grants overview */}
                        {!overview.rolesUnavailable ? (
                            <section className="flex flex-col gap-3">
                                <div className="flex items-center justify-between gap-2">
                                    <Typography type="body" weight="medium">
                                        {t("roles.heading")}
                                    </Typography>
                                    <Link
                                        href="/admin/roles"
                                        className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                                    >
                                        {t("roles.manage")}
                                        <ArrowRightIcon className="size-4" aria-hidden />
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                    <StatTile value={overview.totalRoles} label={t("roles.total")} />
                                    <StatTile value={overview.systemRoles} label={t("roles.system")} />
                                    <StatTile value={overview.activeRoles} label={t("roles.active")} />
                                    <StatTile value={overview.totalGrants} label={t("roles.grants")} />
                                </div>
                            </section>
                        ) : null}

                        {/* Media & AI tools */}
                        <section className="flex flex-col gap-3">
                            <Typography type="body" weight="medium">
                                {t("tools.heading")}
                            </Typography>
                            <Card className="border border-separator">
                                <Card.Content className="flex flex-col gap-4 p-5">
                                    {apiKey ? (
                                        <div className="flex items-center gap-2">
                                            <Chip size="sm" variant="soft" color="success">
                                                <Chip.Label>{t("tools.keySet")}</Chip.Label>
                                            </Chip>
                                            <Typography type="body-sm" color="muted">
                                                {t("tools.keySetHint")}
                                            </Typography>
                                        </div>
                                    ) : (
                                        <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:max-w-md">
                                            <Controller
                                                control={control}
                                                name="apiKey"
                                                render={({ field, fieldState }) => (
                                                    <TextField
                                                        variant="secondary"
                                                        isInvalid={fieldState.invalid && fieldState.isTouched}
                                                    >
                                                        <Label htmlFor="admin-console-api-key" className="text-sm">
                                                            {t("tools.keyLabel")}
                                                        </Label>
                                                        <div className="relative">
                                                            <KeyIcon
                                                                className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted"
                                                                aria-hidden
                                                            />
                                                            <Input
                                                                id="admin-console-api-key"
                                                                type="password"
                                                                placeholder={t("tools.keyPlaceholder")}
                                                                className="pl-9"
                                                                name={field.name}
                                                                ref={field.ref}
                                                                value={field.value}
                                                                onChange={(e) => field.onChange(e.target.value)}
                                                                onBlur={field.onBlur}
                                                            />
                                                        </div>
                                                        <FieldError>{fieldState.error?.message}</FieldError>
                                                    </TextField>
                                                )}
                                            />
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                isDisabled={!watch("apiKey") || formState.isSubmitting}
                                                isPending={formState.isSubmitting}
                                            >
                                                {t("tools.keySubmit")}
                                            </Button>
                                        </form>
                                    )}
                                    <div className="flex flex-col divide-y divide-separator">
                                        {TOOL_LINKS.map(({ key, href, Icon }) => (
                                            <Link
                                                key={key}
                                                href={href}
                                                className={cn(
                                                    "group flex items-center gap-3 py-3",
                                                    !apiKey && "pointer-events-none opacity-50",
                                                )}
                                                aria-disabled={!apiKey}
                                            >
                                                <Icon className="size-5 shrink-0 text-muted" aria-hidden />
                                                <span className="text-sm transition-colors group-hover:text-foreground group-hover:underline">
                                                    {t(`tools.links.${key}`)}
                                                </span>
                                                <ArrowRightIcon className="ml-auto size-4 text-muted" aria-hidden />
                                            </Link>
                                        ))}
                                    </div>
                                </Card.Content>
                            </Card>
                        </section>

                        {/* Secondary quick link */}
                        <Link
                            href="/admin/roles"
                            className="inline-flex items-center gap-2 self-start rounded-2xl border border-separator px-4 py-3 text-sm hover:border-accent"
                        >
                            <UsersThreeIcon className="size-5 text-accent" aria-hidden />
                            {t("roles.manage")}
                            <ArrowRightIcon className="size-4" aria-hidden />
                        </Link>
                    </div>
                ) : null}
            </AsyncContent>
        </div>
    )
}

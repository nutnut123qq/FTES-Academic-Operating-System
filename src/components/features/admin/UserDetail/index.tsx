"use client"

import React, { useState } from "react"
import { useParams } from "next/navigation"
import type { Selection } from "@heroui/react"
import { Button, Dropdown, Label, Skeleton, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { CaretDownIcon, UserIcon } from "@phosphor-icons/react"
import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ConfirmDialog } from "@/components/blocks/feedback/ConfirmDialog"
import { StatusChip } from "@/components/blocks/chips/StatusChip"
import { adminService } from "@/services/admin"
import type { AdminRole, AdminUser } from "@/resources/constants/admin"
import { useAdminMutation, useQueryAdminUserSwr } from "../hooks"
import { USER_STATUS_TONE } from "../map"
import { AdminPageHeader } from "../AdminPageHeader"

const ROLE_KEYS: Array<AdminRole> = ["member", "moderator", "admin", "superAdmin"]

/** A management action awaiting confirmation. */
type PendingUserAction =
    | { type: "changeRole"; role: AdminRole }
    | { type: "suspend" }
    | { type: "ban" }
    | { type: "reset" }

/** Detail-card skeleton mirroring the loaded field grid. */
const UserDetailSkeleton = () => (
    <div className="flex flex-col gap-3 rounded-large border border-separator p-6">
        <Skeleton className="h-5 w-48 rounded" />
        {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="my-1 h-3 w-64 rounded" />
        ))}
    </div>
)

/**
 * `/admin/users/[userId]` — one user's profile fields plus the management
 * actions (change role / suspend / ban / reset password). Every action passes
 * through a {@link ConfirmDialog} describing the consequence; canceling leaves
 * the account untouched. Mutations run against the mock admin service and toast
 * success/failure.
 */
export const UserDetail = () => {
    const { userId } = useParams<{ userId: string }>()
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const userSwr = useQueryAdminUserSwr(userId)
    const { run, isPending } = useAdminMutation()
    const [pending, setPending] = useState<PendingUserAction | null>(null)

    const user = userSwr.data ?? null
    const formatDate = (iso: string) => new Date(iso).toLocaleDateString(locale)

    /** Localized title/description/tone for the active confirm dialog. */
    const confirmCopy = (action: PendingUserAction, target: AdminUser) => {
        switch (action.type) {
        case "changeRole":
            return {
                title: t("admin.users.confirm.changeRoleTitle"),
                description: t("admin.users.confirm.changeRoleDescription", {
                    name: target.name,
                    role: t(`admin.roles.${action.role}`),
                }),
                destructive: false,
            }
        case "suspend":
            return {
                title: t("admin.users.confirm.suspendTitle"),
                description: t("admin.users.confirm.suspendDescription", { name: target.name }),
                destructive: true,
            }
        case "ban":
            return {
                title: t("admin.users.confirm.banTitle"),
                description: t("admin.users.confirm.banDescription", { name: target.name }),
                destructive: true,
            }
        case "reset":
            return {
                title: t("admin.users.confirm.resetTitle"),
                description: t("admin.users.confirm.resetDescription", { email: target.email }),
                destructive: false,
            }
        }
    }

    /** Runs the confirmed action against the mock service, then closes the dialog. */
    const onConfirm = async () => {
        if (!pending || !user) return
        const options = {
            errorMessage: t("admin.users.toast.failed"),
            revalidatePrefixes: ["ADMIN_USER", "ADMIN_USERS", "ADMIN_STATS"],
        }
        switch (pending.type) {
        case "changeRole": {
            const role = pending.role
            await run(() => adminService.changeUserRole(user.id, role), {
                ...options, successMessage: t("admin.users.toast.roleChanged"),
            })
            break
        }
        case "suspend":
            await run(() => adminService.suspendUser(user.id), {
                ...options, successMessage: t("admin.users.toast.suspended"),
            })
            break
        case "ban":
            await run(() => adminService.banUser(user.id), {
                ...options, successMessage: t("admin.users.toast.banned"),
            })
            break
        case "reset":
            await run(() => adminService.resetUserPassword(user.id), {
                ...options, successMessage: t("admin.users.toast.resetSent"),
            })
            break
        }
        setPending(null)
    }

    const copy = pending && user ? confirmCopy(pending, user) : null

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <AdminPageHeader
                section="users"
                subpage={user?.name ?? userId}
                title={user?.name ?? t("admin.users.detail.title")}
                description={user ? user.email : undefined}
                actions={user ? (
                    <div className="flex gap-2">
                        {/* change role: picking a role opens the confirm dialog */}
                        <Dropdown>
                            <Button variant="secondary" aria-label={t("admin.users.actions.changeRole")}>
                                {t("admin.users.actions.changeRole")}
                                <CaretDownIcon className="size-4" aria-hidden focusable="false" />
                            </Button>
                            <Dropdown.Popover>
                                <Dropdown.Menu
                                    selectionMode="single"
                                    selectedKeys={new Set([user.role])}
                                    onSelectionChange={(selection: Selection) => {
                                        if (selection === "all") return
                                        const next = [...selection][0]
                                        if (next && String(next) !== user.role) {
                                            setPending({ type: "changeRole", role: String(next) as AdminRole })
                                        }
                                    }}
                                >
                                    <Dropdown.Section>
                                        {ROLE_KEYS.map((role) => (
                                            <Dropdown.Item key={role} id={role} textValue={t(`admin.roles.${role}`)}>
                                                <Dropdown.ItemIndicator />
                                                <Label>{t(`admin.roles.${role}`)}</Label>
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Section>
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown>

                        {/* account actions menu */}
                        <Dropdown>
                            <Button variant="secondary" aria-label={t("admin.users.actions.label")}>
                                {t("admin.users.actions.label")}
                                <CaretDownIcon className="size-4" aria-hidden focusable="false" />
                            </Button>
                            <Dropdown.Popover>
                                <Dropdown.Menu
                                    onAction={(key) => {
                                        if (key === "suspend") setPending({ type: "suspend" })
                                        if (key === "ban") setPending({ type: "ban" })
                                        if (key === "reset") setPending({ type: "reset" })
                                    }}
                                >
                                    <Dropdown.Section>
                                        <Dropdown.Item key="suspend" id="suspend" textValue={t("admin.users.actions.suspend")}>
                                            <Label>{t("admin.users.actions.suspend")}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item key="ban" id="ban" textValue={t("admin.users.actions.ban")}>
                                            <Label className="text-danger">{t("admin.users.actions.ban")}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item key="reset" id="reset" textValue={t("admin.users.actions.resetPassword")}>
                                            <Label>{t("admin.users.actions.resetPassword")}</Label>
                                        </Dropdown.Item>
                                    </Dropdown.Section>
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown>
                    </div>
                ) : undefined}
            />

            <AsyncContent
                isLoading={userSwr.data === undefined && !userSwr.error}
                skeleton={<UserDetailSkeleton />}
                error={userSwr.data === undefined ? userSwr.error : undefined}
                errorContent={{
                    title: t("admin.users.error"),
                    retryLabel: t("admin.users.retry"),
                    onRetry: () => { void userSwr.mutate() },
                }}
                isEmpty={user === null}
                emptyContent={{
                    icon: <UserIcon aria-hidden focusable="false" />,
                    title: t("admin.users.detail.notFound"),
                    onRetry: () => router.push("/admin/users"),
                    retryLabel: t("admin.users.detail.backToList"),
                }}
            >
                {user ? (
                    <dl className="grid grid-cols-1 gap-3 rounded-large border border-separator p-6 sm:grid-cols-2">
                        <ProfileField label={t("admin.users.detail.email")}>
                            <Typography type="body-sm">{user.email}</Typography>
                        </ProfileField>
                        <ProfileField label={t("admin.users.detail.role")}>
                            <Typography type="body-sm">{t(`admin.roles.${user.role}`)}</Typography>
                        </ProfileField>
                        <ProfileField label={t("admin.users.detail.status")}>
                            <StatusChip tone={USER_STATUS_TONE[user.status]}>
                                {t(`admin.users.status.${user.status}`)}
                            </StatusChip>
                        </ProfileField>
                        <ProfileField label={t("admin.users.detail.joinedAt")}>
                            <Typography type="body-sm">{formatDate(user.joinedAt)}</Typography>
                        </ProfileField>
                        <ProfileField label={t("admin.users.detail.lastActiveAt")}>
                            <Typography type="body-sm">{formatDate(user.lastActiveAt)}</Typography>
                        </ProfileField>
                    </dl>
                ) : null}
            </AsyncContent>

            {copy ? (
                <ConfirmDialog
                    isOpen={pending !== null}
                    onOpenChange={(open) => { if (!open) setPending(null) }}
                    title={copy.title}
                    description={copy.description}
                    confirmLabel={t("admin.confirm.confirm")}
                    cancelLabel={t("admin.confirm.cancel")}
                    isDestructive={copy.destructive}
                    isPending={isPending}
                    onConfirm={() => { void onConfirm() }}
                />
            ) : null}
        </div>
    )
}

/** One labeled field in the profile grid. */
const ProfileField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-0">
        <dt>
            <Typography type="body-xs" color="muted">{label}</Typography>
        </dt>
        <dd>{children}</dd>
    </div>
)

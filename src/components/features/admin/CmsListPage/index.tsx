"use client"

import React, { useState } from "react"
import type { Selection } from "@heroui/react"
import { Button, Dropdown, Label, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    ArrowSquareOutIcon,
    CaretDownIcon,
    PushPinIcon,
    StarIcon,
    TrayIcon,
} from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ConfirmDialog } from "@/components/blocks/feedback/ConfirmDialog"
import { StatusChip } from "@/components/blocks/chips/StatusChip"
import { SkeletonTable } from "@/components/blocks/skeleton/Skeleton/Table"
import { adminService } from "@/services/admin"
import type { CmsDomain, CmsItem, ContentStatus } from "@/resources/constants/admin"
import { useAdminMutation, useQueryAdminCmsSwr } from "../hooks"
import { CMS_STATUS_TONE } from "../map"
import { AdminPageHeader } from "../AdminPageHeader"

const STATUS_KEYS: Array<ContentStatus> = ["draft", "published", "archived"]

/** Props for {@link CmsListPage}. */
export interface CmsListPageProps {
    /** Which CMS domain this page manages (drives data, copy, and section). */
    domain: CmsDomain
}

/**
 * Shared domain-CMS list mounted by `/admin/{courses,resources,communities,events}`.
 * Desktop renders an accessible table (caption + scoped headers); on mobile the
 * rows stack into cards. Each item shows title + publication status +
 * featured/pinned flags, offers a status dropdown (archiving asks for
 * confirmation first — it hides the item from users), featured/pin icon
 * toggles, and a link to the item's EXISTING user-facing detail page (the
 * console never re-implements item detail).
 */
export const CmsListPage = ({ domain }: CmsListPageProps) => {
    const t = useTranslations()
    const cmsSwr = useQueryAdminCmsSwr(domain)
    const { run, isPending } = useAdminMutation()
    // item awaiting the archive confirmation (other status changes act immediately)
    const [archiving, setArchiving] = useState<CmsItem | null>(null)
    const items = cmsSwr.data ?? []

    const mutationOptions = (successMessage: string) => ({
        successMessage,
        errorMessage: t("admin.cms.toast.failed"),
        revalidatePrefixes: ["ADMIN_CMS", "ADMIN_STATS"],
    })

    /** Applies a status change (archive arrives here only after confirmation). */
    const setStatus = async (item: CmsItem, status: ContentStatus) => {
        await run(
            () => adminService.toggleCmsStatus(item.id, status),
            mutationOptions(t("admin.cms.toast.statusChanged")),
        )
    }

    /** Flips the featured flag. */
    const toggleFeatured = async (item: CmsItem) => {
        await run(
            () => adminService.setCmsFeatured(item.id, !item.featured),
            mutationOptions(t("admin.cms.toast.updated")),
        )
    }

    /** Flips the pinned flag. */
    const togglePinned = async (item: CmsItem) => {
        await run(
            () => adminService.setCmsPinned(item.id, !item.pinned),
            mutationOptions(t("admin.cms.toast.updated")),
        )
    }

    /** Shared control-cluster props for one item (table cell + mobile card). */
    const controlsFor = (item: CmsItem) => ({
        item,
        isPending,
        onStatusChange: (status: ContentStatus) => {
            if (status === "archived") setArchiving(item)
            else void setStatus(item, status)
        },
        onToggleFeatured: () => { void toggleFeatured(item) },
        onTogglePinned: () => { void togglePinned(item) },
    })

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <AdminPageHeader
                section={domain}
                title={t(`admin.cms.domains.${domain}.title`)}
                description={t(`admin.cms.domains.${domain}.description`)}
            />
            <AsyncContent
                isLoading={!cmsSwr.data && !cmsSwr.error}
                skeleton={
                    <div className="overflow-hidden rounded-large border border-separator">
                        <SkeletonTable rows={4} cols={4} />
                    </div>
                }
                error={!cmsSwr.data ? cmsSwr.error : undefined}
                errorContent={{
                    title: t("admin.cms.error"),
                    retryLabel: t("admin.cms.retry"),
                    onRetry: () => { void cmsSwr.mutate() },
                }}
                isEmpty={items.length === 0}
                emptyContent={{
                    icon: <TrayIcon aria-hidden focusable="false" />,
                    title: t("admin.cms.empty.title"),
                    description: t("admin.cms.empty.description"),
                }}
            >
                {/* desktop: accessible table */}
                <div className="hidden overflow-x-auto rounded-large border border-separator md:block">
                    <table className="w-full border-collapse text-left">
                        <caption className="sr-only">{t("admin.cms.caption")}</caption>
                        <thead>
                            <tr>
                                {(["title", "status", "flags", "actions"] as const).map((column) => (
                                    <th key={column} scope="col" className="border-b border-separator px-4 py-3">
                                        <Typography type="body-xs" color="muted" weight="medium">
                                            {t(`admin.cms.columns.${column}`)}
                                        </Typography>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="transition-colors hover:bg-accent/5">
                                    <th scope="row" className="border-b border-separator px-4 py-3 font-normal">
                                        <Typography type="body-sm" weight="medium">{item.title}</Typography>
                                    </th>
                                    <td className="border-b border-separator px-4 py-3">
                                        <StatusChip tone={CMS_STATUS_TONE[item.status]}>
                                            {t(`admin.cms.status.${item.status}`)}
                                        </StatusChip>
                                    </td>
                                    <td className="border-b border-separator px-4 py-3">
                                        <div className="flex flex-wrap gap-2">
                                            {item.featured ? <StatusChip tone="accent">{t("admin.cms.featured")}</StatusChip> : null}
                                            {item.pinned ? <StatusChip tone="neutral">{t("admin.cms.pinned")}</StatusChip> : null}
                                        </div>
                                    </td>
                                    <td className="border-b border-separator px-4 py-3">
                                        <CmsControls {...controlsFor(item)} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* mobile: stacked cards with the same controls */}
                <ul className="flex flex-col gap-2 md:hidden">
                    {items.map((item) => (
                        <li key={item.id} className="flex flex-col gap-2 rounded-large border border-separator p-4">
                            <Typography type="body-sm" weight="medium" truncate>{item.title}</Typography>
                            <div className="flex flex-wrap items-center gap-2">
                                <StatusChip tone={CMS_STATUS_TONE[item.status]}>
                                    {t(`admin.cms.status.${item.status}`)}
                                </StatusChip>
                                {item.featured ? <StatusChip tone="accent">{t("admin.cms.featured")}</StatusChip> : null}
                                {item.pinned ? <StatusChip tone="neutral">{t("admin.cms.pinned")}</StatusChip> : null}
                            </div>
                            <CmsControls {...controlsFor(item)} />
                        </li>
                    ))}
                </ul>
            </AsyncContent>

            <ConfirmDialog
                isOpen={archiving !== null}
                onOpenChange={(open) => { if (!open) setArchiving(null) }}
                title={t("admin.cms.confirmArchive.title")}
                description={archiving ? t("admin.cms.confirmArchive.description", { title: archiving.title }) : undefined}
                confirmLabel={t("admin.confirm.confirm")}
                cancelLabel={t("admin.confirm.cancel")}
                isDestructive
                isPending={isPending}
                onConfirm={() => {
                    if (!archiving) return
                    void setStatus(archiving, "archived").then(() => setArchiving(null))
                }}
            />
        </div>
    )
}

/** Props for {@link CmsControls}. */
interface CmsControlsProps {
    item: CmsItem
    /** Disables controls while a mutation runs. */
    isPending: boolean
    /** Fired with the picked status (the page confirms archiving itself). */
    onStatusChange: (status: ContentStatus) => void
    onToggleFeatured: () => void
    onTogglePinned: () => void
}

/** One item's control cluster: status picker, feature/pin toggles, detail link. */
const CmsControls = ({ item, isPending, onStatusChange, onToggleFeatured, onTogglePinned }: CmsControlsProps) => {
    const t = useTranslations()

    const onSelectionChange = (selection: Selection) => {
        if (selection === "all") return
        const next = [...selection][0]
        if (next && String(next) !== item.status) onStatusChange(String(next) as ContentStatus)
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* publication status picker (archive confirms first) */}
            <Dropdown>
                <Button size="sm" variant="secondary" aria-label={t("admin.cms.actions.statusLabel")} isDisabled={isPending}>
                    {t(`admin.cms.status.${item.status}`)}
                    <CaretDownIcon className="size-4" aria-hidden focusable="false" />
                </Button>
                <Dropdown.Popover>
                    <Dropdown.Menu
                        selectionMode="single"
                        selectedKeys={new Set([item.status])}
                        onSelectionChange={onSelectionChange}
                    >
                        <Dropdown.Section>
                            {STATUS_KEYS.map((status) => (
                                <Dropdown.Item key={status} id={status} textValue={t(`admin.cms.status.${status}`)}>
                                    <Dropdown.ItemIndicator />
                                    <Label>{t(`admin.cms.status.${status}`)}</Label>
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Section>
                    </Dropdown.Menu>
                </Dropdown.Popover>
            </Dropdown>

            <Button
                size="sm"
                isIconOnly
                variant="tertiary"
                aria-label={t(item.featured ? "admin.cms.actions.unfeature" : "admin.cms.actions.feature")}
                aria-pressed={item.featured}
                isDisabled={isPending}
                onPress={onToggleFeatured}
            >
                <StarIcon
                    className={item.featured ? "size-5 text-accent" : "size-5"}
                    weight={item.featured ? "fill" : "regular"}
                    aria-hidden
                    focusable="false"
                />
            </Button>
            <Button
                size="sm"
                isIconOnly
                variant="tertiary"
                aria-label={t(item.pinned ? "admin.cms.actions.unpin" : "admin.cms.actions.pin")}
                aria-pressed={item.pinned}
                isDisabled={isPending}
                onPress={onTogglePinned}
            >
                <PushPinIcon
                    className={item.pinned ? "size-5 text-accent" : "size-5"}
                    weight={item.pinned ? "fill" : "regular"}
                    aria-hidden
                    focusable="false"
                />
            </Button>

            {/* existing user-facing detail page */}
            <Link
                href={item.detailHref}
                aria-label={t("admin.cms.actions.viewDetail")}
                className="flex items-center gap-2 text-sm text-accent hover:underline"
            >
                <ArrowSquareOutIcon className="size-4" aria-hidden focusable="false" />
                <span className="hidden sm:inline">{t("admin.cms.actions.viewDetail")}</span>
            </Link>
        </div>
    )
}

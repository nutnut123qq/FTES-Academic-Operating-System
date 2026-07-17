"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { SubPageHeader } from "@/components/reuseable/SubPageHeader"
import { useQueryAiToolsSwr } from "../../hooks/useQueryAiToolsSwr"

/** Props for {@link AiToolShell}. */
export interface AiToolShellProps {
    /**
     * Catalog slug (`summary` / `flashcards` / `quiz` / `debug`) — drives the
     * i18n title/description (`aiPlatform.tools.<key>.{name,desc}`) and the live
     * remaining-quota badge (matched against the catalog the hub already loads).
     */
    toolKey: string
    /** The form + result region for this tool. */
    children: React.ReactNode
}

/**
 * Shared chrome for a `/ai/tools/*` job tool page: a back-to-hub header (title +
 * description from the shared tool catalog i18n), a live remaining-quota chip, and
 * the page body. Keeps every tool page visually identical so only the form and the
 * per-type result renderer differ.
 */
export const AiToolShell = ({ toolKey, children }: AiToolShellProps) => {
    const t = useTranslations("aiPlatform")
    const router = useRouter()
    const { tools } = useQueryAiToolsSwr()
    const remaining = tools.find((tool) => tool.key === toolKey)?.remaining

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <SubPageHeader
                    title={t(`tools.${toolKey}.name`)}
                    description={t(`tools.${toolKey}.desc`)}
                    onBack={() => router.push("/ai")}
                    backAriaLabel={t("toolPages.back")}
                    className="min-w-0 flex-1"
                />
                {remaining !== undefined ? (
                    <Chip variant="secondary" size="sm" className="mt-1 shrink-0">
                        {t("quotaRemaining", { count: remaining })}
                    </Chip>
                ) : null}
            </div>
            {children}
        </div>
    )
}

/** A muted "which model produced this" caption, shown under every tool's result. */
export const AiToolModelNote = ({ model }: { model?: string }) => {
    const t = useTranslations("aiPlatform.toolPages")
    if (!model) return null
    return (
        <Typography type="body-xs" color="muted">
            {t("modelLabel", { model })}
        </Typography>
    )
}

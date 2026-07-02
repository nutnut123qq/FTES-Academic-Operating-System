"use client"

import React from "react"
import { useLocale, useTranslations } from "next-intl"
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react"
import { CONFIG_AUDIT_YOU } from "@/resources/constants/config"

/** Props for {@link AuditNote}. */
export interface AuditNoteProps {
    /** Audit handle of the last editor (mock); {@link CONFIG_AUDIT_YOU} = the viewer. */
    lastChangedBy?: string
    /** ISO timestamp of the last save. */
    lastChangedAt?: string
}

/**
 * AuditNote — the "last changed by {who} at {when}" line of a setting group
 * (mock — the full audit-log service is a separate §24 concern). Renders
 * nothing until the group has been saved at least once.
 */
export const AuditNote = ({ lastChangedBy, lastChangedAt }: AuditNoteProps) => {
    const t = useTranslations()
    const locale = useLocale()
    if (!lastChangedBy || !lastChangedAt) return null

    const who = lastChangedBy === CONFIG_AUDIT_YOU ? t("admin.config.audit.you") : lastChangedBy
    const when = new Date(lastChangedAt).toLocaleString(locale)

    return (
        <p className="flex items-center gap-2 text-xs text-muted">
            <ClockCounterClockwiseIcon aria-hidden focusable="false" className="size-4" />
            {t("admin.config.settings.auditNote", { who, when })}
        </p>
    )
}

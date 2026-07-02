"use client"

import React from "react"
import { Button } from "@heroui/react"
import { useTranslations } from "next-intl"
import { LockIcon } from "@phosphor-icons/react"
import { useRouter } from "@/i18n/navigation"
import { EmptyState } from "@/components/blocks/feedback/EmptyState"
import { SECTION_ACCESS, type AdminRole } from "@/resources/constants/admin"
import { ADMIN_SECTION_META } from "../map"

/** Props for {@link AdminForbidden}. */
export interface AdminForbiddenProps {
    /** The operator's role — used to route the CTA to a section they CAN enter. */
    role: AdminRole
}

/**
 * 403 surface shown when the operator deep-links into a section outside
 * `SECTION_ACCESS[role]` (e.g. a Moderator opening `/admin/users`). States that
 * access is not permitted — deliberately not a 404 — and offers a way back to
 * the operator's first permitted section.
 */
export const AdminForbidden = ({ role }: AdminForbiddenProps) => {
    const t = useTranslations()
    const router = useRouter()
    const fallback = SECTION_ACCESS[role][0] ?? "dashboard"

    return (
        <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
                icon={<LockIcon aria-hidden focusable="false" />}
                title={t("admin.forbidden.title")}
                description={t("admin.forbidden.description")}
                action={
                    <Button
                        variant="secondary"
                        onPress={() => router.push(ADMIN_SECTION_META[fallback].href)}
                    >
                        {t("admin.forbidden.backToAllowed")}
                    </Button>
                }
            />
        </div>
    )
}

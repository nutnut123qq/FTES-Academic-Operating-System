"use client"

import React from "react"
import {
    Typography,
    cn,
    Avatar,
} from "@heroui/react"
import { UserIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link GuestHeader}. */
export type GuestHeaderProps = WithClassNames<undefined>

/**
 * Static header shown to signed-out viewers in the account dropdown — a generic
 * user glyph beside a short "sign in to track your progress" prompt. Mirrors the
 * {@link import("../UserSummary").UserSummary} shape (size-9 leading + a text
 * column) so the skeleton swap is seamless. Presentational.
 *
 * @param props - optional root class name (placement only).
 */
export const GuestHeader = ({ className }: GuestHeaderProps) => {
    const t = useTranslations()
    return (
        <div className={cn("flex min-w-0 items-center gap-2", className)}>
            <Avatar >
                <UserIcon aria-hidden focusable="false" className="size-5 shrink-0" />
            </Avatar>
            <Typography type="body-sm" color="muted">
                {t("nav.guestPrompt")}
            </Typography>
        </div>
    )
}

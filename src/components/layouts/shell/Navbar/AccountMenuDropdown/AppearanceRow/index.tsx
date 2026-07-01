"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    DarkLightModeSwitch,
} from "../DarkLightMode"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link AppearanceRow}.
 */
export type AppearanceRowProps = WithClassNames<undefined>

/**
 * Appearance row: label plus the dark/light mode switch.
 *
 * Presentational: composes the existing {@link DarkLightModeSwitch}. Theme
 * state lives inside the switch; no business logic here.
 * @param props - optional root class name
 */
export const AppearanceRow = ({ className }: AppearanceRowProps) => {
    const t = useTranslations()
    return (
        <div className={cn("flex items-center justify-between gap-3 py-3 px-4", className)}>
            <div className="text-sm">{t("nav.appearance")}</div>
            <DarkLightModeSwitch />
        </div>
    )
}

"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ModeSection } from "../ModeSection"
import { AccentSection } from "../AccentSection"
import { EffectSection } from "../EffectSection"

/**
 * AppearanceSection — the "Giao diện" block of the settings page: theme mode
 * (next-themes), accent colour (`data-accent` on `<html>`) and the ambient
 * background effect. Every control applies live and persists on its own — no
 * save button. Replaces the former global AppearanceModal, which was opened by
 * a bare palette button in the navbar.
 */
export const AppearanceSection = () => {
    const t = useTranslations()
    return (
        <section className="flex max-w-xl flex-col gap-6">
            <Typography type="h6" weight="bold">
                {t("appearance.title")}
            </Typography>
            <ModeSection />
            <AccentSection />
            <EffectSection />
        </section>
    )
}

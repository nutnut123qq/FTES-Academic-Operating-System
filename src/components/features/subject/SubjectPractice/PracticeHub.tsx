"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import {
    CardsIcon,
    CodeIcon,
    RankingIcon,
    TargetIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { PracticeModule, PracticeModuleKey } from "../hooks/useQuerySubjectPracticeSwr"

/** icon per module (confirmed-compiling phosphor set). */
const ICONS: Record<PracticeModuleKey, React.ReactNode> = {
    quiz: <TargetIcon className="size-6" aria-hidden focusable="false" />,
    flashcards: <CardsIcon className="size-6" aria-hidden focusable="false" />,
    coding: <CodeIcon className="size-6" aria-hidden focusable="false" />,
    leaderboard: <RankingIcon className="size-6" aria-hidden focusable="false" />,
}

/** Props for {@link PracticeHub}. */
export interface PracticeHubProps {
    /** Module shells (with headline counts) rendered as the 2×2 card grid. */
    modules: Array<PracticeModule>
    /** Fired with the module key when its "Open" pill / card is pressed. */
    onOpen: (key: PracticeModuleKey) => void
}

/**
 * Practice hub — a 2×2 card grid of the four practice modules (Quiz · Flashcards ·
 * Coding challenges · Leaderboard). Each card carries an icon, title, a headline count
 * and an "Open" pill; pressing it (or the card) calls {@link PracticeHubProps.onOpen}
 * with that module's key so the parent swaps to the module's in-panel sub-view. No dead
 * buttons — every card opens something.
 */
export const PracticeHub = ({ modules, onOpen }: PracticeHubProps) => {
    const t = useTranslations("subjects")

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {modules.map((module) => (
                <div
                    key={module.key}
                    className="flex flex-col gap-3 rounded-2xl border border-separator p-4"
                >
                    <span className="text-accent">{ICONS[module.key]}</span>
                    <div className="flex flex-col gap-0">
                        <Typography type="body" weight="medium">
                            {t(`practice.modules.${module.key}.title`)}
                        </Typography>
                        <Typography type="body-sm" color="muted">
                            {t(`practice.modules.${module.key}.meta`, { count: module.count })}
                        </Typography>
                    </div>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="self-start"
                        onPress={() => onOpen(module.key)}
                    >
                        {t("practice.cta")}
                    </Button>
                </div>
            ))}
        </div>
    )
}

"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import {
    TargetIcon,
    BookOpenIcon,
    SparkleIcon,
    ChartBarIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import {
    useQuerySubjectPracticeSwr,
    type PracticeModuleKey,
} from "../hooks/useQuerySubjectPracticeSwr"

// ponytail: icons are provisional (confirmed-compiling set) — refine per-module when
// the Practice tab gets its own brainstorm.
const ICONS: Record<PracticeModuleKey, React.ReactNode> = {
    quiz: <TargetIcon className="size-6" />,
    flashcards: <BookOpenIcon className="size-6" />,
    coding: <SparkleIcon className="size-6" />,
    leaderboard: <ChartBarIcon className="size-6" />,
}

/**
 * Practice tab (§3 → §10/§11). DEFAULT on-canon layout (no dedicated brainstorm):
 * a card grid of 4 module shells (quiz · flashcards · coding · leaderboard), each
 * with a headline count + an Open CTA. Mock data; cards hand-rolled for the
 * scaffold (swap to a card block when this tab gets its own brainstorm).
 */
export const SubjectPractice = () => {
    const t = useTranslations("subjects")
    const { subjectId } = useParams<{ subjectId: string }>()
    const { modules } = useQuerySubjectPracticeSwr(subjectId)

    return (
        <div className="flex flex-col gap-3 p-6">
            <Typography type="h5" weight="bold">
                {t("practice.title")}
            </Typography>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {modules.map((module) => (
                    <div
                        key={module.key}
                        className="flex flex-col gap-3 rounded-3xl border border-separator p-4"
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
                        <Button size="sm" variant="secondary" className="self-start">
                            {t("practice.cta")}
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}

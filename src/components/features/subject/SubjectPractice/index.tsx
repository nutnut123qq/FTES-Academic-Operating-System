"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { ArrowLeftIcon, SparkleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import {
    useQuerySubjectPracticeSwr,
    type PracticeModuleKey,
} from "../hooks/useQuerySubjectPracticeSwr"
import { PracticeHub } from "./PracticeHub"
import { CodingChallengeList } from "./CodingChallengeList"

/** The in-panel view: the hub, or one opened module. */
type PracticeView = "hub" | PracticeModuleKey

/**
 * Practice tab (§3 → §9 checklist). A practice HUB whose module cards open their own
 * in-panel sub-view (view-state navigation — no dead buttons). The Coding module is the
 * built-out one: a LeetCode-style problem bank ({@link CodingChallengeList}) with filters
 * + a problem detail/attempt surface. The other three modules (Quiz · Flashcards ·
 * Leaderboard) open a "coming soon" placeholder for now — a coherent first version, the
 * foundation for a future PE exam bank. Mock data via `useQuerySubjectPracticeSwr`.
 */
export const SubjectPractice = () => {
    const t = useTranslations("subjects")
    const { subjectId } = useParams<{ subjectId: string }>()
    const { modules } = useQuerySubjectPracticeSwr(subjectId)
    const [view, setView] = useState<PracticeView>("hub")

    // the coding bank owns its whole panel (list + detail)
    if (view === "coding") {
        return (
            <div className="p-6">
                <CodingChallengeList subjectId={subjectId} onBack={() => setView("hub")} />
            </div>
        )
    }

    // quiz / flashcards / leaderboard — placeholder sub-views (clickable, not dead)
    if (view !== "hub") {
        return (
            <div className="flex flex-col gap-4 p-6">
                <Button size="sm" variant="tertiary" className="self-start" onPress={() => setView("hub")}>
                    <ArrowLeftIcon aria-hidden focusable="false" className="size-4" />
                    {t("practice.backToHub")}
                </Button>
                <EmptyContent
                    icon={<SparkleIcon aria-hidden focusable="false" className="size-8 text-muted" />}
                    title={t(`practice.modules.${view}.title`)}
                    description={t("practice.comingSoon")}
                />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3 p-6">
            <Typography type="h5" weight="bold">
                {t("practice.title")}
            </Typography>
            <PracticeHub modules={modules} onOpen={(key) => setView(key)} />
        </div>
    )
}

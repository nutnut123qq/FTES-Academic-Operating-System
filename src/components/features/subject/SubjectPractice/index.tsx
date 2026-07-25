"use client"

import React, { useState } from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import {
    useQuerySubjectPracticeSwr,
    type PracticeModuleKey,
} from "../hooks/useQuerySubjectPracticeSwr"
import { PracticeHub } from "./PracticeHub"
import { PracticeAiHandoff } from "./PracticeAiHandoff"
import { CodingChallengeList } from "./CodingChallengeList"
import { PracticeFlashcards } from "./PracticeFlashcards"
import { PracticeLeaderboard } from "./PracticeLeaderboard"

/** The in-panel view: the hub, or one opened module. */
type PracticeView = "hub" | PracticeModuleKey

/**
 * Practice tab (§3 → §9 checklist). A practice HUB whose module cards open their own
 * in-panel sub-view (view-state navigation — no dead buttons).
 *
 * - **Coding** — the real challenge bank ({@link CodingChallengeList}: `GET /challenges`
 *   + run/submit against `/ai/coding/*` and `/challenges/{id}/submissions`).
 * - **Flashcards** — the SM-2 reviewer; the BE ships no curated per-subject deck yet, so
 *   its empty state hands over to the AI Flashcards generator.
 * - **Leaderboard** — the subject leaderboard.
 * - **Quiz** — no BE quiz bank exists; the card opens a handoff to the AI Quiz tool
 *   instead of a dead "coming soon".
 */
export const SubjectPractice = () => {
    const t = useTranslations("subjects")
    const router = useRouter()
    const { subjectId } = useParams<{ subjectId: string }>()
    const { modules } = useQuerySubjectPracticeSwr(subjectId)
    const [view, setView] = useState<PracticeView>("hub")

    const backToHub = () => setView("hub")
    /** The subject's AI tools tab hosts the AI Quiz / AI Flashcards generators. */
    const openAiTools = () => router.push(`/subjects/${subjectId}/ai`)

    // the coding bank owns its whole panel (list + detail)
    if (view === "coding") {
        return (
            <div className="p-6">
                <CodingChallengeList subjectId={subjectId} onBack={backToHub} />
            </div>
        )
    }

    // flashcards — SM-2 reviewer; empty deck hands over to the AI generator
    if (view === "flashcards") {
        return (
            <PracticeFlashcards
                subjectId={subjectId}
                onBack={backToHub}
                onOpenAiTools={openAiTools}
            />
        )
    }

    // leaderboard — a compact leaderboard (podium + ranked list + XP bars)
    if (view === "leaderboard") {
        return <PracticeLeaderboard subjectId={subjectId} onBack={backToHub} />
    }

    // quiz — the BE has no quiz bank (deferred); hand over to the AI Quiz tool
    if (view === "quiz") {
        return (
            <PracticeAiHandoff
                title={t("practice.modules.quiz.title")}
                description={t("practice.quizHandoff.description")}
                ctaLabel={t("practice.quizHandoff.cta")}
                onOpenAiTools={openAiTools}
                onBack={backToHub}
            />
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

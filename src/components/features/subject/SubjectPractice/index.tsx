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
import { CodingChallengeList } from "./CodingChallengeList"
import { PracticeFlashcards } from "./PracticeFlashcards"
import { PracticeLeaderboard } from "./PracticeLeaderboard"
import { PracticeQuiz } from "./PracticeQuiz"

/** The in-panel view: the hub, or one opened module. */
type PracticeView = "hub" | PracticeModuleKey

/**
 * Practice tab (§3 → §9 checklist). A practice HUB whose module cards open their own
 * in-panel sub-view (view-state navigation — no dead buttons).
 *
 * - **Quiz** — the subject's question bank ({@link PracticeQuiz}: `GET/POST
 *   /subjects/{code}/practice/quiz`, graded server-side).
 * - **Flashcards** — the SM-2 reviewer over the subject's curated decks, with the
 *   review state persisted server-side.
 * - **Coding** — the real challenge bank ({@link CodingChallengeList}: `GET /challenges`
 *   + run/submit against `/ai/coding/*` and `/challenges/{id}/submissions`).
 * - **Leaderboard** — the subject leaderboard.
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

    // flashcards — SM-2 reviewer over the curated decks (progress persists server-side)
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

    // quiz — draw from the subject question bank, answer, submit (graded server-side)
    if (view === "quiz") {
        return (
            <PracticeQuiz
                subjectId={subjectId}
                onBack={backToHub}
                onOpenAiTools={openAiTools}
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

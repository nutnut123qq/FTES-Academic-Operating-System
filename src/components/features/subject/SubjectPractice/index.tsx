"use client"

import React, { useState } from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import {
    useQuerySubjectPracticeSwr,
    type PracticeModuleKey,
} from "../hooks/useQuerySubjectPracticeSwr"
import { PracticeHub } from "./PracticeHub"
import { CodingChallengeList } from "./CodingChallengeList"
import { ExamList } from "./ExamList"
import { PracticeLeaderboard } from "./PracticeLeaderboard"

/** The in-panel view: the hub, or one opened module. */
type PracticeView = "hub" | PracticeModuleKey

/**
 * Practice tab (§3 → §9 checklist). A practice HUB whose module cards open their own
 * in-panel sub-view (view-state navigation — no dead buttons).
 *
 * - **Coding** — the real challenge bank ({@link CodingChallengeList}:
 *   `GET /challenges?subjectId=` + run/submit against `/ai/coding/*` and
 *   `/challenges/{id}/submissions`). **Practical Exam (PE) papers live here now**, tagged
 *   `pe` + the subject code: the learner filters the bank by that tag and READS the paper
 *   on the challenge page. There is no PE card and no PE answer upload — grading is
 *   locked.
 * - **FE — Final Exam** — the subject's exam albums (`GET /resources?subjectId=&type=FE`);
 *   an album opens its own route: up to 50 pictures, each with its own comment thread.
 * - **Leaderboard** — the subject leaderboard.
 *
 * The AI quiz / AI flashcard generators are a DIFFERENT surface and stay where they are
 * (the subject's AI tools tab) — they were never these cards.
 */
export const SubjectPractice = () => {
    const t = useTranslations("subjects")
    const { subjectId } = useParams<{ subjectId: string }>()
    const { modules } = useQuerySubjectPracticeSwr(subjectId)
    const [view, setView] = useState<PracticeView>("hub")

    const backToHub = () => setView("hub")

    // the coding bank owns its whole panel (list + detail)
    if (view === "coding") {
        return (
            <div className="p-6">
                <CodingChallengeList subjectId={subjectId} onBack={backToHub} />
            </div>
        )
    }

    // leaderboard — a compact leaderboard (podium + ranked list + XP bars)
    if (view === "leaderboard") {
        return <PracticeLeaderboard subjectId={subjectId} onBack={backToHub} />
    }

    // FE — the exam album list (a row routes to the album's own page)
    if (view === "fe") {
        return <ExamList subjectId={subjectId} kind="fe" onBack={backToHub} />
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

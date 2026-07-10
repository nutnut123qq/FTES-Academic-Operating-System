"use client"

import React, { useState } from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { SegmentedControl } from "@/components/blocks/navigation/SegmentedControl"
import type { ScorecardView, SessionDrawView, SessionView } from "@/modules/api/rest/mockinterview"
import { GreenRoom } from "./GreenRoom"
import { SessionRunner } from "./SessionRunner"
import { Scorecard } from "./Scorecard"
import { HistoryPanel } from "./HistoryPanel"
import { StatsPanel } from "./StatsPanel"

type Tab = "practice" | "history" | "stats"
type Phase = "greenroom" | "session" | "scorecard"

/** Active session context — from a fresh draw (empty turns) or a resumed in-progress session. */
export interface ActiveSession {
    sessionId: string
    seedTopics: SessionView["seedTopics"]
    initialTurns: SessionView["turns"]
    initialIndex: number
    deadlineAt: string
}

/**
 * Mock interview practice surface (feature root) — green room → text session → scorecard,
 * plus history + stats tabs. Reads `courseId` from the route; the enrolled-gate is enforced
 * by the backend (a 403 on draw shows an enroll CTA in {@link GreenRoom}).
 */
export const MockInterview = () => {
    const t = useTranslations("learn")
    const { courseId } = useParams<{ courseId: string }>()
    const [tab, setTab] = useState<Tab>("practice")
    const [phase, setPhase] = useState<Phase>("greenroom")
    const [active, setActive] = useState<ActiveSession | null>(null)
    const [scorecard, setScorecard] = useState<ScorecardView | null>(null)

    const startFromDraw = (draw: SessionDrawView) => {
        setActive({
            sessionId: draw.sessionId,
            seedTopics: draw.seedTopics,
            initialTurns: [],
            initialIndex: 0,
            deadlineAt: draw.deadlineAt,
        })
        setScorecard(null)
        setPhase("session")
    }

    const resumeFrom = (session: SessionView) => {
        setActive({
            sessionId: session.id,
            seedTopics: session.seedTopics,
            initialTurns: session.turns,
            initialIndex: session.questionIndex,
            deadlineAt: session.deadlineAt,
        })
        setScorecard(null)
        setPhase("session")
    }

    const handleGraded = (card: ScorecardView) => {
        setScorecard(card)
        setPhase("scorecard")
    }

    const restart = () => {
        setActive(null)
        setScorecard(null)
        setPhase("greenroom")
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <Typography type="h4">{t("mockInterview.title")}</Typography>
                <Typography type="body-sm" color="muted">{t("mockInterview.subtitle")}</Typography>
            </div>

            <SegmentedControl<Tab>
                ariaLabel={t("mockInterview.tabsLabel")}
                value={tab}
                onChange={setTab}
                items={[
                    { value: "practice", label: t("mockInterview.tabPractice") },
                    { value: "history", label: t("mockInterview.tabHistory") },
                    { value: "stats", label: t("mockInterview.tabStats") },
                ]}
            />

            {tab === "practice" ? (
                phase === "greenroom" ? (
                    <GreenRoom courseId={courseId} onStarted={startFromDraw} onResume={resumeFrom} />
                ) : phase === "session" && active ? (
                    <SessionRunner session={active} onGraded={handleGraded} onCancel={restart} />
                ) : phase === "scorecard" && scorecard ? (
                    <Scorecard scorecard={scorecard} onRetry={restart} />
                ) : null
            ) : tab === "history" ? (
                <HistoryPanel courseRef={courseId} />
            ) : (
                <StatsPanel courseRef={courseId} />
            )}
        </div>
    )
}

export default MockInterview

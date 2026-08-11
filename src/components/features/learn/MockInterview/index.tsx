"use client"

import React, { useState } from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { SegmentedControl } from "@/components/blocks/navigation/SegmentedControl"
import type { ScorecardView, SessionDrawView, SessionView } from "@/modules/api/rest/mockinterview"
import { useQueryLearnCourseSwr } from "../hooks/useQueryLearnCourseSwr"
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
 * plus history + stats tabs. The enrolled-gate is enforced by the backend (a 403 on draw
 * shows an enroll CTA in {@link GreenRoom}).
 *
 * ⚠️ The route param `courseId` is the course **slug** (`/courses/{slug}/learn/…`), but every
 * mock-interview endpoint takes `courseRef` = the RAW `course.id` UUID (the backend resolves
 * enrolment with `enrollments.findByUserIdAndCourseId(userId, courseRef)`, which never matches
 * a slug → a bogus `MOCK_INTERVIEW_FORBIDDEN` "you are not enrolled" for enrolled learners).
 * So the raw id is resolved from the course detail here and passed down; the slug is only used
 * for FE routing. `courseRef` is empty while the detail loads — every child's SWR key gates on
 * it, so nothing fires with a blank ref.
 */
export const MockInterview = () => {
    const t = useTranslations("learn")
    const router = useRouter()
    const { courseId } = useParams<{ courseId: string }>()
    const { course } = useQueryLearnCourseSwr(courseId)
    // `useQueryLearnCourseSwr` falls its `id` back to the ROUTE PARAM (the slug) when the detail
    // response has no `course` — which is exactly the value that reproduces the original bug
    // (BE matches `courseRef` against `course.courses.id`, so a slug silently reads as "not
    // enrolled"). A real id is a UUID and can never equal the slug, so treat that collision as
    // "not resolved yet" rather than passing the slug on.
    const resolvedId = course?.id ?? ""
    const courseRef = resolvedId === courseId ? "" : resolvedId
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
        // Push the session id into the URL so the scorecard is refresh-safe / shareable.
        if (active?.sessionId) {
            router.push(`/courses/${courseId}/learn/mock-interview/${active.sessionId}`)
        }
        // Keep local state for the brief transition and as a fallback.
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
                    <GreenRoom courseRef={courseRef} onStarted={startFromDraw} onResume={resumeFrom} />
                ) : phase === "session" && active ? (
                    <SessionRunner session={active} onGraded={handleGraded} onCancel={restart} />
                ) : phase === "scorecard" && scorecard ? (
                    <Scorecard scorecard={scorecard} onRetry={restart} />
                ) : null
            ) : tab === "history" ? (
                <HistoryPanel courseRef={courseRef} />
            ) : (
                <StatsPanel courseRef={courseRef} />
            )}
        </div>
    )
}

export default MockInterview

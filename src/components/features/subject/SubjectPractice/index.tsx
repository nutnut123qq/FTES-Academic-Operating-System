"use client"

import React, { useState } from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import {
    useQuerySubjectPracticeSwr,
    type PracticeModuleKey,
} from "../hooks/useQuerySubjectPracticeSwr"
import { PracticeHub } from "./PracticeHub"
import { CodingChallengeList } from "./CodingChallengeList"
import { ExamList } from "./ExamList"

/** The in-panel view: the hub, or one opened module. */
type PracticeView = "hub" | PracticeModuleKey

/**
 * Practice tab (§3 → §9 checklist). A practice HUB whose module cards open their own
 * in-panel sub-view (view-state navigation — no dead buttons).
 *
 * - **Coding** — the real challenge bank ({@link CodingChallengeList}:
 *   `GET /challenges?subjectId=` + run/submit against `/ai/coding/*` and
 *   `/challenges/{id}/submissions`). **Practical Exam (PE) papers live here now**, tagged
 *   `pe` + the subject code: the learner filters the bank by that tag and opens the paper
 *   in place. There is no PE card and no PE answer upload — grading is
 *   locked.
 * - **FE — Final Exam** — the subject's exam albums (`GET /resources?subjectId=&type=FE`);
 *   an album opens its own route: up to 50 pictures, each with its own comment thread.
 *
 * There is no Leaderboard module here any more (removed 2026-08-19) — the subject's XP
 * board is read from the Statistics tab, and the global board owns `/leaderboard`.
 *
 * The AI quiz / AI flashcard generators are a DIFFERENT surface and stay where they are
 * (the subject's AI tools tab) — they were never these cards.
 */
export const SubjectPractice = () => {
    const t = useTranslations("subjects")
    const { subjectId } = useParams<{ subjectId: string }>()
    // `error` + `isLoading` phải đi cùng `modules`: hook nay NÉM khi không đọc được môn
    // (hoặc không đọc được kho challenge) thay vì nuốt thành count = 0. Không bắt lấy
    // thì hub sẽ render một lưới RỖNG — mất sạch lối vào FE/Coding/Bảng xếp hạng mà
    // không nói vì sao. Đọc hỏng phải hiện lỗi + nút Thử lại, giống hệt danh sách bài.
    const { modules, isLoading, error, mutate } = useQuerySubjectPracticeSwr(subjectId)
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

    // FE — the exam album list (a row routes to the album's own page)
    if (view === "fe") {
        return <ExamList subjectId={subjectId} kind="fe" onBack={backToHub} />
    }

    return (
        <div className="flex flex-col gap-3 p-6">
            <Typography type="h5" weight="bold">
                {t("practice.title")}
            </Typography>
            <AsyncContent
                isLoading={isLoading && modules.length === 0}
                skeleton={<PracticeHubSkeleton />}
                error={modules.length === 0 ? error : undefined}
                errorContent={{
                    title: t("practice.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("practice.retry"),
                }}
            >
                <PracticeHub modules={modules} onOpen={(key) => setView(key)} />
            </AsyncContent>
        </div>
    )
}

/** Skeleton của lưới hub — hai thẻ module, đúng khung `PracticeHub` để không nhảy layout. */
const PracticeHubSkeleton = () => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
    </div>
)

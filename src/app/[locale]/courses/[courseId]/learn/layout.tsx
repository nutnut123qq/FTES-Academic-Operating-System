"use client"

import React, { PropsWithChildren } from "react"
import { useTranslations } from "next-intl"
import { useSelectedLayoutSegments } from "next/navigation"
import { LearnShell } from "@/components/features/learn/LearnShell"
import { ContentMap } from "@/components/features/learn/ContentMap"
import { OnThisPage } from "@/components/features/learn/OnThisPage"
import { LearnToolsRail } from "@/components/features/learn/LearnToolsRail"
import { ContentAiFab } from "@/components/features/learn/ContentAiFab"
import { ContentAiAnchoredChat } from "@/components/features/learn/ContentAiChat/ContentAiAnchoredChat"
import { ContentAiSelectionAsk } from "@/components/features/learn/LessonReader/ContentAiSelectionAsk"
import { ResizableRail } from "@/components/blocks/layout/ResizableRail"
import { useLearnSidebarStore } from "@/hooks/zustand/learnSidebar/store"

/**
 * Learn shell layout (StarCI port). Owns the 3-rail composition so every learn
 * surface reads consistently: the persistent LEFT content rail, the reading
 * column, and the RIGHT on-this-page outline — decided here per sub-route instead
 * of each feature redrawing its own grid.
 *
 *  - content / modules (reader + dashboard) → ContentMap on the LEFT.
 *  - lesson reader (a real `contents/<id>` route, not a challenge) → OnThisPage on the RIGHT.
 *  - leaderboard → no rail (a single XP board, full width).
 *  - mind-map → full-bleed, no rails.
 *
 * The floating "Ask FTES AI" button and the selection-anchored "Ask AI about
 * this" entry mount once here (they self-hide when no lesson is open), so they
 * are shared across the reader routes.
 *
 * The ambient backdrop is owned app-wide by `InnerLayout`, which renders it here
 * too but at reading weight (`recessed`), so this layout only owns the rail
 * composition + width.
 */
const LearnLayout = ({ children }: PropsWithChildren) => {
    const t = useTranslations("learn")
    const segments = useSelectedLayoutSegments()
    const { collapsed } = useLearnSidebarStore()

    const isContent = segments[0] === "content"
    const isModules = segments.includes("modules")
    const isChallenge = segments.includes("challenges")
    const isMindMap = segments[0] === "mind-map"
    const isMockInterview = segments[0] === "mock-interview"
    // the lesson reader is a real `contents/<id>` route (not the challenge sub-route)
    const isLessonReader = isModules && segments.includes("contents") && !isChallenge
    // the content dashboard = the course "home" (content route, not a lesson/module page)
    const isContentDashboard = isContent && !isModules

    // sticky, viewport-tall rail chrome (hidden below lg — mobile stacks the content).
    // KHÔNG thêm `relative`: utility đó THẮNG `lg:sticky` (cùng lớp utility, `relative`
    // đứng sau trong CSS xuất ra) → rail hoá `position: relative` + `top: 64px`, tức bị
    // ĐẨY XUỐNG 64px để lại một dải trắng dưới header, và cũng không dính khi cuộn.
    // `sticky` tự nó đã là positioned element nên tay kéo `absolute` của ResizableRail
    // vẫn neo đúng — không cần `relative`.
    const railClass =
        "hidden shrink-0 lg:sticky lg:top-16 lg:flex lg:h-[calc(100dvh-4rem)] lg:flex-col lg:self-start lg:border-r lg:border-default"

    // Collapsing the content-map rail on the lesson reader widens the reading column.
    // The toggle lives in the reader header; the layout simply reads the shared store.
    const showContentMap = (isContent || isModules) && !(collapsed && isLessonReader)
    const leftRail = showContentMap ? (
        <ResizableRail
            className={railClass}
            storageKey="ftes.learn.contentMap.width"
            defaultWidth={320}
            minWidth={256}
            maxWidth={480}
            ariaLabel={t("contentMap.resizeRail")}
        >
            <ContentMap className="min-h-0 lg:flex-1" />
        </ResizableRail>
    ) : undefined

    // The dashboard keeps its menu on the left. A lesson moves it to the far right,
    // after the outline, so the reading path stays content map → lesson → outline → menu.
    const navRail = isContentDashboard ? <LearnToolsRail /> : undefined

    // right rail: on-this-page outline on the lesson reader ONLY. The content
    // dashboard has no right rail now — its tools moved to the far-left navRail.
    const rightRail = isLessonReader ? (
        <>
            <OnThisPage />
            <LearnToolsRail side="right" />
        </>
    ) : undefined

    return (
        <>
            {/* floating "Ask FTES AI" mascot + selection-anchored ask (self-hide when no lesson).
                On desktop the ask opens the anchored panel; mobile keeps the FAB bottom-sheet. */}
            <ContentAiFab />
            <ContentAiSelectionAsk />
            <ContentAiAnchoredChat />
            <LearnShell navRail={navRail} leftRail={leftRail} rightRail={rightRail} fullBleed={isMindMap || isMockInterview}>
                {children}
            </LearnShell>
        </>
    )
}

export default LearnLayout

import React from "react"
import { QuestBoard } from "@/components/features/gamification/QuestBoard"
import { GamificationEventHost } from "@/components/features/gamification/GamificationEventHost"

/** `/quests` — the daily quest board: today's quests, coins earned, wallet
 *  balance and per-quest CTAs to the earning surface (§ gamification).
 *
 *  Mounts {@link GamificationEventHost} so a quest completed while the user is on
 *  the board itself surfaces a toast (the LeaderboardShell mount only covers the
 *  leaderboard page — the two page trees don't nest, so there's no double-toast). */
const Page = () => (
    <>
        <QuestBoard />
        <GamificationEventHost />
    </>
)

export default Page

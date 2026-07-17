import type { ReactNode } from "react"
import { QUEST_FALLBACK_ICON, QUEST_ICON_MAP } from "@/components/features/gamification/QuestBoard/map"

/**
 * Icon for a quest row in the analytics widget, keyed by quest `code`. Reuses the
 * quest board's icon map so the widget and the `/quests` board stay visually in
 * sync; unknown codes fall back to the generic quest icon.
 *
 * @param code - the backend quest `code`
 * @returns the phosphor icon node for that quest
 */
export const dailyQuestIcon = (code: string): ReactNode => QUEST_ICON_MAP[code] ?? QUEST_FALLBACK_ICON

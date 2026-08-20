import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Regression — the three gamification chips share the account menu's bug and its fix.
 *
 * Same contract as `../AccountMenuAuthed/index.test.tsx`: the chips build locale-LESS
 * targets with `pathConfig().locale()`, which is only valid against the router from
 * `@/i18n/navigation`. Until 2026-08-20 this file imported `useRouter` from
 * `next/navigation`, so pressing a chip pushed `/profile/progress` with no locale segment.
 *
 * Both routers are mocked side by side and the test asserts WHICH one was pushed to,
 * because a test that mocks `@/i18n/navigation` cannot see the locale prefix at all
 * (see the docblock on `src/i18n/navigation.ts`) — the import source is the observable.
 *
 * Presentation is stubbed away (chip, async wrapper, skeleton); only the wiring matters.
 */

const i18nPush = vi.fn()
const legacyPush = vi.fn()
const close = vi.fn()

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "vi",
}))

vi.mock("@/i18n/navigation", () => ({
    useRouter: () => ({ push: i18nPush }),
}))

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: legacyPush }),
}))

vi.mock("@heroui/react", () => ({
    cn: (...values: Array<unknown>) => values.filter(Boolean).join(" "),
}))

vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <span />
    return { FireIcon: Icon, LightningIcon: Icon, TrophyIcon: Icon }
})

vi.mock("@/hooks/zustand/overlay/hooks", () => ({
    useAccountMenuOverlayState: () => ({ close }),
}))

vi.mock("@/components/features/gamification/hooks/useQueryMyGamificationSwr", () => ({
    useQueryMyGamificationSwr: () => ({
        data: { streak: { current: 3 }, rank: { position: 7 }, xp: 1200 },
        isLoading: false,
        error: undefined,
    }),
}))

vi.mock("@/components/blocks/gamification/GamificationChip", () => ({
    GamificationChip: ({ label, onPress }: { label?: string; onPress?: () => void }) => (
        <button type="button" data-testid={`chip-${label}`} onClick={onPress} />
    ),
}))

vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/components/blocks/skeleton/Skeleton", () => ({
    Skeleton: { Chip: () => <span /> },
}))

import { GamificationStatsRow } from "./index"

/** Chip translation key → the locale-LESS path it must hand to the i18n router. */
const CHIPS: ReadonlyArray<[string, string]> = [
    ["accountMenu.gamification.streakLabel", "/profile/progress"],
    ["accountMenu.gamification.rankLabel", "/leaderboard"],
    ["accountMenu.gamification.xpLabel", "/profile/progress"],
]

describe("GamificationStatsRow navigation", () => {
    it.each(CHIPS)("routes the %s chip through the locale-aware router", (label, path) => {
        i18nPush.mockClear()
        legacyPush.mockClear()

        render(<GamificationStatsRow />)
        fireEvent.click(screen.getByTestId(`chip-${label}`))

        expect(i18nPush.mock.calls).toEqual([[path]])
        expect(legacyPush).not.toHaveBeenCalled()
    })
})

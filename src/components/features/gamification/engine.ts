"use client"

// Deterministic, client-side mock gamification engine (§11). No backend yet
// (per CLAUDE.md): state persists to localStorage under `ftes.gamification.v1`
// and every surface (leaderboard, streak popover, avatar chip, profile,
// workspace) reads the SAME store so a streak/XP change reflects everywhere
// without a reload. Swap the store internals for a real BE query/mutation later;
// the `useGamificationEngine` API stays.
//
// All economics come from `./rules` — this file only sequences state changes.

import { useSyncExternalStore } from "react"
import {
    FREEZE,
    GOALS,
    GamificationActionType,
    REPAIR,
    STREAK_MILESTONES,
    applyMultiplier,
    isQualifyingAction,
    levelFromXp,
    quizXpForScore,
    repairCost,
    streakMultiplier,
    XP_TABLE,
} from "./rules"

/** localStorage key for the mock engine snapshot. */
const STORAGE_KEY = "ftes.gamification.v1"
/** How many weeks of activity the heatmap shows. */
export const HEATMAP_WEEKS = 12
const HEATMAP_DAYS = HEATMAP_WEEKS * 7

/** The per-day state of the streak heatmap. */
export enum DayStatus {
    /** No learning activity. */
    Empty = "empty",
    /** At least one learning action. */
    Active = "active",
    /** A missed day saved by a Streak Freeze. */
    Frozen = "frozen",
}

/** A single heatmap cell: an ISO date (yyyy-mm-dd) and its status. */
export interface HeatmapDay {
    /** ISO date, `yyyy-mm-dd`, local. */
    date: string
    /** Whether the day was active, frozen, or empty. */
    status: DayStatus
}

/** Info about a streak that was lost, kept for the repair window. */
export interface LostStreakInfo {
    /** Length of the streak that was lost. */
    days: number
    /** Epoch ms when the reset happened. */
    lostAt: number
}

/** The full persisted engine snapshot. */
export interface GamificationState {
    /** Total accumulated XP. */
    xp: number
    /** Current consecutive-day streak (learning days). */
    streak: number
    /** FTES coin balance (mock). */
    coin: number
    /** Streak Freezes in inventory (0..FREEZE.max). */
    freezes: number
    /** ISO date of the most recent qualifying (learning) day, or null. */
    lastActiveDate: string | null
    /** Map of ISO date → status for the heatmap window. */
    days: Record<string, DayStatus>
    /** Milestone day-values already awarded (never re-granted). */
    claimedMilestones: Array<number>
    /** Daily goal progress: ISO date + count of learning actions today. */
    daily: { date: string; count: number; claimed: boolean }
    /** Weekly goal: ISO Monday of the week + qualifying-days set + claimed flag. */
    weekly: { weekStart: string; days: Array<string>; claimed: boolean }
    /** Info about the last lost streak (for repair), or null. */
    lostStreak: LostStreakInfo | null
    /** ISO date the streak-at-risk reminder last fired. */
    reminderDate: string | null
}

/** ISO `yyyy-mm-dd` for a local date. */
const toIso = (date: Date): string => {
    const y = date.getFullYear()
    const m = `${date.getMonth() + 1}`.padStart(2, "0")
    const d = `${date.getDate()}`.padStart(2, "0")
    return `${y}-${m}-${d}`
}

/** Today's ISO date (local). */
const todayIso = (): string => toIso(new Date())

/** ISO date `offset` days before `from` (local). */
const shiftIso = (fromIso: string, offset: number): string => {
    const [y, m, d] = fromIso.split("-").map(Number)
    const date = new Date(y, m - 1, d + offset)
    return toIso(date)
}

/** Whole days between two ISO dates (`b - a`), local. */
const daysBetween = (aIso: string, bIso: string): number => {
    const [ay, am, ad] = aIso.split("-").map(Number)
    const [by, bm, bd] = bIso.split("-").map(Number)
    const a = new Date(ay, am - 1, ad).getTime()
    const b = new Date(by, bm - 1, bd).getTime()
    return Math.round((b - a) / 86_400_000)
}

/** ISO Monday of the week containing `iso` (Mon–Sun weeks). */
const weekStartIso = (iso: string): string => {
    const [y, m, d] = iso.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    const dow = (date.getDay() + 6) % 7 // Mon = 0
    return shiftIso(iso, -dow)
}

/** Seed snapshot: mirrors the previous mock (4820 XP / streak 7) so the UI stays stable. */
const seedState = (): GamificationState => {
    const today = todayIso()
    const days: Record<string, DayStatus> = {}
    // Paint the most recent 7 days active so the heatmap matches streak 7.
    for (let i = 0; i < 7; i += 1) {
        days[shiftIso(today, -i)] = DayStatus.Active
    }
    return {
        xp: 4820,
        streak: 7,
        coin: 320,
        freezes: 1,
        lastActiveDate: today,
        days,
        claimedMilestones: [7],
        daily: { date: today, count: 1, claimed: false },
        weekly: { weekStart: weekStartIso(today), days: [today], claimed: false },
        lostStreak: null,
        reminderDate: null,
    }
}

/** Trim the heatmap map to the visible window so localStorage does not grow forever. */
const pruneDays = (days: Record<string, DayStatus>): Record<string, DayStatus> => {
    const cutoff = shiftIso(todayIso(), -(HEATMAP_DAYS - 1))
    const out: Record<string, DayStatus> = {}
    for (const [date, status] of Object.entries(days)) {
        if (date >= cutoff) out[date] = status
    }
    return out
}

const load = (): GamificationState => {
    if (typeof window === "undefined") return seedState()
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return seedState()
        return JSON.parse(raw) as GamificationState
    } catch {
        return seedState()
    }
}

// ---- minimal external store (no extra dep; mirrors the overlay-store pattern) ----

let state: GamificationState = load()
const listeners = new Set<() => void>()

const persist = (): void => {
    if (typeof window === "undefined") return
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
        // storage full / disabled — mock, best-effort.
    }
}

const emit = (): void => {
    persist()
    listeners.forEach((l) => l())
}

const setState = (next: GamificationState): void => {
    state = next
    emit()
}

/** An event emitted by the engine for the caller to surface (toast / moment). */
export type GamificationEvent =
    | { kind: "xp"; amount: number; reasonKey: string }
    | { kind: "levelUp"; level: number }
    | { kind: "milestone"; days: number; badgeKey: string; coin: number }

/** Subscribers that want engine events (toast / moment surfaces). */
const eventListeners = new Set<(event: GamificationEvent) => void>()

const emitEvent = (event: GamificationEvent): void => {
    eventListeners.forEach((l) => l(event))
}

/**
 * Subscribe to one-shot engine events (XP awards, level-ups, milestones).
 *
 * @param listener - Called for each emitted event.
 * @returns An unsubscribe function.
 */
export const subscribeGamificationEvents = (listener: (event: GamificationEvent) => void): (() => void) => {
    eventListeners.add(listener)
    return () => eventListeners.delete(listener)
}

/** Award XP, emit an xp event, and emit a levelUp event if a threshold was crossed. */
const awardXp = (next: GamificationState, amount: number, reasonKey: string): void => {
    if (amount <= 0) return
    const before = levelFromXp(next.xp)
    next.xp += amount
    const after = levelFromXp(next.xp)
    emitEvent({ kind: "xp", amount, reasonKey })
    if (after > before) emitEvent({ kind: "levelUp", level: after })
}

/** Grant not-yet-claimed streak milestones for the current streak. */
const claimMilestones = (next: GamificationState): void => {
    for (const milestone of STREAK_MILESTONES) {
        if (next.streak >= milestone.days && !next.claimedMilestones.includes(milestone.days)) {
            next.claimedMilestones.push(milestone.days)
            next.coin += milestone.coin
            if (milestone.freeze) next.freezes = Math.min(FREEZE.max, next.freezes + milestone.freeze)
            emitEvent({ kind: "milestone", days: milestone.days, badgeKey: milestone.badgeKey, coin: milestone.coin })
        }
    }
}

/**
 * Roll the day forward: for each full day missed since the last activity,
 * consume a freeze (mark that day frozen, keep the streak) or reset the streak.
 * Idempotent — safe to call on every mount / focus.
 */
const rolloverInto = (next: GamificationState): void => {
    if (!next.lastActiveDate) return
    const gap = daysBetween(next.lastActiveDate, todayIso())
    if (gap <= 1) return // today or yesterday — streak still alive
    // Missed `gap - 1` full days. Save with freezes, then reset if any remain.
    for (let i = 1; i < gap; i += 1) {
        const missedIso = shiftIso(next.lastActiveDate, i)
        if (next.freezes > 0) {
            next.freezes -= 1
            next.days[missedIso] = DayStatus.Frozen
        } else {
            next.lostStreak = { days: next.streak, lostAt: Date.now() }
            next.streak = 0
            next.days = pruneDays(next.days)
            return
        }
    }
    // All missed days frozen — streak survives; advance the anchor to yesterday.
    next.lastActiveDate = shiftIso(todayIso(), -1)
    next.days = pruneDays(next.days)
}

/** Reset daily/weekly goal windows when the date/week changed. */
const rolloverGoals = (next: GamificationState): void => {
    const today = todayIso()
    if (next.daily.date !== today) next.daily = { date: today, count: 0, claimed: false }
    const week = weekStartIso(today)
    if (next.weekly.weekStart !== week) next.weekly = { weekStart: week, days: [], claimed: false }
}

/**
 * Record a gamification action. Awards XP (multiplied for learning actions),
 * advances the streak once per day, updates goals, and consumes past days.
 * The single mutation entry-point used by lesson/quiz/challenge/login flows.
 *
 * @param type - The action type.
 * @param meta - Optional metadata (`scorePercent` for quizzes).
 */
const recordAction = (type: GamificationActionType, meta?: { scorePercent?: number }): void => {
    const next: GamificationState = structuredClone(state)
    rolloverInto(next)
    rolloverGoals(next)
    const today = todayIso()

    if (isQualifyingAction(type)) {
        const firstToday = next.lastActiveDate !== today
        if (firstToday) {
            // New qualifying day → advance the streak by one (freezes already
            // handled by rollover; a reset earlier this call left streak at 0).
            next.streak += 1
            next.lastActiveDate = today
            next.days[today] = DayStatus.Active
            next.days = pruneDays(next.days)
            claimMilestones(next)
            // Weekly goal counts unique qualifying days.
            if (!next.weekly.days.includes(today)) next.weekly.days.push(today)
        }
        // Base XP (quiz is score-banded), multiplied by the CURRENT streak.
        const baseXp = type === GamificationActionType.QuizSubmit
            ? quizXpForScore(meta?.scorePercent ?? 0)
            : XP_TABLE[type]
        awardXp(next, applyMultiplier(baseXp, next.streak), `reasons.${type}`)

        // Daily goal counts learning actions (not unique days).
        next.daily.count += 1
        if (!next.daily.claimed && next.daily.count >= GOALS.daily.target) {
            next.daily.claimed = true
            awardXp(next, GOALS.daily.xp, "reasons.dailyGoal")
        }
        // Weekly goal: 5 qualifying days.
        if (!next.weekly.claimed && next.weekly.days.length >= GOALS.weekly.target) {
            next.weekly.claimed = true
            awardXp(next, GOALS.weekly.xp, "reasons.weeklyGoal")
        }
    } else {
        // Non-learning: flat XP, no multiplier, no streak (login/upvote/goal).
        awardXp(next, XP_TABLE[type], `reasons.${type}`)
    }

    setState(next)
}

/** Consume a coin balance to buy one freeze (blocked at the cap). Returns success. */
const buyFreeze = (): boolean => {
    if (state.freezes >= FREEZE.max) return false
    if (state.coin < FREEZE.cost) return false
    const next: GamificationState = structuredClone(state)
    next.coin -= FREEZE.cost
    next.freezes += 1
    setState(next)
    return true
}

/** Repair a lost streak within the 48h window. Returns success. */
const repairStreak = (): boolean => {
    const lost = state.lostStreak
    if (!lost) return false
    const withinWindow = Date.now() - lost.lostAt <= REPAIR.windowHours * 3_600_000
    if (!withinWindow) return false
    const cost = repairCost(lost.days)
    if (state.coin < cost) return false
    const next: GamificationState = structuredClone(state)
    next.coin -= cost
    next.streak = lost.days
    next.lastActiveDate = shiftIso(todayIso(), -1) // restore as if yesterday was active
    next.lostStreak = null
    setState(next)
    return true
}

/** Advance day state and fire the 20:00 streak-at-risk reminder once/day. Returns a reminder flag. */
const checkDayRollover = (): { remind: boolean; streak: number } => {
    const next: GamificationState = structuredClone(state)
    rolloverInto(next)
    rolloverGoals(next)
    const today = todayIso()
    const learnedToday = next.lastActiveDate === today
    const now = new Date()
    const remind =
        next.streak >= 3 &&
        !learnedToday &&
        now.getHours() >= 20 &&
        next.reminderDate !== today
    if (remind) next.reminderDate = today
    setState(next)
    return { remind, streak: next.streak }
}

/** Build the ordered heatmap (oldest → newest) for the visible window. */
const buildHeatmap = (snapshot: GamificationState): Array<HeatmapDay> => {
    const today = todayIso()
    const out: Array<HeatmapDay> = []
    for (let i = HEATMAP_DAYS - 1; i >= 0; i -= 1) {
        const date = shiftIso(today, -i)
        out.push({ date, status: snapshot.days[date] ?? DayStatus.Empty })
    }
    return out
}

const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

const getSnapshot = (): GamificationState => state
const getServerSnapshot = (): GamificationState => state

/**
 * React hook exposing the mock gamification engine: the live snapshot plus
 * derived values (level, multiplier, tier, heatmap, repair availability) and
 * the mutation actions. Every surface calls this so they stay in lockstep.
 *
 * @returns The engine snapshot, derived progression values, and actions.
 */
export const useGamificationEngine = () => {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
    const level = levelFromXp(snapshot.xp)
    const multiplier = streakMultiplier(snapshot.streak)
    const repairAvailable =
        snapshot.lostStreak !== null &&
        Date.now() - snapshot.lostStreak.lostAt <= REPAIR.windowHours * 3_600_000
    return {
        state: snapshot,
        level,
        multiplier,
        repairAvailable,
        repairCoinCost: snapshot.lostStreak ? repairCost(snapshot.lostStreak.days) : 0,
        heatmap: buildHeatmap(snapshot),
        recordAction,
        buyFreeze,
        repairStreak,
        checkDayRollover,
    }
}

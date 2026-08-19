import { MedalIcon, TrophyIcon } from "@phosphor-icons/react"

/**
 * The ONE fallback-glyph rule for a gamification badge — the sibling of
 * `badgeLabel.ts`, which owns the same question for the badge's NAME.
 *
 * A badge is drawn from its seeded ARTWORK (`iconUrl`) wherever it exists; this
 * map only answers what to draw when it does not. It lives here, next to the
 * label resolver, because the answer must be identical on every surface: the
 * profile achievement wall, the badge detail dialog, the catalog rows, the
 * profile Progress grid and the leaderboard badge strip all paint the same
 * badges, and a per-file copy of the mapping is exactly how the leaderboard
 * ended up drawing one hardcoded trophy for every badge while the profile
 * showed real art.
 *
 * Kinds are DATA (backend `kind` column), not a frontend enum — an unknown kind
 * seeded tomorrow must still render something, hence the medal default.
 */
const KIND_ICON: Record<string, typeof TrophyIcon> = {
    BADGE: MedalIcon,
    TITLE: MedalIcon,
    TROPHY: TrophyIcon,
}

/**
 * Fallback glyph for a badge with no seeded artwork.
 *
 * @param kind - the backend badge `kind`. Nullable/absent on purpose: the earned
 *   snapshot is mapped from payloads that may predate the field, and "no kind"
 *   must degrade to the same default as "kind the frontend has never heard of".
 * @returns A Phosphor icon component; the medal when the kind is unknown.
 */
export const badgeKindIcon = (kind: string | null | undefined): typeof TrophyIcon =>
    (kind ? KIND_ICON[kind] : undefined) ?? MedalIcon

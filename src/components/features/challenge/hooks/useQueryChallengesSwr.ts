"use client"

import useSWR from "swr"

import { listChallenges } from "@/modules/api/rest/challenges/challenges"
import type { ChallengeTagView, ChallengeView } from "@/modules/api/rest/challenges/types"

/** Domain of a challenge (drives the icon + type chip). */
export type ChallengeType = "coding" | "sql" | "uiux" | "ai" | "business" | "essay"

/**
 * A challenge in the catalog (§10). Maps the BE `ChallengeView`
 * (`GET /api/v1/challenges`). Fields the BE view does not carry (difficulty,
 * points, participant count) are intentionally absent — the UI hides them
 * rather than fabricate values.
 */
export interface Challenge {
    /** Routing id — the BE `slug`. The detail endpoint keys on slug, NOT the uuid. */
    id: string
    /** Human title, e.g. "Two Sum". */
    title: string
    /** Domain of the challenge (drives the icon + type chip). */
    type: ChallengeType
    /** Lifecycle status from the BE (`PUBLISHED` | `RUNNING` | `CLOSED`). */
    status: string
    /**
     * Tags carried by the challenge (`pe` + the subject code for a Practical Exam paper
     * folded into the bank). `[]` when the BE ships none.
     */
    tags: Array<ChallengeTagView>
}

/**
 * Lifecycle statuses that never belong on the learner catalog (the BE list already hides
 * them; this is the belt for the newer `PENDING_APPROVAL` contributed-paper state).
 */
const UNLISTED_STATUSES = new Set(["DRAFT", "PENDING_APPROVAL", "REJECTED"])

/**
 * Maps a BE challenge `type` string (`CODING`, `SQL`, `UI_UX`, `AI`, `BUSINESS`, `ESSAY`)
 * onto the FE domain union. Unknown/unset → `coding` (a reachable facet beats a
 * broken icon/label lookup).
 *
 * `ESSAY` phải nằm ở đây, không được rơi vào `default`: nhánh mặc định trả `"coding"`, mà
 * `ChallengeSolveSurface` lại chọn bề mặt làm bài THEO giá trị này — nên một đề tự luận
 * từng mở ra trình soạn CODE kèm bộ chọn ngôn ngữ, và nút nộp gửi đi
 * `{payloadType:"CODE"}`. Nhãn cũng nói dối theo: chip ghi "Lập trình" trên đề văn.
 *
 * Nhánh `default` GIỮ NGUYÊN là `"coding"` cho type BE thật sự chưa biết, nhưng mọi type BE
 * đã tồn tại thì phải khai tường minh — im lặng gộp về một dạng khác là cách bug này sinh ra.
 */
export const mapChallengeType = (raw: string | null | undefined): ChallengeType => {
    switch ((raw ?? "").toUpperCase().replace(/[\s_-]/g, "")) {
    case "SQL":
        return "sql"
    case "UIUX":
        return "uiux"
    case "AI":
        return "ai"
    case "BUSINESS":
        return "business"
    case "ESSAY":
        return "essay"
    case "CODING":
    default:
        return "coding"
    }
}

/** Maps one BE `ChallengeView` onto the catalog `Challenge` model. */
export const toChallenge = (view: ChallengeView): Challenge => ({
    id: view.slug,
    title: view.title,
    type: mapChallengeType(view.type),
    status: view.status,
    tags: view.tags ?? [],
})

/**
 * Builds the tag facet row of a challenge list.
 *
 * The facets NARROW to what still co-occurs with the current (AND) selection, and an
 * already-picked slug is always kept so it can be un-picked from an empty result.
 *
 * @param items - the rows currently returned.
 * @param selected - the slugs currently picked.
 * @returns `{slug,label}` facets, de-duplicated and sorted by label.
 */
export const collectCatalogTags = (
    items: Array<Challenge>,
    selected: Array<string> = [],
): Array<ChallengeTagView> => {
    const bySlug = new Map<string, string>()
    for (const slug of selected) {
        bySlug.set(slug, slug)
    }
    for (const item of items) {
        for (const tag of item.tags) {
            bySlug.set(tag.slug, tag.label || tag.slug)
        }
    }
    return [...bySlug.entries()]
        .map(([slug, label]) => ({ slug, label }))
        .sort((left, right) => left.label.localeCompare(right.label))
}

/**
 * Loads the challenge catalog from the real BE (`GET /api/v1/challenges?tags=`).
 *
 * @param tags - tag slugs every row must carry (AND semantics, server-side); omit for
 * the whole bank. PE exam papers are ordinary challenges tagged `pe` + the subject code,
 * so this is how the catalog surfaces them.
 */
export const useQueryChallengesSwr = (tags: Array<string> = []) => {
    // Sorted so the key does not depend on the order the chips were picked in.
    const tagKey = [...tags].sort().join(",")
    const { data, isLoading, error, mutate } = useSWR(["challenges", tagKey], async () => {
        const selected = tagKey ? tagKey.split(",") : []
        const views = await listChallenges({ tags: selected })
        return views
            .filter((view) => !UNLISTED_STATUSES.has(view.status))
            .map(toChallenge)
            // TRANSITIONAL BELT: `tags=` ships in a parallel BE lane. A deployment that
            // does not know the param ignores it and answers the whole bank, so re-check
            // the constraint here — a no-op once the BE honours it. Delete then.
            .filter((challenge) => {
                const slugs = new Set(challenge.tags.map((tag) => tag.slug))
                return selected.every((slug) => slugs.has(slug))
            })
    })
    return { challenges: data ?? [], isLoading, error, mutate }
}

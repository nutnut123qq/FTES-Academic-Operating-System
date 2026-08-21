"use client"

import useSWR from "swr"
import {
    listChallenges,
    type ChallengeTagView,
    type ChallengeView,
} from "@/modules/api/rest/challenges"
import { getSubjectDetail } from "@/modules/api/rest/subject"

/**
 * Challenge kinds, mirroring the BE `challenge.challenges.type` CHECK constraint
 * (`CODING`, `SQL`, `UIUX`, `AI`, `BUSINESS`).
 */
export const CHALLENGE_TYPES = ["CODING", "SQL", "UIUX", "AI", "BUSINESS", "ESSAY"] as const

/** One BE challenge type. */
export type ChallengeType = (typeof CHALLENGE_TYPES)[number]

/** BE type → the `subjects.practice.coding.types.*` i18n key suffix. */
const TYPE_KEYS: Record<string, string> = {
    CODING: "coding",
    ESSAY: "essay",
    SQL: "sql",
    UIUX: "uiux",
    AI: "ai",
    BUSINESS: "business",
}

/**
 * Resolves the i18n key suffix of a challenge type.
 *
 * @param type - the raw BE type.
 * @returns the known suffix, or `null` when the BE ships a type the FE has no label
 * for (callers then render the raw value instead of throwing on a missing key).
 */
export const challengeTypeKey = (type: string): string | null => TYPE_KEYS[type] ?? null

/** Coarse lifecycle bucket derived from `status` + the challenge time window. */
export type ChallengeLifecycle = "running" | "upcoming" | "closed"

/** All lifecycle buckets, in display order. */
export const CHALLENGE_LIFECYCLES: Array<ChallengeLifecycle> = ["running", "upcoming", "closed"]

/**
 * A challenge row of the practice bank — the honest projection of BE `ChallengeView`.
 *
 * NOTE: the backend carries no `difficulty`, no acceptance rate and no per-user solved
 * flag on the list payload, so those facets (mock-only before) are gone; type + lifecycle
 * replace them as filters.
 */
export interface CodingChallenge {
    id: string
    slug: string
    title: string
    /** Problem statement (markdown text from the BE `description`). */
    description: string
    /** Raw BE type (`CODING` | `SQL` | `UIUX` | `AI` | `BUSINESS` | future values). */
    type: string
    /** `INDIVIDUAL` | `TEAM`. */
    mode: string
    /** Raw lifecycle status (`PUBLISHED` | `RUNNING` | `CLOSED` | …). */
    status: string
    /** Derived bucket used by the list filter. */
    lifecycle: ChallengeLifecycle
    /** Owning subject id (UUID) or `null` for global challenges. */
    subjectId: string | null
    /** Thời điểm mở (ISO-8601). `null` = mở ngay, không hẹn giờ. */
    startsAt: string | null
    /** Thời điểm đóng (ISO-8601). `null` = KHÔNG giới hạn (không bao giờ tự đóng). */
    endsAt: string | null
    maxSubmissions: number
    /** Total submissions across all participants — the popularity signal for the "Hot" sort. */
    submissionCount: number
    /** Course-bank owner, when the challenge is scoped to a course. */
    courseId: string | null
    /**
     * Tags carried by the challenge (`pe` + the subject code for a Practical Exam paper
     * folded into the bank). Drives the tag filter row + the row chips; `[]` when the BE
     * ships none.
     */
    tags: Array<ChallengeTagView>
}

/**
 * Bank payload của một môn: CHỈ gồm challenge của chính môn đó.
 *
 * Không còn cờ `scoped`. Trước đây cờ này tồn tại vì hook có nhánh "môn rỗng → đổ cả
 * kho công khai", và màn hình phải treo banner xin lỗi vì đang chiếu đề của môn khác.
 * Nhánh đó đã bị bỏ (đề JPD113 phải là đề JPD113), nên không còn trạng thái nào để
 * mà báo — một danh sách rỗng giờ có nghĩa đúng nghĩa đen: môn này chưa có bài nào.
 */
export interface CodingChallengeBank {
    items: Array<CodingChallenge>
}

/**
 * Lifecycle statuses that are NOT a listable challenge. `PENDING_APPROVAL` joined
 * `DRAFT` / `REJECTED` when the bank started accepting contributed papers: the BE list
 * already hides them, and this guard keeps the learner surfaces honest if a deployment
 * ever leaks one. `ARCHIVED` is deliberately absent — it stays listed as `closed`, the
 * behaviour the bank has always had.
 */
const UNLISTED_STATUSES = new Set(["DRAFT", "PENDING_APPROVAL", "REJECTED"])

/**
 * Whether a challenge belongs on a learner-facing list.
 *
 * @param view - the BE challenge payload.
 * @returns `false` for a draft / pending-approval / rejected row, `true` otherwise.
 */
export const isListableChallenge = (view: ChallengeView): boolean =>
    !UNLISTED_STATUSES.has(view.status)

/**
 * Buckets a challenge by its status and time window.
 *
 * @param view - the BE challenge payload.
 * @param now - evaluation instant (ms) — injected so the mapping stays testable.
 * @returns `closed` for CLOSED/ARCHIVED or a past window, `upcoming` before the start,
 * `running` otherwise.
 */
export const lifecycleOf = (view: ChallengeView, now: number): ChallengeLifecycle => {
    if (view.status === "CLOSED" || view.status === "ARCHIVED") {
        return "closed"
    }
    const ends = Date.parse(view.endsAt ?? "")
    if (Number.isFinite(ends) && ends < now) {
        return "closed"
    }
    const starts = Date.parse(view.startsAt ?? "")
    if (Number.isFinite(starts) && starts > now) {
        return "upcoming"
    }
    return "running"
}

/**
 * Maps a BE `ChallengeView` to a bank row.
 *
 * @param view - the BE payload.
 * @param now - evaluation instant (ms) for the lifecycle bucket.
 * @returns the row rendered by the list / detail panel.
 */
export const mapChallengeView = (view: ChallengeView, now: number): CodingChallenge => ({
    id: view.id,
    slug: view.slug,
    title: view.title,
    description: view.description ?? "",
    type: view.type,
    mode: view.mode,
    status: view.status,
    lifecycle: lifecycleOf(view, now),
    subjectId: view.subjectId ?? null,
    startsAt: view.startsAt,
    endsAt: view.endsAt,
    maxSubmissions: view.maxSubmissions,
    submissionCount: view.submissionCount ?? 0,
    courseId: view.courseId ?? null,
    tags: view.tags ?? [],
})

/**
 * Maps a page of BE views onto listable bank rows (drops the non-visible statuses).
 *
 * @param views - the raw list payload (nullable — a degraded read hands back `null`).
 * @param now - evaluation instant (ms) for the lifecycle bucket.
 * @returns the rows to render.
 */
export const toBankRows = (
    views: Array<ChallengeView> | null | undefined,
    now: number,
): Array<CodingChallenge> =>
    (views ?? []).filter(isListableChallenge).map((view) => mapChallengeView(view, now))

/**
 * TRANSITIONAL BELT over the server-side `subjectId` / `tags` narrowing.
 *
 * The two query params ship in a parallel BE lane. A deployment that does not know them
 * yet ignores them silently and answers the WHOLE bank — which would show every subject's
 * challenges under one subject's Practice tab, labelled as that subject's own. Re-checking
 * the constraint on the rows costs nothing when the BE honours the params (it drops
 * nothing) and keeps the surface truthful when it does not.
 *
 * ĐỪNG XOÁ NHẦM đây tưởng là nhánh fallback "môn rỗng → đổ cả kho" (nhánh đó đã bị bỏ).
 * Đây là chiều NGƯỢC LẠI: nó CHẶN kho toàn cục tràn vào khi BE cũ bỏ qua param. Từ khi
 * banner cảnh báo bị gỡ, bỏ đai này còn tệ hơn trước: cả kho lại tràn vào trang môn mà
 * lần này KHÔNG còn một dòng nào nói cho người học biết. Chỉ xoá khi MỌI deployment đã
 * phục vụ `subjectId`/`tags`.
 *
 * @param items - the rows the list endpoint answered with.
 * @param subjectUuid - the subject the rows were asked for, or `null` for the global bank.
 * @param tags - the tag slugs the rows must ALL carry.
 * @returns the rows that actually satisfy the requested narrowing.
 */
export const narrowBankRows = (
    items: Array<CodingChallenge>,
    subjectUuid: string | null,
    tags: Array<string>,
): Array<CodingChallenge> =>
    items.filter((item) => {
        if (subjectUuid && item.subjectId !== subjectUuid) {
            return false
        }
        const slugs = new Set(item.tags.map((tag) => tag.slug))
        return tags.every((slug) => slugs.has(slug))
    })

/**
 * Builds the tag facet row from the rows currently on screen.
 *
 * Two rules make the row usable while filtering with AND semantics:
 * - the facets NARROW to what still co-occurs with the current selection (picking `pe`
 *   leaves the subject codes that actually have PE papers, not every tag in the bank);
 * - an already-SELECTED slug is always kept, even if the server answered nothing, so the
 *   learner can always un-pick it instead of being stranded on an empty list.
 *
 * @param items - the rows the bank returned for the current filter.
 * @param selected - the slugs currently picked.
 * @returns `{slug,label}` facets, de-duplicated and sorted by label.
 */
export const collectChallengeTags = (
    items: Array<CodingChallenge>,
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
 * Đọc kho challenge CỦA MỘT MÔN — và chỉ của môn đó.
 *
 * Dữ liệu thật: `GET /api/v1/subjects/{code}` (đổi mã môn → UUID) +
 * `GET /api/v1/challenges?subjectId=&tags=`. Việc thu hẹp do CHÍNH BE làm bằng query
 * param, không phải lọc client trên kho toàn cục. BE đã ẩn DRAFT/ARCHIVED và challenge
 * COURSE_ONLY của khoá; {@link isListableChallenge} là đai cho status `PENDING_APPROVAL`.
 *
 * VÌ SAO không còn nhánh "môn rỗng → hỏi lại KHÔNG kèm subjectId":
 * nhánh đó là nguồn duy nhất khiến đề PE của CSD201/PRF192 hiện dưới tab Luyện tập của
 * JPD113. Nó có HAI đường rơi, không phải một, và cả hai đều đã bị bỏ:
 *   (a) môn resolve được nhưng trả 0 dòng → trước đây chảy tiếp xuống truy vấn toàn cục;
 *   (b) `getSubjectDetail` lỗi/404 bị `.catch(() => null)` nuốt → cũng chảy xuống toàn cục.
 * Chỉ vá (a) mà quên (b) thì hễ endpoint môn hỏng là cả kho lại tràn vào.
 *
 * BẪY khi sửa tiếp: lỗi đọc môn PHẢI ném lên SWR chứ không được nuốt thành danh sách
 * rỗng. "Không đọc được môn" khác "môn không có bài" — nuốt lỗi là đổi một câu nói dối
 * (chiếu đề môn khác) lấy một câu nói dối khác (bảo môn này trống).
 *
 * @param code - mã môn (đã viết hoa).
 * @param tags - slug tag mà mọi dòng phải mang ĐỦ (AND); mảng rỗng = không ràng buộc.
 * @returns kho challenge của môn.
 * @throws khi không đọc được môn, hoặc môn trả về không có UUID.
 */
export const fetchSubjectCodingBank = async (
    code: string,
    tags: Array<string>,
): Promise<CodingChallengeBank> => {
    const detail = await getSubjectDetail(code)
    // Không có UUID thì KHÔNG được hỏi kho mà bỏ trống `subjectId` — làm thế là hỏi cả
    // kho toàn cục rồi trình bày nó như đề của môn này. Thà báo lỗi để người học bấm
    // "Thử lại" còn hơn chiếu đề môn khác.
    if (!detail?.id) {
        throw new Error(`Subject ${code} resolved without an id`)
    }
    const now = Date.now()
    return {
        items: narrowBankRows(
            toBankRows(await listChallenges({ subjectId: detail.id, tags }), now),
            detail.id,
            tags,
        ),
    }
}

/**
 * Hook SWR quanh {@link fetchSubjectCodingBank}.
 *
 * @param subjectId - đoạn route `[subjectId]` (chính là MÃ môn).
 * @param tags - slug tag mà mọi dòng phải mang đủ (AND); bỏ trống = không ràng buộc.
 * @returns `{ challenges, isLoading, error, mutate }`.
 */
export const useQuerySubjectCodingChallengesSwr = (
    subjectId: string,
    tags: Array<string> = [],
) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    // Sorted + joined so the key is stable regardless of the order chips were picked in
    // (and identical to the unfiltered key when nothing is selected → one request).
    const tagKey = [...tags].sort().join(",")
    const { data, isLoading, error, mutate } = useSWR(
        code ? (["subject-coding-challenges", code, tagKey] as const) : null,
        (): Promise<CodingChallengeBank> =>
            fetchSubjectCodingBank(code, tagKey ? tagKey.split(",") : []),
    )

    return {
        challenges: data?.items ?? [],
        isLoading,
        error,
        mutate,
    }
}

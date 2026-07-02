"use client"

import useSWR from "swr"

/** Starter code seed for a UI/UX challenge (mock — BE contract is an ASSUMPTION). */
export interface UiUxStarter {
    /** Starter HTML body markup. */
    html: string
    /** Starter CSS rules. */
    css: string
    /** Starter JS (kept minimal for UI/UX challenges). */
    js: string
}

/**
 * Single challenge for the standalone solve view `/challenges/[challengeId]`.
 *
 * Mock shape until the BE contract lands. Deliberately NOT the coupled
 * `useQueryChallengeSwr` (Redux course-scoped) — this solve route is standalone
 * and keyed by the route param only. `requirements` drives the checklist; `starter`
 * seeds the editor; `isLocked` drives the enroll gate (enroll, NOT VIP).
 */
export interface ChallengeSolve {
    /** Opaque id from the route (`[challengeId]`). */
    id: string
    /** Human title. */
    title: string
    /** Domain — only `uiux` renders the editor; others show a placeholder. */
    type: "coding" | "sql" | "uiux" | "ai" | "business"
    /** Difficulty label key suffix. */
    difficulty: "basic" | "intermediate" | "advanced"
    /** Short brief shown above the editor. */
    brief: string
    /** Requirement items — mapped 1:1 into the checklist. */
    requirements: Array<string>
    /** Ordered guided steps (accordion). */
    steps: Array<string>
    /** Optional hint lines (accordion). */
    hints: Array<string>
    /** Reference / target design image URL. */
    targetImageUrl: string
    /** Starter code seeded into the editor on first mount. */
    starter: UiUxStarter
    /** True when premium and not unlocked (enroll gate). */
    isLocked: boolean
    /** Course this challenge belongs to — the enroll CTA targets it. */
    courseId: string
}

// ponytail: mock BE — no single-challenge solve endpoint yet. Deterministic sample
// keyed by route id, same shape the real GraphQL query will return. Wire a real
// query(challenge(id)) when the contract lands; the hook API stays.
const CHALLENGES: Record<string, ChallengeSolve> = {
    "landing-redesign": {
        id: "landing-redesign",
        title: "Thiết Kế Lại Landing Page",
        type: "uiux",
        difficulty: "intermediate",
        brief: "Dựng lại khối hero của landing page cho khớp thiết kế mục tiêu: tiêu đề, mô tả và nút kêu gọi hành động.",
        requirements: [
            "Hero có tiêu đề lớn và mô tả phụ",
            "Nút kêu gọi hành động (CTA) nổi bật",
            "Bố cục căn giữa, khoảng cách hợp lý",
            "Bảng màu khớp thiết kế mục tiêu",
        ],
        steps: [
            "Dựng khung HTML: tiêu đề, đoạn mô tả, nút CTA.",
            "Thêm CSS căn giữa và khoảng cách.",
            "Tinh chỉnh màu sắc và bo góc cho khớp target.",
        ],
        hints: [
            "Dùng flexbox để căn giữa theo cả hai trục.",
            "CTA nổi bật hơn khi có nền màu nhấn và bo góc.",
        ],
        targetImageUrl:
            "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=800&q=60",
        starter: {
            html: '<section class="hero">\n  <h1>Tiêu đề của bạn</h1>\n  <p>Mô tả ngắn gọn về sản phẩm.</p>\n  <button class="cta">Bắt đầu</button>\n</section>',
            css: ".hero {\n  font-family: sans-serif;\n  text-align: center;\n  padding: 48px 24px;\n}\n.cta {\n  padding: 12px 24px;\n  border: none;\n  border-radius: 8px;\n  background: #6c5ce7;\n  color: #fff;\n  cursor: pointer;\n}",
            js: "// JS tối thiểu (không bắt buộc cho challenge UI/UX)\n",
        },
        isLocked: false,
        courseId: "web-foundations",
    },
    "dashboard-card": {
        id: "dashboard-card",
        title: "Thẻ Thống Kê Dashboard",
        type: "uiux",
        difficulty: "advanced",
        brief: "Dựng một thẻ thống kê (stat card) cho dashboard: nhãn, số liệu lớn và chỉ số tăng/giảm.",
        requirements: [
            "Thẻ có bo góc và đổ bóng nhẹ",
            "Số liệu chính cỡ lớn, nổi bật",
            "Chỉ số tăng/giảm có màu phân biệt",
        ],
        steps: [
            "Dựng khung thẻ với nhãn và số liệu.",
            "Thêm chỉ số delta màu xanh/đỏ.",
        ],
        hints: ["Dùng box-shadow mềm để tạo chiều sâu."],
        targetImageUrl:
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=60",
        starter: {
            html: '<div class="card">\n  <span class="label">Doanh thu</span>\n  <strong class="value">₫0</strong>\n  <span class="delta">+0%</span>\n</div>',
            css: ".card {\n  font-family: sans-serif;\n  padding: 20px;\n  border-radius: 12px;\n}",
            js: "",
        },
        // Premium example — gated behind enrolling the course (NOT VIP).
        isLocked: true,
        courseId: "web-foundations",
    },
}

const fetchChallengeSolveMock = async (
    challengeId: string,
): Promise<ChallengeSolve | null> => CHALLENGES[challengeId] ?? null

/**
 * Loads a single challenge for the solve view. Mocked; SWR-shaped for a drop-in
 * BE swap. `null` data (after load) → the view renders its empty/not-found state.
 *
 * @param challengeId - the route `[challengeId]` param.
 */
export const useQueryChallengeSolveSwr = (challengeId: string) => {
    const swr = useSWR(
        challengeId ? ["CHALLENGE_SOLVE_SWR", challengeId] : null,
        () => fetchChallengeSolveMock(challengeId),
    )
    return swr
}

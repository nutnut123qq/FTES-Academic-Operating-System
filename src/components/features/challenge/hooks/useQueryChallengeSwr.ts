"use client"

import useSWR from "swr"

import { CHALLENGES_MOCK } from "./useQueryChallengesSwr"
import type { Challenge } from "./useQueryChallengesSwr"

/** Starter code seeded into the UI/UX editor. */
export interface ChallengeStarter {
    html: string
    css: string
    js: string
}

/** Full solve-view challenge (§10). Mock shape until the BE contract lands (GIẢ ĐỊNH). */
export interface ChallengeDetail extends Challenge {
    /** Requirement list — feeds the target-panel checklist. */
    requirements: Array<string>
    /** Guided steps shown in the brief accordion. */
    steps: Array<string>
    /** Hints shown in the brief accordion. */
    hints: Array<string>
    /** Seed code for the editor. */
    starter: ChallengeStarter
    /** Reference design image to rebuild. */
    targetImageUrl: string
    /** Premium content not yet unlocked — unlock = ENROLL the course (not VIP). */
    isLocked: boolean
    /** Course containing this challenge (enroll CTA target). */
    courseId: string
}

// ponytail: inline SVG wireframe as the target design — self-contained mock, no
// external image host. Swap for a real asset URL when the BE contract lands.
const TARGET_IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">
<rect width="640" height="400" fill="#fafafa"/>
<rect width="640" height="48" fill="#ffffff"/>
<rect x="24" y="16" width="72" height="16" rx="4" fill="#e11d48"/>
<rect x="424" y="18" width="48" height="12" rx="4" fill="#d4d4d8"/>
<rect x="484" y="18" width="48" height="12" rx="4" fill="#d4d4d8"/>
<rect x="544" y="12" width="72" height="24" rx="12" fill="#e11d48"/>
<rect x="140" y="96" width="360" height="24" rx="6" fill="#3f3f46"/>
<rect x="180" y="132" width="280" height="12" rx="4" fill="#a1a1aa"/>
<rect x="260" y="164" width="120" height="32" rx="16" fill="#e11d48"/>
<rect x="40" y="248" width="176" height="112" rx="10" fill="#ffffff" stroke="#e4e4e7"/>
<rect x="232" y="248" width="176" height="112" rx="10" fill="#ffffff" stroke="#e4e4e7"/>
<rect x="424" y="248" width="176" height="112" rx="10" fill="#ffffff" stroke="#e4e4e7"/>
<rect x="56" y="268" width="80" height="12" rx="4" fill="#3f3f46"/>
<rect x="248" y="268" width="80" height="12" rx="4" fill="#3f3f46"/>
<rect x="440" y="268" width="80" height="12" rx="4" fill="#3f3f46"/>
<rect x="56" y="292" width="144" height="8" rx="4" fill="#d4d4d8"/>
<rect x="248" y="292" width="144" height="8" rx="4" fill="#d4d4d8"/>
<rect x="440" y="292" width="144" height="8" rx="4" fill="#d4d4d8"/>
</svg>`

const TARGET_IMAGE_URL = `data:image/svg+xml;utf8,${encodeURIComponent(TARGET_IMAGE_SVG)}`

const LANDING_STARTER: ChallengeStarter = {
    html: `<header class="nav">
    <span class="logo">FTES</span>
    <nav class="links">
        <a href="#">Khoá học</a>
        <a href="#">Giảng viên</a>
        <a class="nav-cta" href="#">Đăng ký</a>
    </nav>
</header>
<main class="hero">
    <h1>Học lập trình theo cách của bạn</h1>
    <p>Lộ trình cá nhân hoá, dự án thực tế và mentor đồng hành.</p>
    <a class="cta" href="#">Bắt đầu miễn phí</a>
</main>
<section class="features">
    <article class="card"><h2>Lộ trình</h2><p>Học đúng thứ tự, không lan man.</p></article>
    <article class="card"><h2>Dự án</h2><p>Portfolio thật ngay khi học.</p></article>
    <article class="card"><h2>Mentor</h2><p>Hỏi đáp 1-1 với chuyên gia.</p></article>
</section>
`,
    css: `/* Dựng lại landing page theo ảnh mục tiêu.
   Gợi ý: flexbox cho .nav, grid 3 cột cho .features. */
body {
    margin: 0;
    font-family: system-ui, sans-serif;
    color: #1f2937;
    background: #fafafa;
}
`,
    js: `// JS tối thiểu — chỉ thêm khi cần tương tác (vd: cuộn mượt tới .features).
`,
}

/** Brief nội dung theo từng challenge; thiếu id → fallback brief generic. */
const CHALLENGE_BRIEFS_MOCK: Record<
    string,
    Pick<ChallengeDetail, "requirements" | "steps" | "hints" | "starter">
> = {
    "landing-redesign": {
        requirements: [
            "Thanh điều hướng: logo trái, liên kết + nút Đăng ký phải, căn giữa dọc.",
            "Hero căn giữa: tiêu đề lớn, mô tả ngắn và nút CTA nổi bật màu thương hiệu.",
            "Ba thẻ tính năng xếp lưới 3 cột trên desktop, dồn 1 cột trên mobile.",
            "Nền trang sáng, thẻ có viền mảnh và bo góc đồng nhất.",
        ],
        steps: [
            "Quan sát ảnh mục tiêu, xác định 3 vùng: nav, hero, features.",
            "Dựng khung HTML sẵn có, đặt class đúng từng vùng.",
            "Style nav bằng flexbox: logo trái, cụm liên kết phải.",
            "Style hero: căn giữa nội dung, nhấn CTA bằng màu thương hiệu.",
            "Style lưới features bằng grid, thêm breakpoint cho mobile.",
        ],
        hints: [
            "`display: flex` + `justify-content: space-between` cho .nav.",
            "`grid-template-columns: repeat(3, 1fr)` cho .features, đổi về 1 cột trong media query.",
            "Màu thương hiệu tham khảo: #e11d48.",
        ],
        starter: LANDING_STARTER,
    },
}

const FALLBACK_BRIEF: Pick<ChallengeDetail, "requirements" | "steps" | "hints" | "starter"> = {
    requirements: ["Hoàn thành yêu cầu của đề bài."],
    steps: ["Đọc kỹ đề bài rồi bắt tay vào làm."],
    hints: ["Chia nhỏ bài toán trước khi giải."],
    starter: { html: "", css: "", js: "" },
}

/** Challenge premium (mock) — mở khoá bằng enroll khoá học, không phải VIP. */
const PREMIUM_CHALLENGE_IDS = new Set(["checkout-form", "prompt-tuning"])

// ponytail: mock BE — resolves from the shared catalog list; unknown id → null
// (drives the not-found state). Swap for a real GraphQL challenge(id) query when
// the contract lands; the hook API stays.
const fetchChallengeMock = async (challengeId: string): Promise<ChallengeDetail | null> => {
    const challenge = CHALLENGES_MOCK.find((item) => item.id === challengeId)
    if (!challenge) return null
    return {
        ...challenge,
        ...(CHALLENGE_BRIEFS_MOCK[challengeId] ?? FALLBACK_BRIEF),
        targetImageUrl: TARGET_IMAGE_URL,
        isLocked: PREMIUM_CHALLENGE_IDS.has(challengeId),
        courseId: "web-foundations",
    }
}

/** Loads one challenge for the solve view. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryChallengeSwr = (challengeId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["challenge", challengeId],
        () => fetchChallengeMock(challengeId),
    )
    return { challenge: data, isLoading, error, mutate }
}

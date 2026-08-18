import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it, vi } from "vitest"
import en_messages from "@/messages/en.json"
import vi_messages from "@/messages/vi.json"

// `@/i18n/navigation` gọi `createNavigation` của next-intl, thứ này import `next/navigation` —
// không giải được ngoài Next runtime (vitest báo "Cannot find module next/navigation"). Test này
// chỉ đọc DỮ LIỆU export từ file, không render, nên thay Link bằng stub là đủ.
vi.mock("@/i18n/navigation", () => ({ Link: () => null }))

import * as guideModule from "./index"

/**
 * Ghim — trang "Cách tính điểm" chỉ được nói những khoản EXP mà backend THẬT SỰ trả.
 *
 * ★ VÌ SAO PHẢI GHIM: một lời hứa sai trên trang này không hỏng lúc build, không hỏng lúc chạy,
 * và không hỏng cho tới khi một người học làm đúng thứ trang bảo rồi mở lịch sử EXP thấy 0 dòng —
 * lúc đó họ báo "hệ thống nuốt EXP" cho một khoản chưa từng tồn tại. Đợt trước đã dọn BẢNG XP
 * nhưng bỏ sót mục "Mục tiêu" nằm cách đó 170 dòng, nên trang tự mâu thuẫn với chính nó: khối chú
 * thích nói mục tiêu không có EXP, cuộn xuống hai mục thì vẫn ghi "+10 XP / +50 XP".
 *
 * Ba thứ được ghim ở đây, đối chiếu với NGUỒN THẬT chứ không với trí nhớ:
 *   1. mỗi dòng bảng XP mang một `rule_key` có thật và ĐÚNG số của rule đó (V349);
 *   2. trang KHÔNG còn hứa EXP cho mục tiêu ngày/tuần, và KHÔNG còn hứa hệ số nhân theo streak
 *      (`XpGrantService` cấp đúng `rule.getAmount()`, grep 'multiplier' ra 0 dòng);
 *   3. câu "bảng này đếm gì" của bảng Cộng đồng & Workplace khớp `gamification.leaderboard_sources`
 *      (V351) — nơi tym KHÔNG được khai mảng nào.
 *
 * Dùng `import * as` chứ không `import { GUIDE_XP_ROWS }` là CÓ CHỦ ĐÍCH: namespace import không
 * đứt lúc link khi export chưa tồn tại, nên chạy test này trên bản mã CŨ vẫn ra thông báo lỗi đọc
 * được ("nhiệm vụ không có dòng nào") thay vì một lỗi tải module che hết mọi ca khác.
 */

/**
 * `gamification.xp_rules` SAU V349 — chép từ chính file migration
 * `V349__xp_rules_economy_rebalance_learning_first.sql` (repo backend).
 * Sửa số ở đây mà không sửa migration là làm giả bằng chứng: đây là bản sao của DB, không phải
 * nguồn thứ hai. `assignment.submitted` và `subject.joined` cố ý KHÔNG có mặt — V349 tắt chúng.
 */
const XP_RULES_AFTER_V349: Readonly<Record<string, number>> = {
    "lesson.completed": 500,
    "quiz.passed": 1000,
    "challenge.completed": 1500,
    "course.completed": 5000,
    "course.enrolled": 250,
    "resource.submitted": 10,
    "resource.approved": 1000,
    "resource.commented": 10,
    "community.post.created": 50,
    "community.comment.created": 10,
    "community.answer.accepted": 15,
    "community.reaction.added": 1,
    "lesson.liked": 1,
    "gamification.quest.completed": 100,
}

/**
 * Event CÓ THẬT (GoalService#applyProgress phát nó) nhưng KHÔNG có `rule_key` tương ứng trong bất
 * kỳ migration nào (đã soát V65 · V66 · V221 · V342 · V343 · V344 · V349) ⇒
 * `findByRuleKeyAndActiveTrue` rỗng ⇒ `GrantResult.none()` ⇒ 0 XP. Trang không được hứa khoản này.
 */
const EVENTS_WITHOUT_XP_RULE = ["gamification.goal.completed"]

/** Key i18n đã bị gỡ vì mô tả phần thưởng backend không cấp. */
const REMOVED_GUIDE_KEYS = [
    "goalsSection",
    "dailyGoalRule",
    "weeklyGoalRule",
    "multiplierNote",
    "streakMultiplier",
]

const SOURCE = readFileSync(resolve(__dirname, "./index.tsx"), "utf8")

/** Chỉ phần MÃ: chú thích được phép nhắc tên một key đã gỡ để giải thích VÌ SAO gỡ. */
const CODE = SOURCE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")

type Catalog = typeof vi_messages | typeof en_messages

const guideOf = (catalog: Catalog): Record<string, unknown> =>
    (catalog as unknown as { gamification: { guide: Record<string, unknown> } }).gamification.guide

const actionsOf = (catalog: Catalog): Record<string, string> =>
    guideOf(catalog).actions as Record<string, string>

const socialCountsOf = (catalog: Catalog): string =>
    (catalog as unknown as {
        gamification: { seasonBoards: { counts: { social: string } } }
    }).gamification.seasonBoards.counts.social

const rows = guideModule.GUIDE_XP_ROWS

describe("Cách tính điểm — mỗi con số phải có rule thật", () => {
    it("bảng XP không rỗng (export còn sống)", () => {
        expect(rows?.length ?? 0).toBeGreaterThan(0)
    })

    it("mỗi dòng trỏ tới một rule_key CÓ THẬT và quảng cáo ĐÚNG số của rule đó", () => {
        for (const row of rows) {
            expect(
                Object.hasOwn(XP_RULES_AFTER_V349, row.ruleKey),
                `dòng "${row.key}" trỏ rule_key "${row.ruleKey}" không có trong xp_rules`,
            ).toBe(true)
            expect(row.xp, `dòng "${row.key}" (${row.ruleKey})`).toBe(
                XP_RULES_AFTER_V349[row.ruleKey],
            )
        }
    })

    it("KHÔNG dòng nào bám vào event không có rule (mục tiêu ngày/tuần)", () => {
        const advertised = rows.map((row) => row.ruleKey)
        for (const dead of EVENTS_WITHOUT_XP_RULE) {
            expect(advertised).not.toContain(dead)
        }
    })

    it("nhiệm vụ hằng ngày CÓ dòng riêng — 100 EXP, đúng V349", () => {
        // Quest → EXP đã được chủ dự án duyệt; bỏ trống dòng này thì người học không so được
        // cày nhiệm vụ với học một bài, mà đây là nguồn có trần ngày lớn thứ nhì (5.000/ngày).
        const quest = rows.find((row) => row.ruleKey === "gamification.quest.completed")
        expect(quest, "bảng XP thiếu dòng nhiệm vụ hằng ngày").toBeTruthy()
        expect(quest?.xp).toBe(100)
    })

    it("mỗi dòng có nhãn ở CẢ hai catalog", () => {
        for (const row of rows) {
            expect(actionsOf(vi_messages)[row.key], `vi thiếu guide.actions.${row.key}`).toBeTruthy()
            expect(actionsOf(en_messages)[row.key], `en thiếu guide.actions.${row.key}`).toBeTruthy()
        }
    })
})

describe("Cách tính điểm — lời hứa đã gỡ thì không được quay lại", () => {
    it.each(REMOVED_GUIDE_KEYS)("catalog vi/en không còn key `guide.%s`", (key) => {
        expect(Object.hasOwn(guideOf(vi_messages), key)).toBe(false)
        expect(Object.hasOwn(guideOf(en_messages), key)).toBe(false)
    })

    it.each(REMOVED_GUIDE_KEYS)("trang không render lại `guide.%s`", (key) => {
        expect(CODE).not.toContain(`guide.${key}`)
    })

    it("nói THẲNG là không có hệ số nhân, thay vì im lặng sau khi đã hứa", () => {
        // Gỡ suông thì người đã đọc bản cũ vẫn trừ hao rằng streak đang nhân điểm cho mình.
        expect(CODE).toContain("guide.noStreakMultiplierNote")
        expect(guideOf(vi_messages).noStreakMultiplierNote).toBeTruthy()
        expect(guideOf(en_messages).noStreakMultiplierNote).toBeTruthy()
    })
})

describe("Bảng Cộng đồng & Workplace — câu 'đếm gì' khớp leaderboard_sources (V351)", () => {
    // ĐÍNH CHÍNH bản trước: nó ghim rằng câu này KHÔNG được nói "đếm tym", kèm chú thích khẳng định
    // `community.reaction.added` / `lesson.liked` "chưa có mảng nào". Mở V351 ra thì hai key đó nằm
    // ngay trong khối COMMUNITY:
    //     ('community.reaction.added', 'COMMUNITY', 'Tym bài/bình luận cộng đồng'),
    //     ('lesson.liked',             'COMMUNITY', 'Tym một bài học'),
    // Nên bản trước ghim NGƯỢC sự thật, và ghim rất chắc — đúng kiểu test giữ cho một lời nói dối
    // sống sót qua mọi lần refactor. Bài học: câu mô tả "bảng này đếm gì" phải đối chiếu file
    // migration THẬT, không đối chiếu trí nhớ về nó.
    it("khai là CÓ đếm tym, khớp hai key COMMUNITY của V351", () => {
        expect(socialCountsOf(vi_messages)).toMatch(/tym/i)
        expect(socialCountsOf(en_messages)).toMatch(/likes/i)
    })

    it("KHÔNG còn câu nói tym bị loại khỏi bảng này", () => {
        // Câu cũ vừa sai vừa nguy hiểm: người dùng thấy tym không làm hạng nhúc nhích sẽ tưởng hỏng.
        expect(socialCountsOf(vi_messages)).not.toContain("Tym KHÔNG được tính")
        expect(socialCountsOf(en_messages)).not.toContain("Likes are NOT counted")
    })

    it("nói rõ tym một BÀI HỌC vào bảng này chứ không vào bảng Khoá học", () => {
        // Đây là chỗ người dùng dễ tưởng máy tính sai nhất: tym bài học mà hạng khoá không đổi.
        expect(socialCountsOf(vi_messages)).toMatch(/bài học/i)
        expect(socialCountsOf(en_messages)).toMatch(/lesson/i)
    })
})

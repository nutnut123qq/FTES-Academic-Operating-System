"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { ArrowLeftIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { pathConfig } from "@/resources/path"
import { RANK_TIERS } from "../leaderboardTiers"
import { useBadgeLabel } from "../useBadgeLabel"

// Gamification economics for the "Cách tính điểm" explainer. These display
// constants mirror the backend `gamification-quest-coin-engine` config; with the
// mock engine removed the guide is their only consumer, so they live here. The
// live viewer numbers come from `useQueryMyGamificationSwr` and tiers from
// `leaderboardTiers.ts` — there is no BE explainer endpoint, so this page is the
// human-readable contract for the numbers.

/** Level curve: total XP to REACH level L is `factor × (L − 1)²`. */
const LEVEL_CURVE = { factor: 35 } as const
/** Total XP required to reach a given level: `factor × (L − 1)²`. */
const xpForLevel = (level: number): number =>
    LEVEL_CURVE.factor * Math.pow(Math.max(1, level) - 1, 2)
// KHÔNG có hằng "hệ số nhân XP theo streak", và đó là chủ đích chứ không phải bỏ sót.
// `XpGrantService.grant` cấp đúng `rule.getAmount()` (hoặc `overrideXp` của phần thưởng challenge):
//     int amount = overrideXp != null ? overrideXp : rule.getAmount();
// grep 'multiplier' toàn package gamification của backend ra 0 dòng. Trang này từng hứa "+5%/ngày,
// trần +50%" — một lời hứa KHÔNG mã nào thực hiện, nên đã gỡ; thay vào đó nói thẳng là không có
// hệ số nhân (`guide.noStreakMultiplierNote`), vì im lặng sau khi đã hứa thì người đọc cũ vẫn tin
// là còn.
/** Streak Freeze: hold at most 2, buy one for 50 coin. */
const FREEZE = { max: 2, cost: 50 } as const
/** Streak Repair: within 48h of a reset, 10 coin/day, capped at 200. */
const REPAIR = { windowHours: 48, costPerDay: 10, costCap: 200 } as const
/** Streak-at-risk reminder: fires at 20:00 local when the streak is ≥ 3. */
const REMINDER = { hour: 20, minStreak: 3 } as const
// KHÔNG có hằng "mục tiêu ngày/tuần" nữa. `GoalService` CÓ phát `gamification.goal.completed`
// (GoalService#applyProgress), nhưng KHÔNG migration nào khai rule_key đó trong
// `gamification.xp_rules` — đã soát toàn bộ file đụng bảng ấy: V65 · V66 · V221 · V342 · V343 ·
// V344 · V349. Không có rule ⇒ `findByRuleKeyAndActiveTrue` rỗng ⇒ `GrantResult.none()` ⇒ 0 XP.
// Vì thế cả MỤC "Mục tiêu" đã được gỡ khỏi trang, không riêng dòng trong bảng: để lại "+10 XP /
// +50 XP" là để người học hoàn thành mục tiêu rồi đi tìm khoản EXP chưa từng tồn tại — đúng lỗi
// mà đợt trước đã dọn ở bảng nhưng bỏ sót ở đây. Mục tiêu học cũng CHƯA có bề mặt nào trên FE để
// đặt (không nơi nào gọi `setWeeklyGoal`), nên nó nằm ở mục "Sắp ra mắt".
/** One-time streak milestones (badge + coin). */
const STREAK_MILESTONES: ReadonlyArray<{ days: number; badgeKey: string; coin: number }> = [
    // badgeKey = ĐÚNG `code` badge của BE (V66 seed), không phải tên tự đặt ở FE — nếu lệch thì
    // trang hướng dẫn quảng cáo một cái tên, badge trao về lại mang tên khác (hoặc mất bản dịch).
    { days: 7, badgeKey: "STREAK_7", coin: 50 },
    { days: 30, badgeKey: "STREAK_30", coin: 200 },
    { days: 100, badgeKey: "STREAK_100", coin: 1000 },
]

/** A row in the XP table. */
export interface XpRow {
    /** Nhãn: `guide.actions.<key>` trong catalog vi/en. */
    key: string
    /**
     * `rule_key` THẬT trong `gamification.xp_rules`. Con số bên cạnh chỉ đúng khi rule này tồn
     * tại VÀ đang bật — `guide-claims.test.ts` đối chiếu từng dòng với bảng rule sau V349, nên
     * thêm một dòng không có rule là test đỏ chứ không phải là một lời hứa suông lọt ra trang.
     */
    ruleKey: string
    xp: number
}

// ★ THANG XP ĐÃ ĐƯỢC CÂN LẠI — nâng phần HỌC lên, KHÔNG hạ phần nhiệm vụ.
//
// VÌ SAO: nhiệm vụ hằng ngày cho tới 5.000 XP/ngày, trong khi hoàn thành trọn một
// khoá trước đây chỉ được 30. Chênh 166 lần nghĩa là bảng TỔNG — bảng duy nhất có
// phần thưởng thật — do người điểm danh đều thắng, không phải người học. Nâng phần
// học giữ được cảm giác "XP cao" mà vẫn làm bảng Tổng nói đúng sự thật. Tỉ lệ phải
// giữ: MỘT NGÀY nhiệm vụ không được vượt quá cỡ MỘT LẦN hoàn thành khoá.
//
// Tương tác (tym/bình luận) giữ ở mức rất thấp và còn bị TRẦN NGÀY chặn thêm, vì đó
// là nguồn EXP rẻ nhất để farm chéo giữa các tài khoản.
//
// ⚠️ MỖI DÒNG DƯỚI ĐÂY PHẢI CÓ MỘT `rule_key` THẬT, ĐANG BẬT trong `gamification.xp_rules`
// (V349) — vì thế mỗi dòng mang luôn `ruleKey` để test đối chiếu được. Trang này là lời hứa:
// quảng cáo một con số không hệ thống nào trả thì người học làm xong sẽ đi tìm chỗ bị mất EXP.
//
// ĐÍNH CHÍNH bản trước — câu "nhiệm vụ hằng ngày trả XU, KHÔNG trả EXP" là SAI kể từ V349:
// `gamification.quest.completed` = 100 XP/lượt, trần 5.000/ngày (đường quest → XP đã được chủ dự
// án duyệt, kèm điều kiện trần phải chặt). Nên nhiệm vụ CÓ dòng riêng ở đây: bỏ trống đúng nguồn
// có trần ngày lớn thứ nhì thì người học không cách nào so được cày nhiệm vụ với học một bài.
// Điểm danh không có rule riêng — nó sinh EXP qua chính nhiệm vụ "đăng nhập hằng ngày" (V221).
//
// `quizSubmit` là 1.000 PHẲNG (`quiz.passed`), không phải thang theo điểm.
export const GUIDE_XP_ROWS: ReadonlyArray<XpRow> = [
    { key: "lessonComplete", ruleKey: "lesson.completed", xp: 500 },
    { key: "quizSubmit", ruleKey: "quiz.passed", xp: 1000 },
    { key: "challengeComplete", ruleKey: "challenge.completed", xp: 1500 },
    { key: "courseComplete", ruleKey: "course.completed", xp: 5000 },
    // resource.approved (KHÔNG phải resource.submitted, vốn chỉ còn 10 XP): tiền gắn vào lượt
    // ĐƯỢC DUYỆT — nhãn cũng phải nói "được duyệt", nếu không người nộp chờ EXP ngay lúc nộp.
    { key: "resourcePublish", ruleKey: "resource.approved", xp: 1000 },
    { key: "courseEnrolled", ruleKey: "course.enrolled", xp: 250 },
    { key: "postCreated", ruleKey: "community.post.created", xp: 50 },
    { key: "commentCreated", ruleKey: "community.comment.created", xp: 10 },
    // community.reaction.added / lesson.liked — EXP về NGƯỜI BẤM tym (chống farm), KHÔNG
    // về tác giả. Nhãn phải nói đúng chiều đó, nếu không người ta đi rủ nhau tym bài
    // mình rồi thấy EXP không nhúc nhích. Hai rule cùng một mức 1 XP nên gộp một dòng.
    { key: "reactionGiven", ruleKey: "community.reaction.added", xp: 1 },
    { key: "questComplete", ruleKey: "gamification.quest.completed", xp: 100 },
]

/**
 * "Cách tính điểm" — the gamification rules explainer at `/leaderboard/guide`.
 *
 * Every number renders from the local economics constants above (the display
 * contract mirroring the backend engine config): the XP
 * table, the level-curve formula + worked example, the rank tiers, the streak
 * rules (qualifying day / milestones / freeze / repair / reminder), and a
 * "Sắp ra mắt" (coming soon) section that only outlines League/Season, learning
 * goals and Mystery Box with no live numbers.
 *
 * KHÔNG có mục "Mục tiêu" và KHÔNG có dòng hệ số nhân theo streak: cả hai đều là
 * phần thưởng mà backend không cấp (xem chú thích ở hai hằng đã gỡ phía trên).
 *
 * Headings are properly nested (h1 → h2) and every table has header cells for a11y.
 */
export const LeaderboardGuideShell = () => {
    const t = useTranslations("gamification")
    const locale = useLocale()
    const badgeLabel = useBadgeLabel()

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6">
            <div className="flex flex-col gap-2">
                <Link
                    // Locale-less — this `Link` is the locale-aware one from
                    // `@/i18n/navigation` and prepends the active locale itself.
                    href={pathConfig().locale().leaderboard().build()}
                    className="flex w-fit items-center gap-1 text-sm text-muted no-underline hover:text-foreground"
                >
                    <ArrowLeftIcon className="size-4" aria-hidden focusable="false" />
                    {t("guide.back")}
                </Link>
                <div className="flex flex-col gap-0">
                    <Typography.Heading level={1} weight="bold" className="text-2xl">
                        {t("guide.title")}
                    </Typography.Heading>
                    <Typography type="body-sm" color="muted">
                        {t("guide.subtitle")}
                    </Typography>
                </div>
            </div>

            {/* XP table */}
            <section className="flex flex-col gap-3">
                <Typography.Heading level={2} weight="bold" className="text-lg">
                    {t("guide.xpSection")}
                </Typography.Heading>
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-separator text-left text-muted">
                            <th scope="col" className="py-2 font-medium">
                                {t("guide.actionHeader")}
                            </th>
                            <th scope="col" className="py-2 text-right font-medium">
                                {t("guide.xpHeader")}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {GUIDE_XP_ROWS.map((row) => (
                            <tr key={row.key} className="border-b border-separator/60">
                                <th scope="row" className="py-2 pr-3 text-left font-normal">
                                    {t(`guide.actions.${row.key}`)}
                                </th>
                                <td className="py-2 text-right font-medium">
                                    {t("xpValue", { xp: row.xp })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Nói thẳng là KHÔNG có hệ số nhân: bản trước quảng cáo "+5%/ngày, trần +50%"
                    mà backend cấp đúng `rule.getAmount()`. Gỡ suông thì người đã đọc bản cũ vẫn
                    trừ hao rằng streak đang nhân điểm cho mình. */}
                <Typography type="body-xs" color="muted">
                    {t("guide.noStreakMultiplierNote")}
                </Typography>
                {/* Vì sao thang đổi + hai lớp chống farm + bảng reset theo kì. Không phải
                    chú thích trang trí: người dùng thấy con số nhảy từ 20 lên 500 mà không
                    ai giải thích sẽ đoán là hệ thống lỗi. */}
                <div className="flex flex-col gap-1 rounded-2xl bg-default/40 p-4">
                    <Typography type="body-xs" color="muted">
                        {t("guide.scaleNote")}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {t("guide.interactionCapNote")}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {t("guide.questCoinNote")}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {t("guide.likeEligibilityNote")}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {t("guide.seasonNote")}
                    </Typography>
                </div>
            </section>

            {/* Level curve */}
            <section className="flex flex-col gap-2">
                <Typography.Heading level={2} weight="bold" className="text-lg">
                    {t("guide.levelSection")}
                </Typography.Heading>
                <Typography type="body-sm">
                    {t("guide.levelFormula", { factor: LEVEL_CURVE.factor })}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("guide.levelExample", {
                        level: 13,
                        xp: xpForLevel(13).toLocaleString(locale),
                    })}
                </Typography>
                {/* Ngưỡng cấp GIỮ NGUYÊN khi cân lại thang XP ⇒ lên cấp nhanh hơn. Phải nói
                    ra: người dùng cũ thấy mình nhảy mấy cấp trong một tuần sẽ tưởng lỗi. */}
                <Typography type="body-xs" color="muted">
                    {t("guide.levelKeepNote")}
                </Typography>
            </section>

            {/* Rank tiers */}
            <section className="flex flex-col gap-3">
                <Typography.Heading level={2} weight="bold" className="text-lg">
                    {t("guide.tierSection")}
                </Typography.Heading>
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-separator text-left text-muted">
                            <th scope="col" className="py-2 font-medium">
                                {t("guide.tierHeader")}
                            </th>
                            <th scope="col" className="py-2 text-right font-medium">
                                {t("guide.tierXpHeader")}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {RANK_TIERS.map((tier) => (
                            <tr key={tier.key} className="border-b border-separator/60">
                                <th scope="row" className="py-2 pr-3 text-left font-normal">
                                    {t(`tiers.${tier.key}`)}
                                </th>
                                <td className="py-2 text-right font-medium">
                                    {t("guide.tierFrom", { xp: tier.minXp.toLocaleString(locale) })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* Streak rules */}
            <section className="flex flex-col gap-2">
                <Typography.Heading level={2} weight="bold" className="text-lg">
                    {t("guide.streakSection")}
                </Typography.Heading>
                <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
                    <li>{t("guide.streakQualifying")}</li>
                    {/* KHÔNG có dòng "nhân XP theo streak" ở đây — xem chú thích hằng đã gỡ. */}
                    <li>{t("guide.streakReset")}</li>
                    <li>{t("guide.streakFreeze", { max: FREEZE.max, cost: FREEZE.cost })}</li>
                    <li>
                        {t("guide.streakRepair", {
                            window: REPAIR.windowHours,
                            perDay: REPAIR.costPerDay,
                            cap: REPAIR.costCap,
                        })}
                    </li>
                    <li>{t("guide.streakReminder", { hour: REMINDER.hour, min: REMINDER.minStreak })}</li>
                </ul>
                {/* Milestones */}
                <div className="mt-2 flex flex-col gap-2">
                    {STREAK_MILESTONES.map((milestone) => (
                        <Typography key={milestone.days} type="body-sm" color="muted">
                            {t("guide.milestoneRow", {
                                days: milestone.days,
                                // Static table → no backend name to fall back to; the shared
                                // resolver still humanizes the code rather than show a key path.
                                name: badgeLabel(milestone.badgeKey),
                                coin: milestone.coin,
                            })}
                        </Typography>
                    ))}
                </div>
            </section>

            {/* KHÔNG có mục "Mục tiêu" ở đây: xem chú thích hằng GOALS đã gỡ phía trên —
                `gamification.goal.completed` không có rule nào ⇒ 0 XP. Mục tiêu học nằm ở
                khối "Sắp ra mắt" bên dưới, đúng trạng thái thật của tính năng. */}

            {/* Coming soon */}
            <section className="flex flex-col gap-2 rounded-2xl border border-separator p-4">
                <Typography.Heading level={2} weight="bold" className="text-lg">
                    {t("guide.comingSoonSection")}
                </Typography.Heading>
                <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted">
                    <li>{t("guide.comingSoon.league")}</li>
                    <li>{t("guide.comingSoon.monthly")}</li>
                    <li>{t("guide.comingSoon.mysteryBox")}</li>
                </ul>
            </section>
        </div>
    )
}

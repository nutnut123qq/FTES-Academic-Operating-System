"use client"

import React, { useCallback } from "react"
import {
    Dropdown,
    Label,
} from "@heroui/react"
import {
    SquaresFourIcon,
    ChalkboardTeacherIcon,
    UserIcon,
    GearIcon,
    SignOutIcon,
    WalletIcon,
    PlusCircleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { pathConfig } from "@/resources/path"
import { useHasPermission } from "@/hooks/useHasPermission"
import { useAccountMenuOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useGetMyWalletSwr } from "@/hooks/swr/api/rest/queries/useGetMyWalletSwr"
import { useMutateSignOutSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSignOutSwr"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link AccountMenuAuthed}. */
export type AccountMenuAuthedProps = WithClassNames<undefined>

/**
 * Account dropdown menu for SIGNED-IN viewers: the dashboard hub, then "Khoá tôi dạy"
 * for lecturers only, then a primary section (Profile · Settings · Wallet with its live
 * balance + a top-up shortcut), and a separated destructive section (Sign out, danger).
 *
 * "Khóa học của tôi" (`/courses/me`) is OUT (2026-08-15): the dashboard Courses tab
 * already carries the same list — `MyCoursesProgress` reads the SAME
 * `GET /courses/me/enrollments` adapter (`useQueryMyCoursesSwr`) and renders EVERY
 * enrolment with its progress and resume link, not a truncated preview — so this row was
 * a second door onto content the row above it (Bảng điều khiển) already opens. Unlike
 * the `/saved` removal below, this orphans nothing: `/courses/me` is reached from the
 * dashboard → tab Khoá học → "Xem tất cả" on the `MyCoursesProgress` card, and from the
 * quest board's LESSON_COMPLETE CTA. (An earlier version of this note pointed at the home
 * landing's "Xem tất cả" instead — that band was dead code: the landing redirects every
 * signed-in viewer to `/dashboard`, so a signed-in-only band there never rendered.)
 * "Khoá tôi dạy" stays — the dashboard has no teaching surface at all.
 *
 * "Bảng điều khiển" is back as the FIRST row: it was dropped while `/dashboard` did
 * not exist, but the 4-tab cockpit now does and nothing else in the app links to it
 * (the navbar logo goes to the marketing landing), so removing it left the page
 * unreachable. Activity / Integrations / Roles stay out (Activity duplicated in the
 * profile, system-admin links out of scope). "Nhiệm vụ" also stays out — the quest
 * board is surfaced by the `DailyQuest` widget on the dashboard Overview tab, which
 * links on to the full `/quests` page — and so does "Xem lại hướng dẫn" (the welcome
 * tour still auto-starts for new users via `TourProvider`; the manual replay entry
 * was dropped with `ReplayGuideItem`).
 *
 * "Đã lưu / Yêu thích" (`/saved`) is now OUT of the primary section too (product call
 * 2026-08-13: trim the menu to the rows people actually use). Note the side effect —
 * this row was the ONLY in-app link to `/saved`, so the route is now reachable by URL
 * only; the community shell's "Đã lưu" tab is a DIFFERENT surface (`/community/saved`).
 * Re-add a link elsewhere before treating `/saved` as live navigation.
 *
 * Self-contained — owns navigation (closes the menu then pushes) and the sign-out
 * mutation; takes no data props.
 *
 * @param props - optional className (placement only).
 */
export const AccountMenuAuthed = ({ className }: AccountMenuAuthedProps) => {
    const t = useTranslations()
    const router = useRouter()
    const { close } = useAccountMenuOverlayState()
    const signOut = useMutateSignOutSwr()
    // Wallet balance shown inline on the Wallet row (auth-gated hook → undefined
    // for guests / before load, in which case the balance chip is simply omitted).
    const walletBalance = useGetMyWalletSwr().data?.balance
    // Lecturer-only "Khoá tôi dạy" entry — same gate as the interview manage panel
    // (`ai.teacher.use`); a non-lecturer never sees the teaching link.
    const isLecturer = useHasPermission("ai.teacher.use")

    /** Close the menu, then navigate. */
    const go = useCallback(
        (path: string) => {
            close()
            router.push(path)
        },
        [close, router],
    )

    /**
     * Close the menu, sign out, then LEAVE the current route.
     *
     * The redirect is not cosmetic: the mutation only clears the token + redux session,
     * it does not navigate, so signing out from a session-scoped page (`/dashboard`,
     * `/courses/me`, `/wallet`) left the just-signed-out viewer parked on it reading
     * empty widgets. `replace`, not `push` — Back must not walk into the page they were
     * signed out of. `home()` is the UNGATED `/home` landing, which never forwards
     * anyone — the right destination for someone who is a GUEST again the moment the
     * sign-out resolves. (The bare locale root `/` would also be reachable — `proxy.ts`
     * gates only `/admin` — but it forwards signed-in visitors to the dashboard, so it is
     * the wrong shape of destination to lean on here.)
     *
     * Order: `close()` runs FIRST, while it is still synchronous — the awaited sign-out
     * flips `authenticated` to false in its `finally`, which swaps this menu for
     * `AccountMenuGuest` and unmounts us, so anything queued after the await fires from
     * a dead component. `router` (a stable app-router handle) and the zustand `close`
     * both survive that, but only `router.replace` still needs to run by then.
     */
    const onLogout = useCallback(
        async () => {
            close()
            await signOut.trigger()
            router.replace(pathConfig().locale().home().build())
        },
        [close, router, signOut],
    )

    return (
        <Dropdown.Menu className={className}>
            {/* "Bảng điều khiển" (/dashboard) — the signed-in home: 4-tab cockpit over
                progress, feed, courses and standing. First row because it is the hub the
                other entries are reachable FROM; the navbar logo deliberately still points
                at the marketing landing, so this menu is the only way in. */}
            <Dropdown.Section>
                <Dropdown.Item
                    id="dashboard"
                    textValue={t("nav.dashboard")}
                    onPress={() => go(pathConfig().locale().dashboard().build())}
                >
                    <SquaresFourIcon className="size-5" />
                    <Label>{t("nav.dashboard")}</Label>
                </Dropdown.Item>
            </Dropdown.Section>
            {/* "Khóa học của tôi" (`/courses/me`) đã BỎ khỏi menu này — xem docblock.
                Chỉ còn "Khoá tôi dạy", và cả mục này biến mất với người không phải giảng
                viên (section rỗng chỉ đẻ thêm một đường kẻ). */}
            {isLecturer ? (
                <Dropdown.Section>
                    <Dropdown.Item
                        id="teaching"
                        textValue={t("nav.teaching")}
                        onPress={() => go(pathConfig().locale().course().teaching().build())}
                    >
                        <ChalkboardTeacherIcon className="size-5" />
                        <Label>{t("nav.teaching")}</Label>
                    </Dropdown.Item>
                </Dropdown.Section>
            ) : null}
            {/* Mục "Khám phá" (chỉ còn 1 dòng "Trợ lý học tập FrosTES" → /ai) đã BỎ:
                linh vật nổi ở góc phải dưới giờ là điểm vào DUY NHẤT của mọi tính năng AI
                (xem `mascot-assistant/options.ts`), giữ thêm lối này chỉ là 2 cửa cho cùng
                1 chỗ. Route /ai vẫn sống, chỉ đổi chỗ bấm vào. */}
            <Dropdown.Section>
                <Dropdown.Item
                    id="profile"
                    textValue={t("nav.profile")}
                    onPress={() => go(pathConfig().locale().profile().build())}
                >
                    <UserIcon className="size-5" />
                    <Label>{t("nav.profile")}</Label>
                </Dropdown.Item>
                {/* "Đã lưu / Yêu thích" (/saved) đã BỎ khỏi mục này — xem docblock. */}
                <Dropdown.Item
                    id="settings"
                    textValue={t("profileSettings.title")}
                    onPress={() => go(pathConfig().locale().profile().settings().build())}
                >
                    <GearIcon className="size-5" />
                    <Label>{t("profileSettings.title")}</Label>
                </Dropdown.Item>
                {/* Wallet: live balance shown inline; the trailing "+" affordance and
                    the row itself open the wallet surface (where top-up lives). */}
                <Dropdown.Item
                    id="wallet"
                    textValue={t("nav.wallet")}
                    onPress={() => go(pathConfig().locale().wallet().build())}
                >
                    <WalletIcon className="size-5" />
                    <Label>{t("nav.wallet")}</Label>
                    <span className="ml-auto flex items-center gap-2">
                        {walletBalance !== undefined ? (
                            <span className="text-sm font-medium text-foreground">
                                {walletBalance.toLocaleString()}
                            </span>
                        ) : null}
                        <PlusCircleIcon
                            className="size-5 text-accent"
                            aria-label={t("wallet.actions.topup")}
                            focusable="false"
                        />
                    </span>
                </Dropdown.Item>
            </Dropdown.Section>
            <Dropdown.Section>
                <Dropdown.Item
                    id="logout"
                    textValue={t("nav.logout")}
                    className="text-danger"
                    onPress={onLogout}
                >
                    <SignOutIcon className="size-5" />
                    <Label className="text-danger">{t("nav.logout")}</Label>
                </Dropdown.Item>
            </Dropdown.Section>
        </Dropdown.Menu>
    )
}

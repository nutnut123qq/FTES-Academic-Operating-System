import React from "react"
import { NavRail } from "../CommunityShell/NavRail"
import { PromoBanner } from "../CommunityShell/PromoBanner"

/** Props for {@link CommunityNavShell}. */
interface CommunityNavShellProps {
    /** The routed page rendered in the content column. */
    children: React.ReactNode
}

/**
 * Khung điều hướng dùng chung cho các bề mặt CỦA cộng đồng nằm NGOÀI cây route
 * `/community` — `/groups`, `/events`, `/blog` (góp ý #21).
 *
 * Vì sao cần: rail trái (`NavRail`) trước đây chỉ được `CommunityShell` render, mà
 * `CommunityShell` là layout của `/community/**`. Ba trong số các đích rail trỏ tới
 * lại nằm ngoài cây đó, nên bấm vào là RƠI RA KHỎI khung điều hướng: không rail,
 * không biết mình đang ở đâu, và đường về duy nhất là nút "<" của trình duyệt.
 *
 * Shell này CỐ TÌNH chỉ có rail + cột nội dung, KHÔNG mang theo tab feed (For You /
 * Following / Campus / Trending) — tab đó là bộ lọc phạm vi của riêng bảng tin, đặt
 * trên trang danh sách nhóm hay bài blog thì vô nghĩa. Cũng không mang `DiscoveryRail`:
 * catalog sự kiện / danh sách nhóm cần bề ngang cho lưới card, thêm cột thứ ba là bóp
 * đúng thứ trang đó tồn tại để hiển thị.
 *
 * Bề ngang container bám đúng `CommunityShell` (1280 ở `xl`, 1520 từ `2xl` — bề ngang
 * chung của site). Rail chỉ hiện từ `xl` y như `CommunityShell`: dưới `xl` đây là một
 * cột duy nhất, các trang tự lo lối ra bằng `BackLink`.
 */
export const CommunityNavShell = ({ children }: CommunityNavShellProps) => (
    <div className="mx-auto w-full xl:grid xl:max-w-[1280px] xl:grid-cols-[minmax(0,260px)_minmax(0,1fr)] xl:items-start xl:gap-6 xl:px-6 2xl:max-w-[1520px]">
        {/* left nav rail — xl+ only; sticky below the h-16 site header, same as CommunityShell */}
        <aside className="hidden pt-3 xl:sticky xl:top-20 xl:block xl:self-start">
            <div className="flex flex-col gap-3">
                <NavRail />
                <PromoBanner />
            </div>
        </aside>
        {/* `min-w-0` để lưới/bảng bên trong không đẩy track grid phình ra ngoài container */}
        <div className="min-w-0">{children}</div>
    </div>
)

/**
 * Ảnh bìa môn học — ảnh thật nếu có, không thì một khối MANG MÃ MÔN thay cho ô trống.
 *
 * Vì sao cần: catalog đang có ~460 môn mà gần như môn nào cũng chưa ai tải ảnh bìa lên, nên
 * chỗ ảnh trước đây là cùng MỘT vệt gradient lặp lại — cuộn cả trang chỉ thấy một dải màu,
 * không phân biệt được thẻ nào với thẻ nào. Mã môn là thứ sinh viên gọi hằng ngày ("DBI202",
 * "PRF192"), nên in chính nó lên bìa vừa lấp chỗ trống vừa giúp quét mắt.
 *
 * Màu suy từ MÃ MÔN chứ không random: cùng một môn phải ra cùng một màu ở mọi lần render,
 * mọi trang, mọi máy — random (hoặc theo index trong lưới) thì môn đổi màu mỗi lần lọc/phân
 * trang, và ảnh bìa lúc đó là nhiễu chứ không phải dấu nhận dạng.
 */
"use client"

import React, { useState } from "react"

/** Số cung màu rời nhau lấy từ mã môn. 12 nấc ⇒ hai môn cạnh nhau khó trùng mắt thường. */
const HUE_STEPS = 12

/**
 * Băm mã môn thành một cung màu ổn định (djb2 rút gọn).
 *
 * Không dùng `String.hashCode` kiểu Java (nhân 31) vì mã môn chỉ khác nhau ở 1-2 ký tự cuối
 * (CSD201/CSD203) — hệ số 31 cho ra hai giá trị sát nhau, chia 12 lại rơi vào cùng một nấc.
 */
const hueOf = (code: string): number => {
    let hash = 5381
    for (let i = 0; i < code.length; i += 1) {
        hash = ((hash << 5) + hash + code.charCodeAt(i)) | 0
    }
    return (Math.abs(hash) % HUE_STEPS) * (360 / HUE_STEPS)
}

/** Props for {@link SubjectCover}. */
interface SubjectCoverProps {
    /** Mã môn — vừa là chữ in trên bìa, vừa là hạt giống màu. */
    code: string
    /** Tên môn, dùng cho `alt` của ảnh thật. */
    name: string
    /** Ảnh bìa thật, `null` khi môn chưa có artwork. */
    imageUrl: string | null
    /** Cỡ chữ mã môn; `card` cho lưới catalog, `banner` cho header workspace. */
    size?: "card" | "banner"
    /** Lớp phủ thêm cho khung ngoài (bo góc, chiều cao...). */
    className?: string
}

/**
 * Khung ảnh bìa dùng chung cho thẻ catalog và header workspace.
 *
 * Ảnh hỏng (404, host chặn) rơi về đúng khối mã môn chứ không để lại glyph vỡ — cùng quy ước
 * `onError` mà hai chỗ gọi vẫn đang dùng, nay gom về một nơi.
 */
export const SubjectCover = ({
    code,
    name,
    imageUrl,
    size = "card",
    className = "",
}: SubjectCoverProps) => {
    const [broken, setBroken] = useState(false)
    const src = broken ? null : imageUrl
    const hue = hueOf(code)

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Nền luôn vẽ, kể cả khi có ảnh: ảnh chân dung/PNG trong suốt vẫn có nền tử tế
                thay vì lộ màu nền trang. */}
            <div
                aria-hidden
                className="absolute inset-0"
                style={{
                    backgroundImage:
                        `linear-gradient(135deg, hsl(${hue} 62% 46%) 0%, ` +
                        `hsl(${(hue + 28) % 360} 58% 34%) 100%)`,
                }}
            />
            {src !== null ? (
                <img
                    src={src}
                    alt={name}
                    className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={() => setBroken(true)}
                />
            ) : (
                <>
                    {/* Chữ nền mờ tràn viền — làm khối có chiều sâu, không phải ô chữ phẳng. */}
                    <span
                        aria-hidden
                        className={
                            "pointer-events-none absolute -bottom-[0.18em] -right-[0.06em] font-black leading-none tracking-tight text-white/10 " +
                            (size === "banner" ? "text-[9rem] sm:text-[12rem]" : "text-[5.5rem]")
                        }
                    >
                        {code}
                    </span>
                    {/* Mã môn đọc được — đây mới là thứ thay cho ảnh, nên nó nằm giữa và rõ.
                        `aria-hidden` vì tên + mã môn đã có trong phần chữ ngay dưới bìa; đọc
                        lại lần nữa cho trình đọc màn hình là thừa. */}
                    <span
                        aria-hidden
                        className={
                            "absolute inset-0 flex items-center justify-center font-bold tracking-[0.12em] text-white drop-shadow-sm " +
                            (size === "banner" ? "text-3xl sm:text-5xl" : "text-2xl")
                        }
                    >
                        {code}
                    </span>
                </>
            )}
        </div>
    )
}

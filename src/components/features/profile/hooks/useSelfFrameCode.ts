"use client"

import useSWR from "swr"
import { getSelfProfile } from "@/modules/api/rest/profile"
import { useSelfProfileKey } from "./useQueryProfileSwr"

/**
 * Mã KHUNG VIỀN mà NGƯỜI DÙNG HIỆN TẠI đang đeo (`SelfProfile.avatarFrame`), để mọi chỗ
 * hiển thị avatar của CHÍNH họ (navbar, menu tài khoản, ô soạn bình luận, header hồ sơ)
 * đều vẽ đúng khung — không chỉ ở màn chọn khung.
 *
 * <p>Đọc qua khoá SWR dùng chung ({@link useSelfProfileKey}) nên KHÔNG thêm request:
 * ăn ké bản chụp `GET /profiles/me` mà các trang hồ sơ đã tải. Khách vãng lai → key
 * null → không fetch → trả `null` (không khung).
 *
 * @returns mã khung, hoặc `null` khi chưa đăng nhập / chưa tải / không đeo khung.
 */
export const useSelfFrameCode = (): string | null => {
    const { data } = useSWR(useSelfProfileKey(), getSelfProfile)
    return data?.avatarFrame?.code ?? null
}

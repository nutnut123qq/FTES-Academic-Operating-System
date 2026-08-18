"use client"

import useSWR from "swr"
import { getAppearanceCatalog, type AvatarFrameView } from "@/modules/api/rest/profile"
import { useAppSelector } from "@/redux/hooks"

/**
 * Danh mục KHUNG VIỀN avatar, tra theo mã.
 *
 * <p>Bảng xếp hạng trả về mã khung của từng người (`avatarFrame`), còn hình dáng khung nằm
 * ở danh mục `profile.avatar_frames`. Hook này nạp danh mục MỘT lần cho cả trang: khoá SWR
 * cố định nên mọi component gọi nó dùng chung một bản chụp, không phải mỗi dòng một request.
 *
 * <p><b>Hỏng ở đây KHÔNG được làm hỏng bảng.</b> Khung là phần thưởng trang trí; mất danh
 * mục nghĩa là mọi người hiện avatar trần — vẫn đọc được thứ hạng, vẫn đúng số. Nên hook
 * nuốt lỗi và trả hàm tra rỗng thay vì đẩy lỗi lên chặn cả bảng.
 */
export const useAvatarFrames = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    const { data } = useSWR(
        authenticated ? (["GET_APPEARANCE_CATALOG_SWR"] as const) : null,
        () => getAppearanceCatalog(),
        {
            shouldRetryOnError: false,
            // Danh mục chỉ đổi khi chạy seed — revalidate mỗi lần focus là tốn request cho
            // dữ liệu đứng yên.
            revalidateOnFocus: false,
            revalidateIfStale: false,
        },
    )

    const byCode = new Map((data?.frames ?? []).map((frame) => [frame.code, frame]))

    /** `null` khi không đeo khung, mã lạ, hoặc danh mục chưa/không tải được. */
    return (code: string | null): AvatarFrameView | null => (code ? byCode.get(code) ?? null : null)
}

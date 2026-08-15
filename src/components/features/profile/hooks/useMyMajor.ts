"use client"

import useSWR from "swr"
import { useLocale } from "next-intl"
import { getSelfProfile, updateSelfProfile } from "@/modules/api/rest/profile"
import { useSelfProfileKey } from "./useQueryProfileSwr"

/**
 * NGÀNH HỌC của người đang đăng nhập (BE V335) + cách đặt nó.
 *
 * Đọc qua đúng key self-profile chung ({@link useSelfProfileKey}) nên KHÔNG phát sinh request
 * riêng: nó dùng chung cache với các tab hồ sơ, và với khách chưa đăng nhập thì key là `null`
 * ⇒ không gọi API, không 401.
 *
 * Ba trạng thái phải phân biệt được, đừng gộp:
 *   • `isLoading` — chưa biết (đừng vội hiện màn chọn ngành, sẽ nháy);
 *   • `majorCode === null` + `isLoading === false` — CHƯA chọn ngành (đây là lúc mời chọn);
 *   • có mã — đã chọn.
 */
export const useMyMajor = () => {
    const locale = useLocale()
    const key = useSelfProfileKey()
    const { data, isLoading, mutate } = useSWR(key, getSelfProfile)

    const academic = data?.academic ?? null
    const vietnamese = locale.startsWith("vi")
    const name = academic
        ? (vietnamese ? academic.majorNameVi : academic.majorName)
            || academic.majorNameVi
            || academic.majorName
            || null
        : null

    /**
     * Ghi ngành lên hồ sơ. Chuỗi rỗng = bỏ chọn (quy ước của BE: `null` là "không đổi").
     * Ném lỗi lên caller khi BE từ chối mã — caller quyết định hiển thị thế nào.
     */
    const setMajor = async (majorCode: string) => {
        await updateSelfProfile({ majorCode })
        await mutate()
    }

    return {
        majorCode: academic?.majorCode ?? null,
        majorName: name,
        /** `true` khi đã biết chắc người dùng đăng nhập nhưng chưa chọn ngành. */
        needsMajor: Boolean(key) && !isLoading && Boolean(data) && !academic?.majorCode,
        isLoading: Boolean(key) && isLoading,
        setMajor,
        mutate,
    }
}

"use client"

import useSWR from "swr"
import { useLocale } from "next-intl"
import { listMajors } from "@/modules/api/rest/subject/subject"
import type { MajorView } from "@/modules/api/rest/subject/types"

/** SWR key của danh mục ngành — dùng chung để màn onboarding và bộ lọc workplace chỉ fetch một lần. */
export const MAJORS_KEY = ["subjects", "majors"] as const

/** Một ngành đã chọn sẵn tên theo locale đang bật. */
export interface Major {
    /** Mã ngành — thứ gửi lên BE (`?major=`, `PATCH /profiles/me { majorCode }`). */
    code: string
    /** Tên hiển thị theo locale hiện tại. */
    name: string
    description: string | null
}

/** Tên ngành theo locale: `vi` lấy `nameVi`, còn lại lấy `name`; thiếu thì rơi về cái kia rồi tới mã. */
export const pickMajorName = (locale: string, major: MajorView): string => {
    const vietnamese = locale.startsWith("vi")
    const preferred = vietnamese ? major.nameVi : major.name
    return preferred || major.nameVi || major.name || major.code
}

/**
 * Danh mục ngành từ BE (`GET /api/v1/majors`, public).
 *
 * Danh sách RỖNG là trạng thái HỢP LỆ — bản BE chưa deploy V336 trả 404/không có endpoint, và
 * danh mục cũng có thể chưa được nhập. Mọi chỗ dùng phải tự ẩn phần chọn ngành khi rỗng thay vì
 * hiện khung trống.
 */
export const useQueryMajorsSwr = () => {
    const locale = useLocale()
    const { data, isLoading, error } = useSWR(MAJORS_KEY, listMajors, {
        // Danh mục ngành gần như tĩnh — không cần refetch mỗi lần focus lại tab.
        revalidateOnFocus: false,
    })
    // Map NGOÀI fetcher: tên phụ thuộc locale, để trong fetcher thì bản đã map bị cache theo key
    // và đổi ngôn ngữ vẫn ra tên cũ (cùng lý do với useQuerySubjectsSwr).
    const majors: Array<Major> = (data ?? []).map((row) => ({
        code: row.code,
        name: pickMajorName(locale, row),
        description: row.description ?? null,
    }))
    return { majors, isLoading, error }
}

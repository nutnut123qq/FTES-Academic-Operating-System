"use client"

import useSWR from "swr"
import useSWRInfinite from "swr/infinite"
import { useLocale } from "next-intl"
import { listSubjects } from "@/modules/api/rest/subject/subject"
import type { SubjectSummary } from "@/modules/api/rest/subject/types"
import { toSubjectFromSummary, type Subject } from "./useQuerySubjectSwr"

/** Kỳ học hợp lệ của catalog (BE `recommended_semester` là `smallint CHECK BETWEEN 1 AND 9`). */
export const SUBJECT_SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

/** Giá trị bộ lọc kỳ: một kỳ cụ thể, hoặc `null` = "Tất cả". */
export type SubjectSemesterFilter = (typeof SUBJECT_SEMESTERS)[number] | null

/** Một trang lưới catalog. 24 = bội của 1/2/3 cột nên hàng cuối không bị lẻ ở mọi breakpoint. */
export const SUBJECT_PAGE_SIZE = 24

/** Bộ lọc catalog — TẤT CẢ chạy server-side, xem {@link useQuerySubjectsSwr}. */
export interface SubjectCatalogFilters {
    /** Kỳ học, `null` = tất cả. */
    semester?: SubjectSemesterFilter
    /** Mã ngành/chuyên ngành, `null` = tất cả ngành. Mã khối gồm cả chuyên ngành con (BE). */
    major?: string | null
    /** Từ khoá tìm theo mã/tên môn, chuỗi rỗng = không tìm. */
    q?: string | null
}

/**
 * Một trang catalog từ BE (`GET /api/v1/subjects?semester=&major=&q=&page=&size=`).
 *
 * Tham số `null` KHÔNG được gửi: axios serialize `null` thành `semester=` và BE đọc ra chuỗi
 * rỗng chứ không phải "bỏ lọc".
 */
export const fetchSubjectCatalogPage = async (
    filters: SubjectCatalogFilters,
    page: number,
    size: number = SUBJECT_PAGE_SIZE,
): Promise<Array<SubjectSummary>> =>
    (
        await listSubjects({
            semester: filters.semester ?? null,
            major: filters.major ?? null,
            q: filters.q?.trim() ? filters.q.trim() : null,
            page,
            size,
        })
    ).items

/**
 * Catalog môn từ BE, LỌC VÀ PHÂN TRANG Ở SERVER.
 *
 * Bản trước tải một trang 100 môn rồi lọc ngành + tìm kiếm bằng JavaScript. Cách đó chỉ đúng
 * khi catalog nhỏ hơn 100 môn; từ khi seed syllabus FPT (397 môn) thì nó cắt cụt danh sách một
 * cách IM LẶNG — người dùng lọc ra "ngành của tôi" mà thiếu môn, và không có dấu hiệu gì báo
 * là đang thiếu. Vì vậy cả ba bộ lọc đều nằm trong SWR key và đi thẳng xuống BE.
 *
 * Trang tiếp theo nạp qua `loadMore` (dùng với `InfiniteScrollSentinel` như feed cộng đồng).
 */
export const useQuerySubjectsSwr = (filters: SubjectCatalogFilters = {}) => {
    const locale = useLocale()
    const { semester = null, major = null, q = null } = filters
    const { data, isLoading, isValidating, error, size, setSize } = useSWRInfinite(
        (index, previous: Array<SubjectSummary> | null) => {
            // Trang trước ngắn hơn kích thước trang ⇒ đã hết, đừng hỏi trang sau.
            if (previous && previous.length < SUBJECT_PAGE_SIZE) {
                return null
            }
            return ["subjects", "catalog", semester, major, q, index] as const
        },
        ([, , pageSemester, pageMajor, pageQuery, index]) =>
            fetchSubjectCatalogPage(
                { semester: pageSemester, major: pageMajor, q: pageQuery },
                index,
            ),
        { revalidateFirstPage: false },
    )

    const pages = data ?? []
    // Map NGOÀI fetcher: tên môn phụ thuộc locale, để trong fetcher thì bản đã map bị cache
    // theo key và đổi ngôn ngữ vẫn ra tên cũ (hoặc phải nhét locale vào key → fetch lại thừa).
    const subjects: Array<Subject> = pages
        .flat()
        .map((row) => toSubjectFromSummary(row, locale))
    const last = pages[pages.length - 1]

    return {
        subjects,
        isLoading,
        error,
        /** Còn trang sau: trang cuối vừa nạp đầy đúng kích thước trang. */
        hasMore: last !== undefined && last.length === SUBJECT_PAGE_SIZE,
        isLoadingMore: isValidating && pages.length < size,
        loadMore: () => void setSize((current) => current + 1),
    }
}

/**
 * Danh sách môn cho một `<select>` (form tải tài nguyên): một lượt, không phân trang.
 *
 * ponytail: trần 500 môn — catalog syllabus hiện có 397. Vượt trần thì đổi ô chọn này thành
 * ô tìm-kiếm-gọi-BE chứ đừng nâng số lên tiếp, tải cả nghìn dòng vào một thẻ select là hỏng
 * cả hai đầu.
 */
export const useQuerySubjectOptionsSwr = () => {
    const locale = useLocale()
    const { data, isLoading, error } = useSWR(["subjects", "options"], () =>
        fetchSubjectCatalogPage({}, 0, 500),
    )
    const subjects: Array<Subject> = (data ?? []).map((row) => toSubjectFromSummary(row, locale))
    return { subjects, isLoading, error }
}

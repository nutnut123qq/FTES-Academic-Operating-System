"use client"

import useSWR from "swr"
import { useLocale } from "next-intl"
import { listSubjects } from "@/modules/api/rest/subject/subject"
import type { SubjectSummary } from "@/modules/api/rest/subject/types"
import { toSubjectFromSummary, type Subject } from "./useQuerySubjectSwr"

/** Kỳ học hợp lệ của catalog (BE `recommended_semester` là `smallint CHECK BETWEEN 1 AND 9`). */
export const SUBJECT_SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

/** Giá trị bộ lọc kỳ: một kỳ cụ thể, hoặc `null` = "Tất cả". */
export type SubjectSemesterFilter = (typeof SUBJECT_SEMESTERS)[number] | null

/**
 * Đọc catalog môn từ BE. Lọc theo KỲ chạy SERVER-SIDE (`GET /api/v1/subjects?semester=`);
 * `null` = "Tất cả" và KHÔNG gửi tham số `semester` — BE hiểu thiếu tham số là không lọc,
 * gửi `semester=null` lại là chuỗi rỗng trên query string.
 */
export const fetchSubjectCatalog = async (
    semester: SubjectSemesterFilter,
): Promise<Array<SubjectSummary>> => (await listSubjects({ semester, size: 100 })).items

/**
 * Loads the subject catalog from the real BE (`GET /api/v1/subjects`, public).
 * Maps each {@link import("@/modules/api/rest/subject/types").SubjectSummary} row to
 * the FE {@link Subject} the catalog + workspace share. Lọc theo kỳ đi qua BE (nằm
 * trong SWR key nên đổi kỳ là fetch lại); riêng ô tìm kiếm vẫn lọc client-side.
 *
 * @param semester - kỳ cần lọc, `null` để lấy mọi kỳ.
 */
export const useQuerySubjectsSwr = (semester: SubjectSemesterFilter = null) => {
    const locale = useLocale()
    const { data, isLoading, error } = useSWR(["subjects", "catalog", semester], () =>
        fetchSubjectCatalog(semester),
    )
    // Map NGOÀI fetcher: tên môn phụ thuộc locale, để trong fetcher thì bản đã map bị cache
    // theo key và đổi ngôn ngữ vẫn ra tên cũ (hoặc phải nhét locale vào key → fetch lại thừa).
    const subjects: Array<Subject> = (data ?? []).map((row) => toSubjectFromSummary(row, locale))
    return { subjects, isLoading, error }
}

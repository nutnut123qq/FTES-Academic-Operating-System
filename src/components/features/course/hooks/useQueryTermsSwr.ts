"use client"

import useSWR from "swr"
import { listTerms } from "@/modules/api/rest/course"

/**
 * Loads the academic terms behind the catalog's "Kỳ học" facet from the PUBLIC
 * endpoint (`GET /api/v1/terms`). The key is fixed — the list is public and not
 * viewer-scoped, so every visitor (signed in or not) shares one cache entry.
 *
 * Trả về ĐÚNG `terms` — không `isLoading`/`error`: thiết kế của facet là "lỗi hoặc rỗng
 * thì không có facet", nên hai trạng thái kia không có nhánh render nào để đi vào.
 *
 * `terms` defaults to `[]` so a failed or empty fetch degrades to "no facet"
 * instead of breaking the page: an empty list means `FacetSortBar` renders no term
 * control, and the catalog behaves exactly as it did before the facet existed.
 * Rows are used verbatim in the BE's order (newest `startsAt` first).
 */
export const useQueryTermsSwr = () => {
    const { data } = useSWR(["course-terms"], () => listTerms())
    return { terms: data ?? [] }
}

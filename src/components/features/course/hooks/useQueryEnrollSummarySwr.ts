"use client"

import useSWR from "swr"

/** Enroll/checkout summary for a course (§4/§13, mock until BE lands). */
export interface EnrollSummary {
    code: string
    name: string
    credits: number
    priceLabel: string
}

// ponytail: mock BE — no enroll endpoint yet. Derives from the id.
const fetchEnrollSummaryMock = async (courseId: string): Promise<EnrollSummary> => ({
    code: courseId.toUpperCase(),
    name: "Lập trình C",
    credits: 3,
    priceLabel: "499.000₫",
})

/** Loads a course's enroll summary. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryEnrollSummarySwr = (courseId: string) => {
    const { data, isLoading, error } = useSWR(
        ["enroll-summary", courseId],
        () => fetchEnrollSummaryMock(courseId),
    )
    return { summary: data, isLoading, error }
}

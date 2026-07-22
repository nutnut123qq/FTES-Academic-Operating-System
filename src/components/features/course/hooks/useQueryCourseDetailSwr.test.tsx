import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Hook — real `isPurchased` on the course detail (learn-engagement-wire task 5.2
 * quality loop). Pins the three resolution branches:
 *  1. me/enrollments MATCHES → `EnrollmentView.isPurchased` is the truth (paid vs
 *     free-enroll), and the `me/access` fallback is never engaged,
 *  2. FALLBACK — signed in, enrollments loaded, no match (package buyer without an
 *     enrollment row) → `GET /courses/{rawId}/me/access` recovers purchased/enrolled,
 *  3. ERROR / anonymous — the enrollments call failing (or no token) degrades to the
 *     sales card (`isEnrolled/isPurchased` false), never an exception.
 */

const detailMock = vi.fn()
const enrollmentsMock = vi.fn()
const accessMock = vi.fn()

vi.mock("@/modules/api/rest/course", () => ({
    getCourseDetail: (slug: string) => detailMock(slug),
    getMyEnrollments: () => enrollmentsMock(),
}))
vi.mock("@/hooks/swr/api/rest/queries", () => ({
    useGetMyCourseAccessSwr: (courseRawId: string | undefined) => accessMock(courseRawId),
}))

import { useQueryCourseDetailSwr } from "./useQueryCourseDetailSwr"

/** Minimal BE detail DTO for a course routed by `slug`. */
const detailDto = (slug: string) => ({
    course: {
        id: `uuid-${slug}`,
        slugName: slug,
        courseCode: "PRF192",
        title: "Khóa test",
        saleMode: "PACKAGE",
        level: "BEGINNER",
        imageHeader: "",
        salePrice: "100000",
        totalPrice: "200000",
        avgStar: "4.5",
        ratingCount: 3,
        totalUser: 10,
    },
    description: "",
    contentCourse: "",
    sections: [],
})

const enrollment = (slug: string, isPurchased: boolean) => ({
    courseId: `uuid-${slug}`,
    courseTitle: "Khóa test",
    slugName: slug,
    active: true,
    completionPercent: "0",
    isPurchased,
})

beforeEach(() => {
    detailMock.mockReset()
    enrollmentsMock.mockReset()
    accessMock.mockReset()
    accessMock.mockReturnValue({ data: undefined })
    window.localStorage.clear()
})

// NOTE: SWR's cache is module-global — every test uses a distinct course slug.

describe("useQueryCourseDetailSwr — isPurchased resolution", () => {
    it("reads isPurchased from the matching active enrollment (no access fallback)", async () => {
        window.localStorage.setItem("keycloak:access_token", "tok")
        detailMock.mockResolvedValue(detailDto("khoa-paid"))
        enrollmentsMock.mockResolvedValue([enrollment("khoa-paid", true)])

        const { result } = renderHook(() => useQueryCourseDetailSwr("khoa-paid"))
        await waitFor(() => expect(result.current.course?.enrollment?.isPurchased).toBe(true))
        expect(result.current.course?.enrollment?.isEnrolled).toBe(true)
        // The matched enrollment answers everything — me/access must stay disabled.
        expect(accessMock).not.toHaveBeenCalledWith(expect.stringContaining("uuid-"))
    })

    it("keeps a FREE enrollment enrolled but NOT purchased", async () => {
        window.localStorage.setItem("keycloak:access_token", "tok")
        detailMock.mockResolvedValue(detailDto("khoa-free"))
        enrollmentsMock.mockResolvedValue([enrollment("khoa-free", false)])

        const { result } = renderHook(() => useQueryCourseDetailSwr("khoa-free"))
        await waitFor(() => expect(result.current.course?.enrollment?.isEnrolled).toBe(true))
        expect(result.current.course?.enrollment?.isPurchased).toBe(false)
    })

    it("falls back to me/access when a package buyer has no enrollment row", async () => {
        window.localStorage.setItem("keycloak:access_token", "tok")
        detailMock.mockResolvedValue(detailDto("khoa-pkg"))
        enrollmentsMock.mockResolvedValue([])
        accessMock.mockImplementation((courseRawId: string | undefined) =>
            courseRawId === "uuid-khoa-pkg"
                ? {
                    data: {
                        courseId: "uuid-khoa-pkg",
                        enrolled: true,
                        purchased: true,
                        fullAccess: true,
                    },
                }
                : { data: undefined },
        )

        const { result } = renderHook(() => useQueryCourseDetailSwr("khoa-pkg"))
        await waitFor(() => expect(result.current.course?.enrollment?.isPurchased).toBe(true))
        expect(result.current.course?.enrollment?.isEnrolled).toBe(true)
        // The fallback was keyed on the REAL course UUID from the detail.
        expect(accessMock).toHaveBeenCalledWith("uuid-khoa-pkg")
    })

    it("degrades to the sales card when the enrollments call fails", async () => {
        window.localStorage.setItem("keycloak:access_token", "tok")
        detailMock.mockResolvedValue(detailDto("khoa-err"))
        enrollmentsMock.mockRejectedValue(new Error("500"))

        const { result } = renderHook(() => useQueryCourseDetailSwr("khoa-err"))
        await waitFor(() => expect(result.current.course).toBeTruthy())
        await waitFor(() => expect(result.current.course?.enrollment).toBeTruthy())
        expect(result.current.course?.enrollment?.isPurchased).toBe(false)
        expect(result.current.course?.enrollment?.isEnrolled).toBe(false)
    })

    it("never calls enrollments for an anonymous viewer and defaults to the sales card", async () => {
        detailMock.mockResolvedValue(detailDto("khoa-anon"))

        const { result } = renderHook(() => useQueryCourseDetailSwr("khoa-anon"))
        await waitFor(() => expect(result.current.course).toBeTruthy())
        expect(enrollmentsMock).not.toHaveBeenCalled()
        expect(result.current.course?.enrollment?.isPurchased).toBe(false)
        // access fallback stays disabled without a token
        expect(accessMock).not.toHaveBeenCalledWith(expect.stringContaining("uuid-"))
    })
})

import { describe, expect, it } from "vitest"
import { pickMajorName } from "./useQueryMajorsSwr"
import { toSubjectFromSummary } from "./useQuerySubjectSwr"
import { toAcademic } from "@/components/features/profile/hooks/useQueryProfileAcademicSwr"
import type { MajorView, SubjectSummary } from "@/modules/api/rest/subject/types"
import type { SelfProfile } from "@/modules/api/rest/profile"

const SE: MajorView = {
    id: "9a1f0001-0000-4000-8000-000000000001",
    code: "SE",
    name: "Software Engineering",
    nameVi: "Kỹ Thuật Phần Mềm",
}

const summary = (majors?: Array<MajorView>): SubjectSummary => ({
    id: "uuid-1",
    code: "PRF192",
    name: "Programming Fundamentals",
    nameVi: "Nhập môn lập trình",
    credits: 3,
    recommendedSemester: 1,
    difficulty: "MEDIUM",
    thumbnailUrl: "",
    status: "PUBLISHED",
    majors,
})

const selfProfile = (academic: Partial<NonNullable<SelfProfile["academic"]>>): SelfProfile =>
    ({ academic: { university: null, campus: null, major: null, currentSemester: null,
        gpa: null, studentCode: null, enrollmentYear: null, ...academic } }) as SelfProfile

describe("tên ngành theo locale", () => {
    it("vi lấy nameVi, en lấy name", () => {
        expect(pickMajorName("vi", SE)).toBe("Kỹ Thuật Phần Mềm")
        expect(pickMajorName("en", SE)).toBe("Software Engineering")
    })

    it("thiếu tên ở locale đang bật thì rơi về tên kia rồi tới mã, không trả chuỗi rỗng", () => {
        expect(pickMajorName("en", { ...SE, name: "" })).toBe("Kỹ Thuật Phần Mềm")
        expect(pickMajorName("vi", { ...SE, name: "", nameVi: "" })).toBe("SE")
    })
})

describe("ngành trên thẻ môn", () => {
    it("map mã ngành từ danh sách BE", () => {
        expect(toSubjectFromSummary(summary([SE]), "vi").majorCodes).toEqual(["SE"])
    })

    it("BE chưa deploy V335 (không có trường majors) đọc thành mảng rỗng, không phải undefined", () => {
        // Quan trọng vì bộ lọc gọi .includes() thẳng trên trường này — undefined là crash.
        expect(toSubjectFromSummary(summary(undefined), "vi").majorCodes).toEqual([])
    })
})

describe("ngành trên hồ sơ", () => {
    it("hiện tên theo locale", () => {
        const profile = selfProfile({ majorCode: "SE", majorName: "Software Engineering",
            majorNameVi: "Kỹ Thuật Phần Mềm" })
        expect(toAcademic(profile, "vi").majorFromCatalog).toBe("Kỹ Thuật Phần Mềm")
        expect(toAcademic(profile, "en").majorFromCatalog).toBe("Software Engineering")
    })

    it("chưa chọn ngành thì rỗng — và KHÔNG lẫn với chuyên ngành chữ tự do", () => {
        const profile = selfProfile({ major: "Kỹ thuật phần mềm (tự gõ)" })
        expect(toAcademic(profile, "vi").majorFromCatalog).toBe("")
        expect(toAcademic(profile, "vi").major).toBe("Kỹ thuật phần mềm (tự gõ)")
    })
})

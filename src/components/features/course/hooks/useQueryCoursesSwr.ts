"use client"

import useSWR from "swr"

/** Course level. */
export type CourseLevel = "basic" | "intermediate" | "advanced"

/** Merchandising badge on a catalog card (mock flag; BE defines real criteria later). */
export type CourseBadge = "bestseller" | "new"

/** A course in the catalog (§4, mock until BE lands). */
export interface Course {
    id: string
    code: string
    name: string
    level: CourseLevel
    credits: number
    lessons: number
    /** Category slug — joins `CourseCategory.slug` (exactly one per course). */
    category: string
    /** Average rating 0–5; absent → the card hides its rating row. */
    rating?: number
    /** Number of ratings behind {@link Course.rating}. */
    ratingCount?: number
    /** Total video/content hours; absent → the card falls back to credits. */
    durationHours?: number
    /** Charged price in VND; absent → the card hides its price row. */
    priceVnd?: number
    /** Cover image URL; the card keeps a branded gradient fallback behind it. */
    coverUrl?: string
    /** Optional merchandising badge (Bán chạy / Mới). */
    badge?: CourseBadge
    /** Short summary shown by the hover preview; assumed on the future BE list endpoint. */
    description?: string
    /** "What you'll learn" bullets for the hover preview; assumed on the future BE list endpoint. */
    learnOutcomes?: Array<string>
    /** ISO date of the last content update; assumed on the future BE list endpoint. */
    updatedAt?: string
}

// ponytail: mock BE — no course endpoint yet. Deterministic sample; every course
// carries exactly one category slug + Coursera/Udemy card-anatomy fields.
const fetchCoursesMock = async (): Promise<Array<Course>> => [
    { id: "prf192", code: "PRF192", name: "Lập trình C", level: "basic", credits: 3, lessons: 24, category: "programming", rating: 4.8, ratingCount: 1240, durationHours: 32, priceVnd: 1_200_000, coverUrl: "https://picsum.photos/seed/prf192/480/270", badge: "bestseller", updatedAt: "2026-06-01", description: "Nền tảng lập trình với ngôn ngữ C: cú pháp, con trỏ, quản lý bộ nhớ và tư duy giải quyết vấn đề.", learnOutcomes: ["Nắm vững cú pháp C và con trỏ", "Tự viết chương trình quản lý bộ nhớ an toàn", "Tư duy thuật toán qua bài tập thực hành"] },
    { id: "csd201", code: "CSD201", name: "Cấu trúc dữ liệu & Giải thuật", level: "intermediate", credits: 3, lessons: 30, category: "programming", rating: 4.7, ratingCount: 980, durationHours: 40, priceVnd: 1_500_000, coverUrl: "https://picsum.photos/seed/csd201/480/270", badge: "bestseller", updatedAt: "2026-05-01", description: "Cấu trúc dữ liệu cốt lõi (list, tree, graph, hash) và các giải thuật kinh điển cho phỏng vấn.", learnOutcomes: ["Phân tích độ phức tạp Big-O", "Cài đặt list/tree/graph/hash từ đầu", "Giải bài phỏng vấn thuật toán tự tin hơn"] },
    { id: "prj301", code: "PRJ301", name: "Lập trình Java Web", level: "intermediate", credits: 3, lessons: 28, category: "programming", rating: 4.6, ratingCount: 720, durationHours: 36, priceVnd: 1_500_000, coverUrl: "https://picsum.photos/seed/prj301/480/270", updatedAt: "2026-04-01", description: "Xây dựng ứng dụng web Java: Servlet/JSP, MVC, JDBC và triển khai một dự án hoàn chỉnh.", learnOutcomes: ["Dựng web app theo mô hình MVC", "Kết nối CSDL qua JDBC", "Hoàn thiện dự án web end-to-end"] },
    { id: "dbi202", code: "DBI202", name: "Cơ sở dữ liệu", level: "basic", credits: 3, lessons: 22, category: "programming", rating: 4.5, ratingCount: 640, durationHours: 28, priceVnd: 1_200_000, coverUrl: "https://picsum.photos/seed/dbi202/480/270", updatedAt: "2026-03-01", description: "Thiết kế CSDL quan hệ, chuẩn hóa và thành thạo SQL từ truy vấn cơ bản đến nâng cao.", learnOutcomes: ["Thiết kế schema chuẩn hóa", "Viết SQL join/aggregate thành thạo", "Tối ưu truy vấn cơ bản"] },
    { id: "swp391", code: "SWP391", name: "Đồ án phần mềm", level: "advanced", credits: 4, lessons: 16, category: "programming", rating: 4.9, ratingCount: 310, durationHours: 24, priceVnd: 1_800_000, coverUrl: "https://picsum.photos/seed/swp391/480/270", badge: "new", updatedAt: "2026-06-15", description: "Làm việc nhóm theo quy trình thực tế: từ yêu cầu, thiết kế đến bàn giao một sản phẩm phần mềm.", learnOutcomes: ["Quản lý dự án theo Scrum", "Thiết kế kiến trúc cho sản phẩm thật", "Bàn giao sản phẩm chạy được"] },
    { id: "net1704", code: "NET1704", name: "Mạng máy tính", level: "intermediate", credits: 3, lessons: 26, category: "programming", rating: 4.4, ratingCount: 450, durationHours: 30, priceVnd: 1_300_000, coverUrl: "https://picsum.photos/seed/net1704/480/270", updatedAt: "2026-02-01", description: "Mô hình OSI/TCP-IP, định tuyến, DNS/HTTP và thực hành phân tích gói tin thực tế.", learnOutcomes: ["Hiểu sâu TCP/IP và OSI", "Phân tích gói tin với Wireshark", "Cấu hình mạng LAN cơ bản"] },
    { id: "mae101", code: "MAE101", name: "Toán cao cấp", level: "basic", credits: 3, lessons: 20, category: "math", rating: 4.6, ratingCount: 830, durationHours: 26, priceVnd: 1_000_000, coverUrl: "https://picsum.photos/seed/mae101/480/270", badge: "bestseller", updatedAt: "2026-05-15", description: "Giải tích một biến: giới hạn, đạo hàm, tích phân và ứng dụng cho các môn kỹ thuật.", learnOutcomes: ["Thành thạo đạo hàm và tích phân", "Ứng dụng giải tích vào bài toán kỹ thuật", "Nền tảng cho xác suất và AI"] },
    { id: "mas291", code: "MAS291", name: "Xác suất thống kê", level: "intermediate", credits: 3, lessons: 22, category: "math", rating: 4.5, ratingCount: 520, durationHours: 28, priceVnd: 1_100_000, coverUrl: "https://picsum.photos/seed/mas291/480/270", updatedAt: "2026-01-15", description: "Xác suất, biến ngẫu nhiên, ước lượng và kiểm định giả thuyết với ví dụ dữ liệu thật.", learnOutcomes: ["Mô hình hóa bằng biến ngẫu nhiên", "Kiểm định giả thuyết đúng cách", "Đọc hiểu kết quả thống kê"] },
    { id: "jpd113", code: "JPD113", name: "Tiếng Nhật sơ cấp", level: "basic", credits: 3, lessons: 30, category: "foreign-languages", rating: 4.7, ratingCount: 610, durationHours: 34, priceVnd: 1_400_000, coverUrl: "https://picsum.photos/seed/jpd113/480/270", badge: "new", updatedAt: "2026-06-20", description: "Tiếng Nhật từ con số 0: bảng chữ, ngữ pháp N5 và hội thoại giao tiếp hằng ngày.", learnOutcomes: ["Đọc viết hiragana/katakana", "Giao tiếp tình huống cơ bản", "Sẵn sàng cho kỳ thi JLPT N5"] },
    { id: "enw492", code: "ENW492", name: "Viết học thuật tiếng Anh", level: "intermediate", credits: 2, lessons: 18, category: "foreign-languages", rating: 4.3, ratingCount: 290, durationHours: 20, priceVnd: 900_000, coverUrl: "https://picsum.photos/seed/enw492/480/270", updatedAt: "2026-03-15", description: "Kỹ năng viết học thuật: cấu trúc đoạn, lập luận, trích dẫn và hoàn thiện một bài luận chuẩn.", learnOutcomes: ["Viết đoạn văn lập luận chặt chẽ", "Trích dẫn nguồn đúng chuẩn", "Hoàn thiện essay học thuật"] },
]

/** Sort orders of the browse facet bar. */
export type CourseSort = "popular" | "newest" | "rating"

// ponytail: mock comparators — popular ranks by rating count, newest by the "new"
// badge (mock has no createdAt); swap both for real signals when BE lands.
const COURSE_COMPARATORS: Record<CourseSort, (a: Course, b: Course) => number> = {
    popular: (a, b) => (b.ratingCount ?? 0) - (a.ratingCount ?? 0),
    newest: (a, b) => Number(b.badge === "new") - Number(a.badge === "new"),
    rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
}

/**
 * Filters courses down to one category.
 *
 * @param courses - The full course list.
 * @param slug - The category slug to keep.
 * @returns The courses whose `category` matches `slug`.
 */
export const coursesByCategory = (courses: Array<Course>, slug: string): Array<Course> =>
    courses.filter((course) => course.category === slug)

/**
 * Returns a new array sorted by the given browse sort order (stable — ties keep
 * the curated mock order).
 *
 * @param courses - The courses to sort.
 * @param sort - The active sort order.
 * @returns A sorted copy of `courses`.
 */
export const sortCourses = (courses: Array<Course>, sort: CourseSort): Array<Course> =>
    [...courses].sort(COURSE_COMPARATORS[sort])

/** Loads the course catalog. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryCoursesSwr = () => {
    const { data, isLoading, error } = useSWR(["courses"], () => fetchCoursesMock())
    return { courses: data ?? [], isLoading, error }
}

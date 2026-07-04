// ponytail: FE-only MOCK blog data. When the blog backend exists, replace the
// two fetchers below (`fetchMockBlogPosts` / `fetchMockBlogPost`) with the real
// GraphQL queries `queryBlogPosts` / `queryBlogPost` from
// `@/modules/api/graphql/queries/query-blog-posts` + `query-blog-post` — the
// data contracts already match `QueryBlogPostListItem` / `QueryBlogPostDetail`,
// so callers (BlogList, RelatedPosts, BlogPost, the [slug] metadata fetch) need
// no shape changes, only the import swap.

import {
    BlogCategory,
    type QueryBlogPostDetail,
    type QueryBlogPostListItem,
} from "@/modules/api/graphql/queries/types/blog"

/**
 * FTES-flavored mock blog cards (newest-first). Two editorial pillars are
 * represented (DeepDive + BuildInPublic) so the pillar filter surfaces. One post
 * is premium to exercise the members-only gate. Covers are omitted (null) —
 * typography leads the listing.
 */
export const MOCK_BLOG_POSTS: Array<QueryBlogPostListItem> = [
    {
        id: "1",
        slug: "cqrs-in-the-academic-operating-system",
        title: "CQRS trong FTES AOS: tách đọc/ghi mà không rối",
        excerpt: "Vì sao lệnh và truy vấn của hệ vận hành học thuật lại đi hai đường, và cái giá phải trả khi làm vậy.",
        category: BlogCategory.DeepDive,
        coverImageUrl: null,
        readingMinutes: 9,
        isPremium: false,
        publishedAt: "2026-06-28T09:00:00.000Z",
    },
    {
        id: "2",
        slug: "streaming-grading-with-kafka",
        title: "Chấm bài theo luồng với Kafka: từ nộp đến điểm",
        excerpt: "Đường đi của một lần nộp bài qua topic Kafka, consumer group, và cách chúng tôi giữ thứ tự.",
        category: BlogCategory.DeepDive,
        coverImageUrl: null,
        readingMinutes: 12,
        isPremium: true,
        publishedAt: "2026-06-20T09:00:00.000Z",
    },
    {
        id: "3",
        slug: "building-ftes-aos-in-public",
        title: "Xây FTES AOS công khai: những đánh đổi tuần đầu",
        excerpt: "Nhật ký kỹ thuật của tuần đầu dựng hệ — cái gì giữ, cái gì vứt, và tại sao.",
        category: BlogCategory.BuildInPublic,
        coverImageUrl: null,
        readingMinutes: 7,
        isPremium: false,
        publishedAt: "2026-06-12T09:00:00.000Z",
    },
    {
        id: "4",
        slug: "rag-over-course-content-with-qdrant",
        title: "RAG trên nội dung khóa học với Qdrant",
        excerpt: "Nhúng bài giảng vào vector store để trợ giảng AI trả lời có căn cứ, không bịa.",
        category: BlogCategory.DeepDive,
        coverImageUrl: null,
        readingMinutes: 11,
        isPremium: false,
        publishedAt: "2026-06-04T09:00:00.000Z",
    },
    {
        id: "5",
        slug: "keeping-enrollment-state-honest",
        title: "Giữ trạng thái ghi danh trung thực xuyên suốt hệ",
        excerpt: "Một enrollment là nguồn sự thật cho quyền truy cập nội dung — và cách chúng tôi tránh trôi trạng thái.",
        category: BlogCategory.BuildInPublic,
        coverImageUrl: null,
        readingMinutes: 6,
        isPremium: false,
        publishedAt: "2026-05-26T09:00:00.000Z",
    },
]

/**
 * Full article detail per slug. Each carries a short markdown body (headings,
 * paragraphs, a code block). `isLocked` mirrors `isPremium` for the premium post
 * to simulate server-side gating; otherwise false.
 */
export const MOCK_BLOG_POST_DETAILS: Record<string, QueryBlogPostDetail> = {
    "cqrs-in-the-academic-operating-system": {
        id: "1",
        slug: "cqrs-in-the-academic-operating-system",
        title: "CQRS trong FTES AOS: tách đọc/ghi mà không rối",
        excerpt: "Vì sao lệnh và truy vấn của hệ vận hành học thuật lại đi hai đường, và cái giá phải trả khi làm vậy.",
        body: [
            "## Vì sao tách đọc và ghi",
            "",
            "Trong FTES AOS, một hành động ghi danh chạm vào nhiều bảng: quyền truy cập, tiến độ, và thông báo. Nếu mọi truy vấn đọc đều đi qua cùng mô hình ghi, chúng ta khoá lẫn nhau.",
            "",
            "## Đường lệnh",
            "",
            "Lệnh (command) chỉ nhận ý định, xác thực, rồi phát sự kiện. Không truy vấn nào chờ nó.",
            "",
            "```ts",
            "type EnrollCommand = { userId: string, courseId: string }",
            "",
            "async function handleEnroll(cmd: EnrollCommand) {",
            "    await assertPurchasable(cmd)",
            "    await emit(\"enrollment.created\", cmd)",
            "}",
            "```",
            "",
            "## Cái giá",
            "",
            "Đọc và ghi lệch nhau vài mili-giây. Chúng tôi chấp nhận, và thiết kế UI quanh sự thật đó.",
        ].join("\n"),
        category: BlogCategory.DeepDive,
        coverImageUrl: null,
        readingMinutes: 9,
        ctaUrl: "/courses",
        ctaLabel: "Học khoá kiến trúc backend",
        sourceUrl: "https://github.com/ftes-aos/academic-operating-system",
        isPremium: false,
        isLocked: false,
        publishedAt: "2026-06-28T09:00:00.000Z",
    },
    "streaming-grading-with-kafka": {
        id: "2",
        slug: "streaming-grading-with-kafka",
        title: "Chấm bài theo luồng với Kafka: từ nộp đến điểm",
        excerpt: "Đường đi của một lần nộp bài qua topic Kafka, consumer group, và cách chúng tôi giữ thứ tự.",
        // MOCK: premium post — body is truncated to a teaser (isLocked=true), so the
        // members-only gate card follows the cut, mirroring server-side gating.
        body: [
            "## Một lần nộp bài đi đâu",
            "",
            "Khi học viên bấm nộp, chúng tôi không chấm ngay. Bài vào một topic Kafka và trả về ngay lập tức — phần còn lại (consumer group, giữ thứ tự theo partition) dành cho thành viên.",
        ].join("\n"),
        category: BlogCategory.DeepDive,
        coverImageUrl: null,
        readingMinutes: 12,
        ctaUrl: "/courses",
        ctaLabel: "Đăng ký khoá học",
        sourceUrl: "https://github.com/ftes-aos/academic-operating-system",
        isPremium: true,
        isLocked: true,
        publishedAt: "2026-06-20T09:00:00.000Z",
    },
    "building-ftes-aos-in-public": {
        id: "3",
        slug: "building-ftes-aos-in-public",
        title: "Xây FTES AOS công khai: những đánh đổi tuần đầu",
        excerpt: "Nhật ký kỹ thuật của tuần đầu dựng hệ — cái gì giữ, cái gì vứt, và tại sao.",
        body: [
            "## Tuần đầu",
            "",
            "Chúng tôi bắt đầu từ một skeleton đã strip, không phải trang trắng. Điều đó định hình mọi quyết định sau.",
            "",
            "## Giữ gì",
            "",
            "Hệ block, HeroUI, và next-intl ở lại. Chúng đã được kiểm chứng ở dự án nguồn.",
            "",
            "```bash",
            "npm run build   # webpack, không turbopack trên máy này",
            "```",
            "",
            "## Vứt gì",
            "",
            "Những màn WebGL nặng và các anchor ghim không phục vụ nội dung học thuật đã bị gỡ.",
        ].join("\n"),
        category: BlogCategory.BuildInPublic,
        coverImageUrl: null,
        readingMinutes: 7,
        ctaUrl: null,
        ctaLabel: null,
        sourceUrl: "https://github.com/ftes-aos/academic-operating-system",
        isPremium: false,
        isLocked: false,
        publishedAt: "2026-06-12T09:00:00.000Z",
    },
    "rag-over-course-content-with-qdrant": {
        id: "4",
        slug: "rag-over-course-content-with-qdrant",
        title: "RAG trên nội dung khóa học với Qdrant",
        excerpt: "Nhúng bài giảng vào vector store để trợ giảng AI trả lời có căn cứ, không bịa.",
        body: [
            "## Vì sao cần grounding",
            "",
            "Trợ giảng AI chỉ hữu ích khi nó trả lời từ nội dung khoá học thật, không phải trí nhớ mờ của mô hình.",
            "",
            "## Nhúng bài giảng",
            "",
            "Mỗi đoạn bài giảng thành một vector trong Qdrant, gắn metadata về khoá và bài.",
            "",
            "```ts",
            "await qdrant.upsert(\"lessons\", {",
            "    points: chunks.map((c) => ({ id: c.id, vector: c.embedding, payload: c.meta })),",
            "})",
            "```",
            "",
            "## Truy hồi",
            "",
            "Câu hỏi được nhúng, tìm k đoạn gần nhất, rồi đưa vào prompt làm ngữ cảnh.",
        ].join("\n"),
        category: BlogCategory.DeepDive,
        coverImageUrl: null,
        readingMinutes: 11,
        ctaUrl: "/courses",
        ctaLabel: "Tìm hiểu thêm",
        sourceUrl: null,
        isPremium: false,
        isLocked: false,
        publishedAt: "2026-06-04T09:00:00.000Z",
    },
    "keeping-enrollment-state-honest": {
        id: "5",
        slug: "keeping-enrollment-state-honest",
        title: "Giữ trạng thái ghi danh trung thực xuyên suốt hệ",
        excerpt: "Một enrollment là nguồn sự thật cho quyền truy cập nội dung — và cách chúng tôi tránh trôi trạng thái.",
        body: [
            "## Một nguồn sự thật",
            "",
            "Quyền đọc nội dung premium bám vào `EnrollmentEntity.isPurchased`, không phải một cờ VIP riêng.",
            "",
            "## Tránh trôi",
            "",
            "Mọi truy vấn course-scoped join theo enrollment, nên không có đường tắt nào để lệch trạng thái.",
            "",
            "```ts",
            "const enrollment = await resolveEnrollment(userId, courseId)",
            "if (!enrollment?.isPurchased) return gatePreview()",
            "```",
        ].join("\n"),
        category: BlogCategory.BuildInPublic,
        coverImageUrl: null,
        readingMinutes: 6,
        ctaUrl: "/courses",
        ctaLabel: "Đăng ký khoá học",
        sourceUrl: null,
        isPremium: false,
        isLocked: false,
        publishedAt: "2026-05-26T09:00:00.000Z",
    },
}

/** Default page size for {@link fetchMockBlogPosts} (mirrors the backend default). */
const DEFAULT_LIMIT = 12

/** Simulated network latency (ms) so SWR loading states are exercised. */
const MOCK_LATENCY_MS = 200

/** Resolve after {@link MOCK_LATENCY_MS} to mimic a real round-trip. */
const delay = () => new Promise<void>((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

/**
 * Mock replacement for `queryBlogPosts` — filters by pillar, then paginates
 * newest-first. Returns render-ready list items.
 *
 * @param request - Optional category filter + pagination window.
 */
export const fetchMockBlogPosts = async ({
    category,
    limit = DEFAULT_LIMIT,
    offset = 0,
}: {
    category?: BlogCategory
    limit?: number
    offset?: number
} = {}): Promise<Array<QueryBlogPostListItem>> => {
    await delay()
    const filtered = category
        ? MOCK_BLOG_POSTS.filter((post) => post.category === category)
        : MOCK_BLOG_POSTS
    return filtered.slice(offset, offset + limit)
}

/**
 * Mock replacement for `queryBlogPost` — returns the full article for a slug, or
 * null when unknown.
 *
 * @param slug - The `/blog/[slug]` route key.
 */
export const fetchMockBlogPost = async (slug: string): Promise<QueryBlogPostDetail | null> => {
    await delay()
    return MOCK_BLOG_POST_DETAILS[slug] ?? null
}

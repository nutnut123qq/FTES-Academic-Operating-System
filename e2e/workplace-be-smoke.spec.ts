import { expect, test, type APIRequestContext } from "@playwright/test"

import { fetchToken } from "./helpers/auth"

/**
 * Nghiệm thu E2E 2026-07-25 — smoke BE cho 10 nhóm endpoint mới của đợt
 * Workplace/Community/Groups/Resource-Hub (BE `a80103a`+, FE `d7f1106`).
 *
 * Chạy THẲNG vào `apitest.ftes.vn` bằng token thật (không cần dev server). Mọi fixture đều
 * TỰ SEED trong test (resource/comment/collection/deck/nhóm) — apitest không có sẵn resource
 * nào nên spec bám id cứng sẽ mục theo thời gian.
 *
 * Ca chưa chứng minh được, ghi rõ lý do tại chỗ thay vì assert bừa:
 * - đề luyện tập cần ngân hàng câu hỏi `status=ready` của môn (seed qua admin);
 * - nhánh 403 `AI_DOCUMENT_ACCESS_DENIED` cần resource ĐÃ APPROVED + visibility hẹp, mà
 *   approve đòi version UPLOADED → chặn bởi BLOCKED-MINIO-PUBLIC (presign trả host nội bộ).
 */

const API = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"
const PRF192 = "b79a7192-932e-4427-9b97-d171650638ab"

/**
 * Chạy TUẦN TỰ: tạo nhóm cấp vai OWNER cho chính tài khoản test → BE vô hiệu hoá token đã phát
 * (`IDENTITY_TOKEN_STALE`). Chạy song song thì test tạo nhóm sẽ bắn 401 vào các test khác đang
 * dùng CÙNG tài khoản — hỏng vì hạ tầng test, không phải vì sản phẩm.
 */
test.describe.configure({ mode: "serial" })

type Role = "student" | "lecturer"

const api = async (request: APIRequestContext, role: Role, freshToken = false) => {
    const token = await fetchToken(role, freshToken)
    const headers = { authorization: `Bearer ${token}` }
    return {
        get: (p: string) => request.get(`${API}${p}`, { headers }),
        post: (p: string, data?: unknown) => request.post(`${API}${p}`, { headers, data: data ?? {} }),
        put: (p: string) => request.put(`${API}${p}`, { headers }),
        patch: (p: string, data: unknown) => request.patch(`${API}${p}`, { headers, data }),
        del: (p: string) => request.delete(`${API}${p}`, { headers }),
    }
}

const body = async (res: { json: () => Promise<{ data: unknown }> }) => (await res.json()).data

/** Resource DRAFT của chính student — đủ để thử bình luận/đánh giá/bộ sưu tập (không cần file). */
const seedResource = async (as: Awaited<ReturnType<typeof api>>) => {
    const res = await as.post("/resources", {
        title: `E2E ${Date.now()}`,
        type: "NOTES",
        subjectId: PRF192,
        visibility: "PUBLIC",
        license: "CC_BY",
    })
    expect(res.status()).toBe(200)
    return ((await body(res)) as { id: string }).id
}

test.describe("resource-hub", () => {
    test("like bình luận: idempotent, đếm đúng, phản ánh trong danh sách", async ({ request }) => {
        const as = await api(request, "student")
        const rid = await seedResource(as)

        const root = (await body(await as.post(`/resources/${rid}/comments`, { content: "gốc" }))) as { id: string }
        const reply = (await body(
            await as.post(`/resources/${rid}/comments`, { parentId: root.id, content: "trả lời" }),
        )) as { id: string }

        expect(await body(await as.put(`/resources/comments/${root.id}/like`))).toEqual({ active: true, likeCount: 1 })
        // Bấm lại KHÔNG cộng dồn (mạng chập chờn / double-tap là chuyện thường).
        expect(await body(await as.put(`/resources/comments/${root.id}/like`))).toEqual({ active: true, likeCount: 1 })
        expect(await body(await as.put(`/resources/comments/${reply.id}/like`))).toEqual({ active: true, likeCount: 1 })

        const page = (await body(await as.get(`/resources/${rid}/comments?page=0&size=10`))) as {
            items: { id: string; likeCount: number; likedByMe: boolean; replies: { likeCount: number; likedByMe: boolean }[] }[]
        }
        expect(page.items[0].likeCount).toBe(1)
        expect(page.items[0].replies[0].likeCount).toBe(1)
        // likedByMe phải theo NGƯỜI GỌI — nếu false thì tim đã bấm sẽ rỗng lại sau F5.
        expect(page.items[0].likedByMe).toBe(true)
        expect(page.items[0].replies[0].likedByMe).toBe(true)

        expect(await body(await as.del(`/resources/comments/${root.id}/like`))).toEqual({ active: false, likeCount: 0 })
        expect(await body(await as.del(`/resources/comments/${root.id}/like`))).toEqual({ active: false, likeCount: 0 })

        expect((await as.put(`/resources/comments/00000000-0000-4000-8000-000000000000/like`)).status()).toBe(404)
    })

    test("đánh giá của tôi: chưa có → data null (không 404), xoá idempotent, avg tính lại", async ({ request }) => {
        const as = await api(request, "student")
        const rid = await seedResource(as)

        const empty = await as.get(`/resources/${rid}/ratings/me`)
        expect(empty.status()).toBe(200)
        expect(await body(empty)).toBeNull()

        await as.post(`/resources/${rid}/ratings`, { stars: 4, review: "ổn" })
        expect(await body(await as.get(`/resources/${rid}/ratings/me`))).toMatchObject({ stars: 4, review: "ổn" })
        expect(await body(await as.get(`/resources/${rid}`))).toMatchObject({ avgRating: 4, ratingCount: 1 })

        expect((await as.del(`/resources/${rid}/ratings/me`)).status()).toBe(200)
        expect((await as.del(`/resources/${rid}/ratings/me`)).status()).toBe(200)
        expect(await body(await as.get(`/resources/${rid}/ratings/me`))).toBeNull()
        expect(await body(await as.get(`/resources/${rid}`))).toMatchObject({ avgRating: 0, ratingCount: 0 })
    })

    test("bộ sưu tập: sửa note giữ nguyên sortOrder, chủ sở hữu đọc được của mình", async ({ request }) => {
        const as = await api(request, "student")
        const rid = await seedResource(as)
        const col = (await body(
            await as.post("/resources/collections", {
                kind: "RESOURCE_COLLECTION",
                title: `E2E ${Date.now()}`,
                visibility: "PRIVATE",
            }),
        )) as { id: string }

        const added = (await body(await as.post(`/resources/collections/${col.id}/items`, { resourceId: rid, note: "note-1" }))) as {
            sortOrder: number
        }
        expect(await body(await as.patch(`/resources/collections/${col.id}/items/${rid}`, { note: "note-2" }))).toMatchObject({
            note: "note-2",
            sortOrder: added.sortOrder,
        })
        expect(await body(await as.patch(`/resources/collections/${col.id}/items/${rid}`, { note: null }))).toMatchObject({
            note: null,
        })

        // Chủ sở hữu PHẢI đọc được bộ sưu tập PRIVATE của chính mình (cả list lẫn detail).
        const mine = await as.get("/resources/collections/me")
        expect(mine.status()).toBe(200)
        expect((await body(mine)) as unknown[]).toEqual(expect.arrayContaining([expect.objectContaining({ id: col.id })]))

        const detail = await as.get(`/resources/collections/${col.id}`)
        expect(detail.status()).toBe(200)
        expect(await body(detail)).toMatchObject({ collection: { id: col.id } })
    })
})

test.describe("community + groups", () => {
    test("follow theo lô: rỗng → [], có theo dõi → trả id, quá 100 → 400", async ({ request }) => {
        const as = await api(request, "student")
        const lecturer = (await body(await (await api(request, "lecturer")).get("/profiles/me"))) as { userId: string }

        expect(await body(await as.get("/community/follows/me"))).toEqual([])

        await as.put(`/community/follows/${lecturer.userId}`)
        expect(await body(await as.get(`/community/follows/me?userIds=${lecturer.userId}`))).toEqual([lecturer.userId])
        await as.del(`/community/follows/${lecturer.userId}`)
        expect(await body(await as.get(`/community/follows/me?userIds=${lecturer.userId}`))).toEqual([])

        const tooMany = Array.from({ length: 101 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`)
        const over = await as.get(`/community/follows/me?userIds=${tooMany.join(",")}`)
        expect(over.status()).toBe(400)
        expect(await over.json()).toMatchObject({ data: { errorCode: "COMMUNITY_FOLLOW_BATCH_TOO_LARGE" } })
    })

    test("hộp thư lời mời: chỉ PENDING của chính mình, kèm thẻ nhóm + người mời", async ({ request }) => {
        const asLecturer = await api(request, "lecturer")
        const asStudent = await api(request, "student")
        const me = (await body(await asStudent.get("/profiles/me"))) as { userId: string }

        const group = (await body(
            await asLecturer.post("/groups", { name: `E2E mời ${Date.now()}`, groupType: "GENERAL", visibility: "PUBLIC", joinPolicy: "APPROVAL" }),
        )) as { id: string }
        // Tạo nhóm cấp role mới cho người tạo → token cũ thành stale, phải lấy token mới trước khi mời.
        const asLecturerFresh = await api(request, "lecturer", true)
        expect((await asLecturerFresh.post(`/groups/${group.id}/invitations`, { inviteeId: me.userId })).status()).toBe(200)

        const inbox = (await body(await asStudent.get("/invitations/me"))) as {
            status: string
            group: { id: string; name: string; slug: string }
            inviter: { userId: string; displayName: string }
        }[]
        const row = inbox.find((i) => i.group.id === group.id)
        expect(row).toBeDefined()
        expect(row!.status).toBe("PENDING")
        expect(row!.group.slug).toBeTruthy()
        expect(row!.inviter.displayName).toBeTruthy()
    })

    test("gỡ ảnh nhóm: idempotent, trả GroupResponse, viewerMembership đúng vai", async ({ request }) => {
        const as = await api(request, "student")
        const group = (await body(
            await as.post("/groups", { name: `E2E ảnh ${Date.now()}`, groupType: "GENERAL", visibility: "PUBLIC", joinPolicy: "OPEN" }),
        )) as { id: string }
        const asFresh = await api(request, "student", true)

        for (const kind of ["AVATAR", "COVER"]) {
            const first = await asFresh.del(`/groups/${group.id}/media/${kind}`)
            expect(first.status()).toBe(200)
            expect(await body(first)).toMatchObject({ id: group.id, viewerMembership: "OWNER" })
            expect((await asFresh.del(`/groups/${group.id}/media/${kind}`)).status()).toBe(200)
        }
        const bad = await asFresh.del(`/groups/${group.id}/media/BANNER`)
        expect(bad.status()).toBe(400)
        expect(await bad.json()).toMatchObject({ data: { errorCode: "GROUP_MEDIA_INVALID_KIND" } })

        expect(await body(await asFresh.get(`/groups/${group.id}`))).toMatchObject({ viewerMembership: "OWNER" })
    })
})

test.describe("AI", () => {
    test("phiên theo môn: lọc đúng môn, archive theo lô idempotent", async ({ request }) => {
        const as = await api(request, "student")
        const created = (await body(
            await as.post("/ai/sessions", { feature: "TUTOR_CHAT", contextRef: { subjectId: PRF192 } }),
        )) as { id: string }

        const listed = (await body(await as.get(`/ai/sessions?feature=TUTOR_CHAT&subjectId=${PRF192}`))) as {
            id: string
            contextRef: { subjectId: string }
        }[]
        expect(listed.map((s) => s.id)).toContain(created.id)
        for (const s of listed) expect(s.contextRef.subjectId).toBe(PRF192)

        expect(await body(await as.del(`/ai/sessions?feature=TUTOR_CHAT&subjectId=${PRF192}`))).toMatchObject({
            archived: expect.any(Number),
        })
        expect(await body(await as.del(`/ai/sessions?feature=TUTOR_CHAT&subjectId=${PRF192}`))).toEqual({ archived: 0 })
    })

    test("hỏi đáp tài liệu: thiếu ref → 400, id lạ → 404, bài học đọc được → có trả lời", async ({ request }) => {
        const as = await api(request, "student")

        const missing = await as.post("/ai/document-qa", { question: "x" })
        expect(missing.status()).toBe(400)

        const bogus = await as.post("/ai/document-qa", {
            documentId: "00000000-0000-4000-8000-000000000000",
            question: "x",
        })
        expect(bogus.status()).toBe(404)
        expect(await bogus.json()).toMatchObject({ data: { errorCode: "AI_DOCUMENT_NOT_FOUND" } })

        const answered = await as.post("/ai/document-qa", { lessonId: "seed-les-c1-s1-l2", question: "Bài này nói gì?" })
        expect(answered.status()).toBe(200)
        const data = (await body(answered)) as { answer: string; citations: unknown[]; processing?: boolean }
        // ai-service có thể còn index → chấp nhận processing, nhưng đã trả lời thì phải kèm trích dẫn.
        if (!data.processing) {
            expect(data.answer.length).toBeGreaterThan(0)
            expect(data.citations.length).toBeGreaterThan(0)
        }
    })
})

test.describe("luyện tập theo môn", () => {
    test("đề luyện tập KHÔNG kèm đáp án; nộp xong mới có correctKeys + giải thích", async ({ request }) => {
        const as = await api(request, "student")
        const quiz = (await body(await as.get("/subjects/PRF192/practice/quiz?count=5"))) as {
            count: number
            questions: { id: string; options: { key: string }[] }[]
        }
        test.skip(quiz.count === 0, "môn chưa có câu hỏi status=ready trong ngân hàng — cần seed qua admin")

        // Rò đáp án ở đề phát ra là lỗi BẢO MẬT, không phải lỗi hiển thị.
        const raw = JSON.stringify(quiz)
        expect(raw).not.toContain("correctKeys")
        expect(raw).not.toContain("explanation")

        const result = (await body(
            await as.post("/subjects/PRF192/practice/quiz/submit", {
                answers: quiz.questions.map((q) => ({ questionId: q.id, selectedKeys: [q.options[0].key] })),
            }),
        )) as {
            totalQuestions: number
            results: { correctKeys: string[]; explanation: string | null }[]
        }
        expect(result.totalQuestions).toBe(quiz.questions.length)
        expect(result.results[0].correctKeys.length).toBeGreaterThan(0)
    })

    test("flashcard SM-2: chấm điểm xong tiến độ CÒN sau khi tải lại", async ({ request }) => {
        const as = await api(request, "student")
        const decks = (await body(await as.get("/subjects/PRF192/practice/flashcards"))) as {
            deckCount: number
            decks: { cards: { id: string }[] }[]
        }
        test.skip(decks.deckCount === 0, "môn chưa có bộ thẻ nào — cần giảng viên tạo deck")

        const cardId = decks.decks[0].cards[0].id
        const after = (await body(await as.post(`/subjects/PRF192/practice/flashcards/${cardId}/review`, { grade: 4 }))) as {
            progress: { repetitions: number; lastGrade: number }
        }
        expect(after.progress.lastGrade).toBe(4)

        const reloaded = (await body(await as.get("/subjects/PRF192/practice/flashcards"))) as {
            decks: { cards: { id: string; progress: { lastGrade: number | null; status: string } }[] }[]
        }
        const card = reloaded.decks.flatMap((d) => d.cards).find((c) => c.id === cardId)!
        // Trước đây F5 là mất sạch tiến độ — đây là điểm mấu chốt của bảng SM-2 mới.
        expect(card.progress.lastGrade).toBe(4)
        expect(card.progress.status).not.toBe("NEW")
    })

    test("thống kê môn: đủ khoá, số liệu do worker recompute", async ({ request }) => {
        const as = await api(request, "student")
        const stats = (await body(await as.get("/subjects/PRF192/statistics"))) as Record<string, unknown>
        for (const key of ["memberCount", "postCount", "resourceCount", "completionRate", "topStudents", "leaderboard"]) {
            expect(stats).toHaveProperty(key)
        }
        expect(stats.computedAt).toBeTruthy()
    })
})

import { expect, test, type APIRequestContext } from "@playwright/test"

import { fetchToken } from "./helpers/auth"

/**
 * Nghiệm thu E2E vòng 2 (2026-07-26) — luồng upload Cloudinary + gate quyền đọc tài liệu.
 *
 * Vòng 1 cả cụm này là BLOCKED-MINIO-PUBLIC (presign trả host nội bộ `minio:9000`, máy ngoài
 * không PUT được). Nay upload là multipart server-side: `POST /resources/{id}/versions`.
 *
 * Chạy thẳng vào apitest, không cần dev server.
 */

test.describe.configure({ timeout: 120_000 })

const API = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"
const PRF192 = "b79a7192-932e-4427-9b97-d171650638ab"

const asRole = async (request: APIRequestContext, role: "student" | "lecturer" | "admin") => {
    const headers = { authorization: `Bearer ${await fetchToken(role)}` }
    return {
        get: (p: string) => request.get(`${API}${p}`, { headers }),
        post: (p: string, data: unknown = {}) => request.post(`${API}${p}`, { headers, data }),
        upload: (p: string, name: string, mimeType: string, text: string) =>
            request.post(`${API}${p}`, {
                headers,
                multipart: { file: { name, mimeType, buffer: Buffer.from(text, "utf8") } },
            }),
    }
}
const data = async (res: { json: () => Promise<{ data: unknown }> }) => (await res.json()).data

const createResource = async (
    as: Awaited<ReturnType<typeof asRole>>,
    visibility: "PUBLIC" | "PRIVATE",
) => {
    const res = await as.post("/resources", {
        title: `E2E R2 ${visibility} ${Date.now()}`,
        type: "NOTES",
        subjectId: PRF192,
        visibility,
        license: "CC_BY",
    })
    expect(res.status()).toBe(200)
    return ((await data(res)) as { id: string }).id
}

test("upload multipart → version UPLOADED, tải xuống được qua URL Cloudinary", async ({ request }) => {
    const as = await asRole(request, "student")
    const id = await createResource(as, "PUBLIC")

    const uploaded = await as.upload(`/resources/${id}/versions`, "ghi-chu.md", "text/markdown", "# FTES\n\nnội dung E2E")
    expect(uploaded.status(), await uploaded.text()).toBe(200)
    expect(await data(uploaded)).toMatchObject({ versionNo: 1, uploadStatus: "UPLOADED", mimeType: "text/markdown" })

    expect(await data(await as.get(`/resources/${id}`))).toMatchObject({ currentVersionId: expect.any(String) })

    const dl = (await data(await as.get(`/resources/${id}/download-url`))) as { url: string }
    // URL phải là CDN công khai, KHÔNG phải host nội bộ (bug vòng 1: http://minio:9000/...).
    expect(dl.url).toContain("res.cloudinary.com")
    expect(dl.url).not.toContain("minio")

    const file = await request.get(dl.url)
    expect(file.status(), "URL trả về phải tải được thật, không chỉ trông đúng").toBe(200)
    expect(await file.text()).toContain("nội dung E2E")
})

/**
 * Cloudinary chặn delivery `raw` cho PDF/ZIP khi tài khoản chưa bật "Allow delivery of PDF and ZIP
 * files" (Security console). Cùng đường dẫn `raw/upload/...`, chỉ khác đuôi file: `.md` trả 200 còn
 * `.pdf` trả 401 → đây là SETTING hạ tầng, không phải lỗi code. Test khoá lại hiện trạng để khi ai
 * đó bật setting thì nó đỏ và mình biết mà gỡ `test.fail()`.
 */
test("tải PDF vẫn 401 — Cloudinary chưa bật delivery cho PDF/ZIP", async ({ request }) => {
    test.fail()
    const as = await asRole(request, "student")
    const id = await createResource(as, "PUBLIC")
    await as.upload(`/resources/${id}/versions`, "e2e.pdf", "application/pdf", "%PDF-1.4\n%%EOF")

    const dl = (await data(await as.get(`/resources/${id}/download-url`))) as { url: string }
    expect((await request.get(dl.url)).status()).toBe(200)
})

test("tài liệu APPROVED + PRIVATE: người khác hỏi AI → 403 AI_DOCUMENT_ACCESS_DENIED", async ({
    request,
}) => {
    const owner = await asRole(request, "student")
    const admin = await asRole(request, "admin")
    const other = await asRole(request, "lecturer")

    const id = await createResource(owner, "PRIVATE")
    expect((await owner.upload(`/resources/${id}/versions`, "rieng-tu.md", "text/markdown", "# Riêng tư")).status()).toBe(200)
    expect((await owner.post(`/resources/${id}/submit`)).status()).toBe(200)
    // Duyệt được là nhờ fix `resource.approve` (BE dc29c86) — trước đó admin bị 403.
    expect((await admin.post(`/resources/${id}/approve`)).status()).toBe(200)

    // Đã APPROVED nên "tồn tại" với người khác, nhưng visibility PRIVATE chặn đọc → 403, KHÔNG 404.
    expect((await other.get(`/resources/${id}`)).status()).toBe(403)
    const denied = await other.post("/ai/document-qa", { documentId: id, question: "gì đây?" })
    expect(denied.status()).toBe(403)
    expect(await denied.json()).toMatchObject({ data: { errorCode: "AI_DOCUMENT_ACCESS_DENIED" } })

    // Chủ sở hữu vẫn hỏi được (200; `processing` khi ai-service chưa index xong).
    expect((await owner.post("/ai/document-qa", { documentId: id, question: "gì đây?" })).status()).toBe(200)
})

test("hàng đợi duyệt: admin thấy bản chờ và duyệt được", async ({ request }) => {
    const owner = await asRole(request, "student")
    const admin = await asRole(request, "admin")

    const id = await createResource(owner, "PUBLIC")
    await owner.upload(`/resources/${id}/versions`, "cho-duyet.md", "text/markdown", "# Chờ duyệt")
    await owner.post(`/resources/${id}/submit`)

    const queue = (await data(await admin.get("/resources/moderation/pending?page=0&size=50"))) as {
        items: { id: string }[]
    }
    expect(queue.items.map((r) => r.id)).toContain(id)
    expect(await data(await admin.post(`/resources/${id}/approve`))).toMatchObject({ status: "APPROVED" })
})

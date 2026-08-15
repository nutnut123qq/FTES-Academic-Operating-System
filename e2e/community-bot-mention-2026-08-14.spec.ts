import { test, expect, request as pwRequest, type APIRequestContext, type Page } from "@playwright/test"
import { loginAs, fetchToken, waitForViewer, type Role } from "./helpers/auth"

/**
 * E2E nghiệm thu 4 thay đổi community + bot FrosTES đã deploy apitest 2026-08-14
 * (BE `7f39dec`, FE `8f5b604a`).
 *
 *  1. Bài không có H1 ⇒ `title: ""`, feed/chi tiết chỉ render thân bài một lần.
 *  2. Mention dạng link `[@Nhãn](/u/username)` resolve theo ĐƯỜNG DẪN, không theo nhãn.
 *  3. Ô gợi ý `@` tra `GET /profiles/mentionable` (khớp tiền tố), không còn chỉ mục tìm kiếm.
 *  4. Trần tag bot: 1000/ngày toàn hệ + 5 lượt/người/ngày; chạm trần ⇒ bot IM LẶNG.
 *
 * BẪY ĐO — mọi bài viết trong file này phải là loại "Kiến thức" (KNOWLEDGE_SHARING).
 * `BotCommunityConsumer` có lane thứ hai nghe `community.post.created` và tự trả lời MỌI
 * bài `QUESTION` kể cả khi không ai gọi tên nó, ở đúng cái neo (postId, null) mà lane
 * mention dùng. Đăng bài QUESTION là trộn hai nguồn trả lời vào một phép đo.
 *
 * Neo (anchor) = (postId, parentCommentId). Mention trong THÂN BÀI ⇒ neo là bài;
 * mention trong BÌNH LUẬN ⇒ neo là chính bình luận đó. Một trả lời mỗi neo.
 *
 * Dọn dẹp: mọi bài đều mang tiền tố `E2E-14-08` và bị DELETE ở cuối (xoá bài cuốn theo
 * bình luận). Ca 3c đổi displayName của student2.test rồi trả lại giá trị cũ.
 *
 * TỐN TIỀN THẬT: ca 3 và ca 4 gọi model qua bot. Ca 4 đốt trọn suất 5 lượt/ngày của
 * student2.test — tài khoản đó câm với bot tới 00:00 UTC hôm sau. Đừng chạy cả file
 * theo thói quen; chạy ca 1/ca 2 bằng `-g "ca 1|ca 2"` là đủ cho hồi quy hằng ngày.
 */

const API = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"

/** Tài khoản bot, seed cố định — dùng để nhận diện tác giả bình luận trả lời. */
const BOT_USER_ID = "f0057e50-0000-4000-8000-000000000001"
const BOT_USERNAME = "frostes"
const BOT_SIGNATURE = "— FrosTES (trả lời tự động bằng AI, hãy kiểm chứng lại nhé)"

const TAG = "E2E-14-08"

const apiCtx = async (role: Role): Promise<APIRequestContext> => {
    const token = await fetchToken(role)
    return pwRequest.newContext({ extraHTTPHeaders: { Authorization: `Bearer ${token}` } })
}

/** Chạy `fn` với một API context của `role` rồi luôn dispose. */
const withApi = async <T>(role: Role, fn: (ctx: APIRequestContext) => Promise<T>): Promise<T> => {
    const ctx = await apiCtx(role)
    try {
        return await fn(ctx)
    } finally {
        await ctx.dispose()
    }
}

const deletePost = async (role: Role, id: string): Promise<void> => {
    await withApi(role, (ctx) => ctx.delete(`${API}/community/posts/${id}`))
}

/**
 * Mở trang soạn bài và chờ phiên hydrate.
 *
 * Nút "Đăng bài" gated bằng `useRequireAuth`, mà cờ đó chỉ bật SAU khi GraphQL `me` trả
 * về — bấm trước thời điểm ấy là rơi vào modal đăng nhập dù localStorage đã có token.
 * Mốc chờ là chính response `me` ({@link waitForViewer}), không phải nhãn nút hồ sơ:
 * header giờ render avatar chữ cái ("ST") chứ không còn in username.
 */
const openComposer = async (page: Page, role: Role): Promise<void> => {
    await loginAs(page, role)
    const viewer = waitForViewer(page)
    await page.goto("/vi/community/new")
    await viewer
    await expect(page.locator("[contenteditable='true']").first()).toBeVisible({ timeout: 30_000 })
}

/** Bấm "Đăng bài" và trả về id bài vừa tạo (đọc từ chính response POST). */
const submitPost = async (page: Page): Promise<string> => {
    const created = page.waitForResponse(
        (r) => r.url().endsWith("/community/posts") && r.request().method() === "POST",
        { timeout: 30_000 },
    )
    await page.getByRole("button", { name: "Đăng bài", exact: true }).click()
    const res = await created
    expect(res.status(), "POST /community/posts").toBeLessThan(300)
    const id = (await res.json())?.data?.id
    expect(id, "response POST phải mang id bài").toBeTruthy()
    return id as string
}

/** Số lần `needle` xuất hiện trong `haystack`. */
const countOf = (haystack: string, needle: string): number => haystack.split(needle).length - 1

/**
 * Chờ bot trả lời ở một neo. Poll REST chứ không `waitForTimeout` cứng: lượt trả lời đi
 * qua Kafka rồi gọi model nên độ trễ dao động mạnh.
 *
 * @param anchor - `null` = neo là bài (bot bình luận gốc); id bình luận = neo là nhánh đó.
 * @returns bình luận của bot, hoặc `null` khi hết thời gian chờ.
 */
const waitForBotReply = async (
    role: Role,
    postId: string,
    anchor: string | null,
    timeoutMs = 120_000,
): Promise<{ id: string; content: string; parentId?: string } | null> => {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
        const found = await withApi(role, async (ctx) => {
            const res = await ctx.get(`${API}/community/posts/${postId}/comments?limit=50`)
            const items = (await res.json())?.data?.items ?? []
            return items.find(
                (c: { authorId: string; parentId?: string }) =>
                    c.authorId === BOT_USER_ID && (c.parentId ?? null) === anchor,
            )
        })
        if (found) return found
        await new Promise((resolve) => setTimeout(resolve, 5_000))
    }
    return null
}

// ------------------------------------------------------- Ca 1 — bài một dòng

test.describe("ca 1 — bài không có H1 không bị bịa tiêu đề", () => {
    test.describe.configure({ mode: "serial" })

    test("bài một dòng hiện ĐÚNG MỘT LẦN ở feed và trang chi tiết, title rỗng", async ({ page }) => {
        test.setTimeout(180_000)
        const line = `${TAG} mot dong khong tieu de ${Date.now()}`
        let postId = ""
        try {
            await openComposer(page, "student")
            await page.locator("[contenteditable='true']").first().click()
            await page.keyboard.type(line)
            postId = await submitPost(page)

            // (a) hợp đồng lưu trữ: BE nhận title rỗng, body giữ nguyên câu người dùng gõ
            const stored = await withApi("student", async (ctx) => {
                const res = await ctx.get(`${API}/community/posts/${postId}`)
                expect(res.status()).toBe(200)
                return (await res.json())?.data
            })
            expect(stored.title, "bài không H1 phải có title rỗng").toBe("")
            expect(stored.content).toContain(line)

            // (b) trang chi tiết — câu đó xuất hiện đúng một lần
            // Composer tự `router.push` sang trang chi tiết sau khi đăng. Đi bằng `goto` ở đây là
            // đua với cú push đang bay: nó đáp SAU, kéo trang về màn "Đang tải…" ngay sau phép đo.
            await page.waitForURL(new RegExp(`/community/${postId}`), { timeout: 30_000 })
            await expect(page.getByText(line).first()).toBeVisible({ timeout: 60_000 })
            const detail = await page.locator("body").innerText()
            expect(countOf(detail, line), "trang chi tiết in câu đó đúng 1 lần").toBe(1)
            await page.screenshot({ path: "e2e-evidence/ca1-chi-tiet-mot-lan.png" })

            // (c) feed — cùng phép đếm, phạm vi trong đúng thẻ bài
            await page.goto("/vi/community")
            const row = page.locator(`a[href$="/community/${postId}"]`).first()
            await expect(row).toBeVisible({ timeout: 60_000 })
            expect(countOf(await row.innerText(), line), "thẻ feed in câu đó đúng 1 lần").toBe(1)
            await row.screenshot({ path: "e2e-evidence/ca1-feed-mot-lan.png" })
        } finally {
            if (postId) await deletePost("student", postId)
        }
    })

    test("đối chứng — bài CÓ H1 vẫn có tiêu đề, và không lặp xuống thân bài", async ({ page }) => {
        test.setTimeout(180_000)
        const stamp = Date.now()
        const heading = `${TAG} co tieu de ${stamp}`
        const body = `${TAG} than bai khac hoan toan ${stamp}`
        let postId = ""
        try {
            await openComposer(page, "student")
            await page.locator("[contenteditable='true']").first().click()
            // "# " là input-rule của Tiptap → dòng này thành H1 thật, không phải chữ "#"
            await page.keyboard.type(`# ${heading}`)
            await page.keyboard.press("Enter")
            await page.keyboard.type(body)
            postId = await submitPost(page)

            const stored = await withApi("student", async (ctx) => {
                const res = await ctx.get(`${API}/community/posts/${postId}`)
                return (await res.json())?.data
            })
            expect(stored.title, "bài có H1 phải có title khác rỗng").toBe(heading)
            expect(stored.content, "H1 bị cắt khỏi body").not.toContain(heading)

            // Composer tự `router.push` sang trang chi tiết sau khi đăng. Đi bằng `goto` ở đây là
            // đua với cú push đang bay: nó đáp SAU, kéo trang về màn "Đang tải…" ngay sau phép đo.
            await page.waitForURL(new RegExp(`/community/${postId}`), { timeout: 30_000 })
            await expect(page.getByText(heading).first()).toBeVisible({ timeout: 60_000 })
            const detail = await page.locator("body").innerText()
            expect(countOf(detail, heading), "tiêu đề in 1 lần").toBe(1)
            expect(countOf(detail, body), "thân bài in 1 lần").toBe(1)
            await page.screenshot({ path: "e2e-evidence/ca1-doi-chung-co-h1.png" })
        } finally {
            if (postId) await deletePost("student", postId)
        }
    })
})

// ------------------------------------------------------- Ca 2 — ô gợi ý @

test.describe("ca 2 — ô gợi ý @ tra theo tiền tố", () => {
    test.describe.configure({ mode: "serial" })

    test("gõ @fro ra FrosTES qua GET /profiles/mentionable (điểm gãy cũ)", async ({ page }) => {
        test.setTimeout(150_000)
        await openComposer(page, "student")

        const lookups: Array<{ url: string; status: number }> = []
        page.on("response", (r) => {
            if (r.url().includes("/profiles/mentionable")) {
                lookups.push({ url: r.url(), status: r.status() })
            }
        })
        // Đường CŨ. Nếu còn request nào bay tới đây tức FE chưa đổi sang endpoint mới.
        let hitSearchIndex = false
        page.on("request", (r) => {
            if (/\/search\?.*types=user/.test(r.url())) hitSearchIndex = true
        })

        const editor = page.locator("[contenteditable='true']").first()
        await editor.click()
        await page.keyboard.type("@fro")

        const popup = page.locator("[role='listbox'][aria-label='Mention suggestions']")
        await expect(popup).toBeVisible({ timeout: 20_000 })
        await expect(popup.getByRole("button", { name: `FrosTES (@${BOT_USERNAME})` })).toBeVisible({
            timeout: 20_000,
        })

        await page.screenshot({ path: "e2e-evidence/ca2-popup-fro.png" })

        const fro = lookups.find((l) => l.url.includes("q=fro"))
        expect(fro, "phải có request /profiles/mentionable?q=fro").toBeTruthy()
        expect(fro?.status, "404 ở đây = FE đang gọi BE cũ").toBe(200)
        expect(hitSearchIndex, "không được gọi lại chỉ mục /search?types=user").toBe(false)

        // tối đa 5 dòng
        await page.keyboard.press("Escape")
        await editor.click()
        await page.keyboard.press("Control+A")
        await page.keyboard.press("Backspace")
        await page.keyboard.type("@stu")
        await expect(popup).toBeVisible({ timeout: 20_000 })
        const rows = await popup.getByRole("button").count()
        expect(rows, "popup tối đa 5 dòng").toBeGreaterThan(0)
        expect(rows).toBeLessThanOrEqual(5)

        // chọn bằng Enter → editor chèn chip mention
        await page.keyboard.press("Enter")
        await expect(editor.locator("[data-type='mention']").first()).toBeVisible({ timeout: 10_000 })
    })

    test("ca âm — gõ @ rồi khoảng trắng thì không bắn request nào", async ({ page }) => {
        test.setTimeout(120_000)
        await openComposer(page, "student")
        let lookups = 0
        page.on("request", (r) => {
            if (r.url().includes("/profiles/mentionable")) lookups += 1
        })
        const editor = page.locator("[contenteditable='true']").first()
        await editor.click()
        await page.keyboard.type("@   ")
        // debounce 250ms — chờ dư để một request (nếu có) kịp bay
        await page.waitForTimeout(2_000)
        expect(lookups, "query rỗng phải bị chặn ở FE").toBe(0)
    })
})

// ------------------------------------------------------- Ca 3 — mention link resolve

test.describe("ca 3 — mention dạng link resolve tới đúng người", () => {
    test.describe.configure({ mode: "serial" })

    test("3a — chọn FrosTES từ popup ⇒ bot trả lời dưới bài", async ({ page }) => {
        test.setTimeout(300_000)
        const stamp = Date.now()
        let postId = ""
        try {
            await openComposer(page, "student")
            const editor = page.locator("[contenteditable='true']").first()
            await editor.click()
            await page.keyboard.type(`${TAG} tag bot ${stamp} `)
            await page.keyboard.type("@fro")
            const popup = page.locator("[role='listbox'][aria-label='Mention suggestions']")
            await expect(popup.getByRole("button", { name: `FrosTES (@${BOT_USERNAME})` })).toBeVisible({
                timeout: 20_000,
            })
            await page.keyboard.press("Enter")
            await page.keyboard.type(" cho minh hoi 1 + 1 bang may?")
            postId = await submitPost(page)

            // markdown gửi lên phải là dạng LINK (nhãn hiển thị + username ở đường dẫn)
            const stored = await withApi("student", async (ctx) => {
                const res = await ctx.get(`${API}/community/posts/${postId}`)
                return (await res.json())?.data
            })
            expect(stored.content, "editor phải xuất mention dạng link").toContain(
                `(/u/${BOT_USERNAME})`,
            )

            const reply = await waitForBotReply("student", postId, null, 180_000)
            expect(reply, "FrosTES phải trả lời trong 180s").toBeTruthy()
            expect(reply?.content).toContain(BOT_SIGNATURE)
            console.log(`[ca3a] bot reply\n${JSON.stringify(reply, null, 1)}`)
            // `reload` chứ không `goto`: composer đã `router.push` sang chính trang này, một cú
            // goto nữa là đua với cú push đang bay và ảnh chụp dính màn "Đang tải…".
            await page.reload()
            await expect(page.getByText(BOT_SIGNATURE)).toBeVisible({ timeout: 30_000 })
            await page.screenshot({ path: "e2e-evidence/ca3a-bot-tra-loi.png", fullPage: true })
        } finally {
            if (postId) await deletePost("student", postId)
        }
    })

    test("3b — nhãn tiếng Việt CÓ DẤU vẫn resolve theo đường dẫn (bot trả lời)", async ({ page }) => {
        test.setTimeout(300_000)
        // Ca quyết định: nhãn là tên có dấu, KHÔNG cắt ra được username. Trước bản vá,
        // ContentParser bóc nhãn nên khớp @([a-zA-Z0-9_.]{3,32}) chỉ nhặt được mẩu rác.
        // Bot trả lời được ⇒ username đã lấy từ đường dẫn.
        const stamp = Date.now()
        const markdown = `${TAG} nhan co dau ${stamp}\n\n[@Nguyễn Đức Hải](/u/${BOT_USERNAME}) giup minh voi`
        let postId = ""
        try {
            postId = await withApi("student", async (ctx) => {
                const res = await ctx.post(`${API}/community/posts`, {
                    data: { postType: "KNOWLEDGE_SHARING", title: "", content: markdown },
                })
                expect(res.status(), "tạo bài").toBeLessThan(300)
                return (await res.json())?.data?.id as string
            })
            const reply = await waitForBotReply("student", postId, null, 180_000)
            expect(reply, "nhãn có dấu vẫn phải resolve ra frostes").toBeTruthy()
            expect(reply?.content).toContain(BOT_SIGNATURE)
            void page
        } finally {
            if (postId) await deletePost("student", postId)
        }
    })

    test("3c — tag NGƯỜI THẬT tên có dấu từ popup ⇒ người đó nhận thông báo mention", async ({ page }) => {
        test.setTimeout(300_000)
        // student2.test được đổi tạm displayName sang tên CÓ DẤU rồi trả lại ở finally — đây
        // đúng là ca hỏng im lặng cũ: nhãn "Học Viên Hải" không cắt ra được username nào.
        //
        // Vì sao KHÔNG dùng ctv.test: tài khoản đó thiếu quyền `profile.update.self`, mọi
        // PATCH /profiles/me trả 403 PROFILE_FORBIDDEN — chuyện của phân quyền tài khoản test,
        // không liên quan tới thay đổi đang nghiệm thu.
        const stamp = Date.now()
        const accented = `Học Viên Hải ${stamp}`
        let previousName = ""
        let postId = ""
        let controlPost = ""
        try {
            previousName = await withApi("student2", async (ctx) => {
                const res = await ctx.get(`${API}/profiles/me`)
                return (await res.json())?.data?.displayName as string
            })
            await withApi("student2", async (ctx) => {
                const res = await ctx.patch(`${API}/profiles/me`, { data: { displayName: accented } })
                expect(res.status(), "đổi tên hiển thị student2").toBeLessThan(300)
            })
            const before = await withApi("student2", async (ctx) => {
                const res = await ctx.get(`${API}/notifications?page=0&size=50`)
                return ((await res.json())?.data?.items ?? []).map((n: { id: string }) => n.id)
            })

            await openComposer(page, "student")
            const editor = page.locator("[contenteditable='true']").first()
            await editor.click()
            await page.keyboard.type(`${TAG} tag nguoi that ${stamp} `)
            await page.keyboard.type("@student2")
            const popup = page.locator("[role='listbox'][aria-label='Mention suggestions']")
            const row = popup.getByRole("button", { name: `${accented} (@student2.test)` })
            await expect(row).toBeVisible({ timeout: 20_000 })
            await page.screenshot({ path: "e2e-evidence/ca3c-popup-ten-co-dau.png" })
            await row.click()
            await page.keyboard.type(" xem giup minh nhe")
            postId = await submitPost(page)

            const stored = await withApi("student", async (ctx) => {
                const res = await ctx.get(`${API}/community/posts/${postId}`)
                return (await res.json())?.data
            })
            expect(stored.content, "nhãn có dấu, username ở đường dẫn").toContain("(/u/student2.test)")

            const arrived = async (): Promise<boolean> =>
                withApi("student2", async (ctx) => {
                    const res = await ctx.get(`${API}/notifications?page=0&size=50`)
                    const items = (await res.json())?.data?.items ?? []
                    return items.some((n: { id: string }) => !before.includes(n.id))
                })
            let got = false
            for (const deadline = Date.now() + 150_000; Date.now() < deadline; ) {
                if (await arrived()) {
                    got = true
                    break
                }
                await new Promise((resolve) => setTimeout(resolve, 5_000))
            }

            if (!got) {
                // Quy trách nhiệm trước khi kết luận: dạng gõ tay `@student2.test` vốn CHẠY từ
                // trước bản vá. Nếu nó cũng không sinh thông báo thì hỏng nằm ở đường thông báo,
                // không phải ở bước bóc mention.
                controlPost = await withApi("student", async (ctx) => {
                    const res = await ctx.post(`${API}/community/posts`, {
                        data: {
                            postType: "KNOWLEDGE_SHARING",
                            title: "",
                            content: `${TAG} doi chung go tay ${stamp}\n\n@student2.test xem giup minh nhe`,
                        },
                    })
                    return (await res.json())?.data?.id as string
                })
                let controlGot = false
                for (const deadline = Date.now() + 120_000; Date.now() < deadline; ) {
                    if (await arrived()) {
                        controlGot = true
                        break
                    }
                    await new Promise((resolve) => setTimeout(resolve, 5_000))
                }
                test.info().annotations.push({
                    type: controlGot ? "MENTION-LINK-FAIL" : "BLOCKED-NOTIFICATION-PIPELINE",
                    description: controlGot
                        ? "dạng gõ tay sinh thông báo nhưng dạng link thì không → lỗi ở bước bóc mention"
                        : "cả dạng link LẪN dạng gõ tay đều không sinh thông báo → đường thông báo hỏng, không quy được cho thay đổi này",
                })
            }
            expect(got, "người được tag phải nhận thông báo mention").toBe(true)
        } finally {
            if (postId) await deletePost("student", postId)
            if (controlPost) await deletePost("student", controlPost)
            if (previousName) {
                await withApi("student2", (ctx) =>
                    ctx.patch(`${API}/profiles/me`, { data: { displayName: previousName } }),
                )
            }
        }
    })
})

// ------------------------------------------------------- Ca 4 — trần 5 lượt/người/ngày

test.describe("ca 4 — trần tag bot 5 lượt/người/ngày", () => {
    test.describe.configure({ mode: "serial" })

    test("student2: 5 neo được trả lời, neo thứ 6 im lặng; student vẫn được trả lời", async ({ page }) => {
        test.setTimeout(900_000)
        // Trần chỉ TRỪ khi bot đăng được bình luận thật, và neo = (postId, commentId).
        // 6 bình luận RIÊNG BIỆT trên cùng một bài = 6 neo khác nhau; tag lại đúng một neo cũ
        // bị luật "một trả lời mỗi neo" chặn và KHÔNG tính vào trần.
        const stamp = Date.now()
        const mention = `[@FrosTES](/u/${BOT_USERNAME})`
        let hostPost = ""
        let controlPost = ""
        const results: Array<{ attempt: number; commentId: string; replied: boolean }> = []
        try {
            hostPost = await withApi("student2", async (ctx) => {
                const res = await ctx.post(`${API}/community/posts`, {
                    data: {
                        postType: "KNOWLEDGE_SHARING",
                        title: "",
                        content: `${TAG} tran tag bot ${stamp}`,
                    },
                })
                expect(res.status()).toBeLessThan(300)
                return (await res.json())?.data?.id as string
            })

            for (let attempt = 1; attempt <= 6; attempt += 1) {
                const commentId = await withApi("student2", async (ctx) => {
                    const res = await ctx.post(`${API}/community/posts/${hostPost}/comments`, {
                        // BE `CreateCommentRequest` gọi trường này là `content` (không phải `body`,
                        // đó là tên FE-friendly mà `addComment` map lại) — sai tên là 400.
                        data: { content: `${mention} luot ${attempt} — 2 + ${attempt} bang may?` },
                    })
                    expect(res.status(), `tạo bình luận ${attempt}`).toBeLessThan(300)
                    return (await res.json())?.data?.id as string
                })
                // Lượt 6 kỳ vọng IM LẶNG — vẫn chờ đủ lâu để không nhầm "chậm" thành "im".
                const reply = await waitForBotReply("student2", hostPost, commentId, 150_000)
                results.push({ attempt, commentId, replied: reply !== null })
                console.log(`[ca4] neo ${attempt} (${commentId}) → ${reply ? "ĐƯỢC TRẢ LỜI" : "IM LẶNG"}`)
            }

            const replied = results.filter((r) => r.replied).length
            expect(results.slice(0, 5).every((r) => r.replied), "5 neo đầu phải được trả lời").toBe(true)
            expect(results[5].replied, "neo thứ 6 phải im lặng").toBe(false)
            expect(replied).toBe(5)

            // Không có bình luận "bạn đã hết lượt" — im lặng nghĩa là KHÔNG đăng gì.
            const botComments = await withApi("student2", async (ctx) => {
                const res = await ctx.get(`${API}/community/posts/${hostPost}/comments?limit=50`)
                const items = (await res.json())?.data?.items ?? []
                return items.filter((c: { authorId: string }) => c.authorId === BOT_USER_ID)
            })
            expect(botComments.length, "bot đăng đúng 5 bình luận, không có câu báo hết lượt").toBe(5)

            // ĐỐI CHỨNG — trần theo NGƯỜI, không phải trần toàn cục bị chạm.
            controlPost = await withApi("student", async (ctx) => {
                const res = await ctx.post(`${API}/community/posts`, {
                    data: {
                        postType: "KNOWLEDGE_SHARING",
                        title: "",
                        content: `${TAG} doi chung tran ${stamp}\n\n${mention} 3 + 4 bang may?`,
                    },
                })
                expect(res.status()).toBeLessThan(300)
                return (await res.json())?.data?.id as string
            })
            const control = await waitForBotReply("student", controlPost, null, 180_000)
            expect(control, "student (người khác) vẫn phải được trả lời").toBeTruthy()
            void page
        } finally {
            if (hostPost) await deletePost("student2", hostPost)
            if (controlPost) await deletePost("student", controlPost)
        }
    })
})

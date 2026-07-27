import { test, expect, request as pwRequest, type APIRequestContext } from "@playwright/test"
import { loginAs, fetchToken } from "./helpers/auth"

/**
 * E2E — course-purchase-journey (vai HỌC VIÊN, khoá nghiệm thu vòng 4)
 *
 * Kịch bản đầu-cuối một lần mua thật trên apitest:
 *   1. chuẩn bị dữ liệu — khoá nghiệm thu chưa có sản phẩm bán → spec tự tạo
 *      COURSE_UNLOCK (giá VND + giá Xu) bằng token admin, xoá lại ở afterAll;
 *   2. thêm vào giỏ từ trang chi tiết khoá → giỏ /vi/cart mở được thanh toán;
 *   3. "Đăng ký học" → PaymentModal → tab "Trả bằng Xu" → "Chúc mừng!" +
 *      BE xác nhận `purchased: true`;
 *   4. sau khi mua vào /learn đọc được bài DOCUMENT ĐẦY ĐỦ (mã bí mật 4271).
 *
 * VÌ SAO PHẢI TẠO SẢN PHẨM (đừng chỉ "đặt giá cho khoá"):
 * FE lấy giá bán từ **commerce product** (`GET /commerce/products/for-course/{uuid}`),
 * KHÔNG từ `course.salePrice` — `course.price.vnd` chỉ là `preferPriceVnd` để CHỌN
 * product khi khoá có nhiều product. Khoá nghiệm thu trả `{products: [], cheapest: null}`
 * → FE render nút "Chưa mở bán" (disabled) và không có gì để checkout. Nên phần chuẩn bị
 * tạo hẳn một COURSE_UNLOCK trỏ `fulfillmentConfig.courseId` về khoá nghiệm thu.
 * KHÔNG đụng `course.salePrice` (dữ liệu nghiệm thu dùng chung với các spec khác) — hệ quả
 * duy nhất là headline card hiện "0₫" trong khi PaymentModal thu đúng giá product; luồng mua
 * không phụ thuộc con số đó.
 *
 * VÌ SAO TRẢ BẰNG XU: đường Xu settle ĐỒNG BỘ (BE trừ ví ngay, checkout trả luôn trạng thái
 * cuối) nên chạy được tới "Chúc mừng!" trong một lần chạy. VietQR chỉ dừng ở "Đang chờ thanh
 * toán..." cho tới khi webhook ngân hàng bắn — không tự settle trong test.
 * Ví không đủ xu / khoá đã mua rồi → `test.skip` kèm lý do, KHÔNG assert giả.
 *
 * MỘT LẦN / TÀI KHOẢN: BE không có endpoint huỷ enrollment (đã rà `AdminContentController` —
 * chỉ có `POST /admin/courses/{id}/enrollments` để CẤP, không có đường thu hồi), nên khi
 * student.test đã SỞ HỮU khoá thì trang chi tiết đổi sang "Tiếp tục học" — ca thêm-giỏ và ca mua
 * tự skip với lý do rõ, ca "vào học được" vẫn chạy (đó mới là hậu điều kiện cần giữ).
 *
 * ★ "SỞ HỮU" = `enrolled`, KHÔNG phải `purchased`. `CourseDetail` chỉ nhìn `isEnrolled` để đổi
 * card sang "Tiếp tục học" + "Bạn đã đăng ký khóa này." — mua hay được admin CẤP đều như nhau.
 * Spec `course-learn-and-ai` cấp ghi danh cho student.test qua đường admin (`adminGrant`, KHÔNG
 * đặt `isPurchased`) để chạy phần reader, nên sau lần chạy đó access là
 * `{enrolled: true, purchased: false}`. Guard cũ chỉ đọc `purchased` → không skip, rồi đỏ vì
 * "không tìm thấy nút Thêm vào giỏ" trong khi UI đang ĐÚNG (đã có card 'Tiếp tục học').
 */

const API = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"

/** Khoá nghiệm thu vòng 4 — LEGACY, PUBLISHED, chưa có giá/gói. */
const COURSE_UUID = "20214b93-6bfd-4f1b-845a-7da4ea29032c"
const COURSE_SLUG = "e2e-v4-course-505089-ccf58cc7"
const SECTION_ID = "a991489f-ca3b-4471-ac73-90c3afe113a9"
/** Bài DOCUMENT — nội dung chứa con số bí mật, chỉ đọc được khi đã mở khoá. */
const DOC_LESSON_ID = "3f74ca4c-9f88-44b2-bccf-3aaaa4caee94"
const SECRET = "4271"

/** Giá sản phẩm nghiệm thu — cố ý rẻ để không rút cạn ví test. */
const PRICE_VND = 1000
const PRICE_COIN = 500

/**
 * React hydrate xong SAU khi nội dung đã render: click sớm hơn rơi vào hư không
 * (handler chưa gắn). Chờ cứng 1.5s trước mỗi click "thật" của luồng mua.
 */
const HYDRATE_MS = 1500

/** WAF apitest chặn request không có User-Agent → mọi context REST phụ trợ phải khai. */
const UA = "Mozilla/5.0 (E2E course-purchase-journey)"

type ProductRow = { id: string; name: string; priceVnd: number; priceCoin: number | null }

const apiContext = async (role: "student" | "admin"): Promise<APIRequestContext> => {
    const token = await fetchToken(role)
    return pwRequest.newContext({
        extraHTTPHeaders: { Authorization: `Bearer ${token}`, "User-Agent": UA },
    })
}

/** Giỏ hàng apitest hay còn rác từ ca trước → dọn qua REST trước mỗi ca đụng giỏ. */
const clearCart = async (): Promise<void> => {
    const ctx = await apiContext("student")
    try {
        const res = await ctx.get(`${API}/commerce/cart`)
        const items = (await res.json())?.data?.items ?? []
        for (const item of items) {
            await ctx.delete(`${API}/commerce/cart/items/${item.id}`)
        }
    } finally {
        await ctx.dispose()
    }
}

/**
 * Tên HIỆN TẠI của bài DOCUMENT theo BE.
 *
 * KHÔNG hardcode tiêu đề: hai spec khác dùng CHUNG bài này và cùng đổi tên nó mỗi lần chạy
 * (`course-authoring-closed-loop` đặt "E2E Loop Doc <stamp>", `course-student-journey` đặt
 * "Bài 2 — Tài liệu con trỏ (sửa NNNN)"), nên tiêu đề cố định /Tài liệu con trỏ/ đỏ oan tuỳ
 * THỨ TỰ CHẠY. Đọc tên thật rồi mới chấm "đúng bài đang mở".
 */
const readDocLessonName = async (): Promise<string> => {
    const ctx = await pwRequest.newContext({ extraHTTPHeaders: { "User-Agent": UA } })
    try {
        const res = await ctx.get(`${API}/courses/${COURSE_SLUG}`)
        const sections = (await res.json())?.data?.sections ?? []
        const lesson = sections
            .flatMap((section: { lessons?: Array<{ id: string; name: string }> }) => section.lessons ?? [])
            .find((row: { id: string }) => row.id === DOC_LESSON_ID)
        return lesson?.name ?? ""
    } finally {
        await ctx.dispose()
    }
}

/** Sự thật phía BE về quyền của chính student trên khoá — dùng làm hậu điều kiện của ca mua. */
const readAccess = async (): Promise<{ enrolled: boolean; purchased: boolean }> => {
    const ctx = await apiContext("student")
    try {
        const res = await ctx.get(`${API}/courses/${COURSE_UUID}/me/access`)
        const data = (await res.json())?.data ?? {}
        return { enrolled: data.enrolled === true, purchased: data.purchased === true }
    } finally {
        await ctx.dispose()
    }
}

const readWalletBalance = async (): Promise<number> => {
    const ctx = await apiContext("student")
    try {
        const res = await ctx.get(`${API}/wallet/me`)
        return Number((await res.json())?.data?.balance ?? 0)
    } finally {
        await ctx.dispose()
    }
}

/**
 * Sản phẩm ACTIVE đang mở khoá cho course.
 * Endpoint trả shape BỌC `{products, cheapest}` — KHÔNG có id cấp trên; id thật nằm ở
 * `products[].id` (đọc `data.id` sẽ ra undefined rồi POST giỏ 400).
 */
const resolveProduct = async (): Promise<ProductRow | null> => {
    const ctx = await pwRequest.newContext({ extraHTTPHeaders: { "User-Agent": UA } })
    try {
        const res = await ctx.get(`${API}/commerce/products/for-course/${COURSE_UUID}`)
        const products: ProductRow[] = (await res.json())?.data?.products ?? []
        return products[0] ?? null
    } finally {
        await ctx.dispose()
    }
}

/**
 * Tạo COURSE_UNLOCK cho khoá nghiệm thu (perm `commerce.product.manage`).
 * - `slug` PHẢI unique (trùng → 500) nên gắn timestamp.
 * - `status: "ACTIVE"` bắt buộc: bỏ trống = DRAFT → `for-course` không thấy.
 * - có CẢ `priceVnd` LẪN `priceCoin` thì PaymentModal mới render toggle
 *   "Chuyển khoản QR" / "Trả bằng Xu"; chỉ một giá → không có tab để bấm.
 * - LEGACY không cần `packageId` (chỉ `saleMode=PACKAGE` mới bắt buộc).
 */
const createUnlockProduct = async (): Promise<ProductRow> => {
    const ctx = await apiContext("admin")
    try {
        const res = await ctx.post(`${API}/commerce/admin/products`, {
            data: {
                type: "COURSE_UNLOCK",
                name: "E2E Purchase Journey Unlock",
                slug: `cu-e2e-journey-${Date.now()}`,
                priceVnd: PRICE_VND,
                priceCoin: PRICE_COIN,
                fulfillmentConfig: JSON.stringify({ courseId: COURSE_UUID }),
                status: "ACTIVE",
            },
        })
        const body = await res.json()
        const product = body?.data
        if (!product?.id) {
            throw new Error(`tạo COURSE_UNLOCK thất bại: ${JSON.stringify(body).slice(0, 300)}`)
        }
        return product as ProductRow
    } finally {
        await ctx.dispose()
    }
}

/** Archive sản phẩm spec tự tạo (soft-delete; product mua rồi vẫn giữ lịch sử đơn). */
const archiveProduct = async (productId: string): Promise<void> => {
    const ctx = await apiContext("admin")
    try {
        await ctx.delete(`${API}/commerce/admin/products/${productId}`)
    } finally {
        await ctx.dispose()
    }
}

/** Sản phẩm đang dùng cho ca mua (có sẵn trên apitest hoặc do spec tạo). */
let product: ProductRow | null = null
/** Chỉ dọn sản phẩm do CHÍNH spec tạo — sản phẩm có sẵn là dữ liệu của người khác. */
let productCreatedHere = false
/** Số dư ví student tại lúc chuẩn bị → quyết định ca Xu chạy hay skip. */
let walletBalance = 0
/**
 * student.test đã SỞ HỮU khoá (mua HOẶC được admin cấp) từ lần chạy trước? → luồng mua không tái
 * hiện được vì card chi tiết đã đổi sang "Tiếp tục học".
 */
let alreadyOwned = false

test.describe("course-purchase-journey", () => {
    test.describe.configure({ mode: "serial" })
    test.setTimeout(180_000)

    /**
     * Trên mobile, CTA mua trong trang bị sticky bottom-bar che (bản trong trang là surface
     * khác) → click rơi vào nút bị che. Luồng mua verify ở desktop, đúng như spec mẫu
     * fix-course-purchase-product-resolve.
     */
    const skipOnMobile = () =>
        test.skip(
            test.info().project.name === "mobile",
            "CTA mua bị sticky bottom-bar che trên mobile — luồng mua verify ở desktop",
        )

    test.beforeAll(async () => {
        product = await resolveProduct()
        if (!product) {
            product = await createUnlockProduct()
            productCreatedHere = true
        }
        walletBalance = await readWalletBalance()
        const access = await readAccess()
        alreadyOwned = access.enrolled || access.purchased
    })

    test.afterAll(async () => {
        await clearCart()
        if (productCreatedHere && product) await archiveProduct(product.id)
    })

    test("chuẩn bị: khoá nghiệm thu resolve ra COURSE_UNLOCK có giá VND + giá Xu", async () => {
        // Chờ DƯƠNG trên chính contract mà FE đọc: có product ⇒ nút mua sẽ bật
        // (thay vì đổi nhãn "Chưa mở bán" + disabled).
        expect(product, "for-course phải trả về ít nhất 1 product sau bước chuẩn bị").not.toBeNull()
        expect(Number(product?.priceVnd ?? 0)).toBeGreaterThan(0)
        expect(Number(product?.priceCoin ?? 0)).toBeGreaterThan(0)
    })

    test("thêm vào giỏ từ trang chi tiết khoá → /vi/cart có dòng và mở được thanh toán", async ({
        page,
    }) => {
        skipOnMobile()
        test.skip(
            alreadyOwned,
            "student.test đã sở hữu khoá nghiệm thu (enrolled — mua hoặc được admin cấp; BE không có endpoint huỷ enrollment) → card đổi sang 'Tiếp tục học', không còn nút thêm giỏ",
        )
        await clearCart()
        await loginAs(page, "student")

        // Đăng ký chờ TRƯỚC goto: resolve product bắn ngay khi card mount.
        const forCourseRes = page.waitForResponse(
            (r) =>
                r.url().includes(`/commerce/products/for-course/${COURSE_UUID}`) &&
                r.request().method() === "GET",
            { timeout: 90_000 },
        )
        // KHÔNG waitForViewer ở /vi/courses/... — route này không phát GraphQL "me" nên chờ sẽ
        // treo 30s. Cờ đăng nhập hydrate xong khi avatar navbar hiện.
        await page.goto(`/vi/courses/${COURSE_SLUG}`)
        expect((await forCourseRes).ok()).toBe(true)
        await expect(page.getByRole("button", { name: /student_test/ })).toBeVisible({
            timeout: 60_000,
        })

        const addBtn = page.getByRole("button", { name: "Thêm vào giỏ" })
        await expect(addBtn).toBeVisible({ timeout: 60_000 })
        await expect(addBtn).toBeEnabled({ timeout: 30_000 })
        await page.waitForTimeout(HYDRATE_MS)

        const cartRes = page.waitForResponse(
            (r) => r.url().endsWith("/commerce/cart/items") && r.request().method() === "POST",
            { timeout: 60_000 },
        )
        await addBtn.click()
        expect((await cartRes).status()).toBe(200)

        // Chờ DƯƠNG: nút phụ lật sang trạng thái "đã ở trong giỏ" (bấm lần nữa = xoá khỏi giỏ).
        await expect(page.getByRole("button", { name: "Đã ở trong giỏ" })).toBeVisible({
            timeout: 30_000,
        })

        // Trang giỏ đầy đủ: giỏ RỖNG render "Giỏ hàng trống." thay vì tạm tính + nút thanh toán,
        // nên hai assert dưới là bằng chứng dương rằng dòng hàng đã vào giỏ.
        await page.goto("/vi/cart")
        await expect(page.getByText("Tạm tính")).toBeVisible({ timeout: 60_000 })
        await expect(page.getByRole("button", { name: "Thanh toán" })).toBeVisible({
            timeout: 30_000,
        })
    })

    test("mua bằng Xu: Đăng ký học → tab Trả bằng Xu → Chúc mừng! → BE ghi nhận purchased", async ({
        page,
    }) => {
        skipOnMobile()
        test.skip(
            alreadyOwned,
            "student.test đã sở hữu khoá nghiệm thu (enrolled) — luồng mua chỉ tái hiện được 1 lần/tài khoản (BE không có endpoint huỷ enrollment)",
        )
        test.skip(
            !product?.priceCoin,
            "sản phẩm không có giá Xu → PaymentModal không render tab 'Trả bằng Xu'",
        )
        test.skip(
            walletBalance < Number(product?.priceCoin ?? 0),
            `ví student.test chỉ còn ${walletBalance} xu, cần ${product?.priceCoin} xu — nạp thêm qua /wallet/admin/adjustments rồi chạy lại`,
        )
        await clearCart()
        await loginAs(page, "student")

        const forCourseRes = page.waitForResponse(
            (r) =>
                r.url().includes(`/commerce/products/for-course/${COURSE_UUID}`) &&
                r.request().method() === "GET",
            { timeout: 90_000 },
        )
        await page.goto(`/vi/courses/${COURSE_SLUG}`)
        expect((await forCourseRes).ok()).toBe(true)
        await expect(page.getByRole("button", { name: /student_test/ })).toBeVisible({
            timeout: 60_000,
        })

        // Picker mặc định đã chọn "Trọn khóa" → CTA chính là "Đăng ký học" (nếu resolve product
        // hỏng thì nhãn sẽ là "Chưa mở bán" + disabled, assert dưới bắt được ngay).
        const enrollBtn = page.getByRole("button", { name: "Đăng ký học" })
        await expect(enrollBtn).toBeVisible({ timeout: 60_000 })
        await expect(enrollBtn).toBeEnabled({ timeout: 30_000 })
        await page.waitForTimeout(HYDRATE_MS)

        const cartRes = page.waitForResponse(
            (r) => r.url().endsWith("/commerce/cart/items") && r.request().method() === "POST",
            { timeout: 60_000 },
        )
        await enrollBtn.click()
        expect((await cartRes).status()).toBe(200)

        const modal = page.getByRole("dialog").filter({ hasText: "Thanh toán" })
        const payBtn = modal.getByRole("button", { name: "Thanh toán", exact: true })
        // exact:true để không dính tiêu đề modal (cũng là chữ "Thanh toán").
        await expect(payBtn).toBeVisible({ timeout: 30_000 })

        // Product có cả priceVnd lẫn priceCoin → modal mở mặc định ở tab VietQR, phải chuyển tab.
        const coinTab = modal.getByRole("button", { name: "Trả bằng Xu" })
        await expect(coinTab).toBeVisible({ timeout: 30_000 })
        await page.waitForTimeout(HYDRATE_MS)
        await coinTab.click()

        // Chờ DƯƠNG cho tab Xu: panel số dư ví chỉ render khi method === "COIN".
        await expect(modal.getByText("Số dư ví")).toBeVisible({ timeout: 30_000 })
        // Thiếu xu thì nút bị disable + hiện "Số dư xu không đủ..." → assert enabled là bằng chứng
        // ví đủ tiền, không phải suy đoán.
        await expect(payBtn).toBeEnabled({ timeout: 30_000 })

        // Đọc lại số dư NGAY TRƯỚC khi trả (không dùng lại số của beforeAll): apitest chạy chung,
        // spec khác có thể đã tiêu xu trong lúc ca này chờ.
        const balanceBefore = await readWalletBalance()

        const checkoutRes = page.waitForResponse(
            (r) => r.url().endsWith("/commerce/checkout") && r.request().method() === "POST",
            { timeout: 90_000 },
        )
        await payBtn.click()
        expect((await checkoutRes).status()).toBe(200)

        // Xu settle ĐỒNG BỘ → modal nhảy thẳng sang phase success, không phải poll như VietQR.
        await expect(modal.getByText("Chúc mừng!")).toBeVisible({ timeout: 60_000 })
        await expect(modal.getByRole("button", { name: "Bắt đầu học ngay" })).toBeVisible({
            timeout: 30_000,
        })

        // Sự thật BE, không chỉ UI: quyền đã ghi nhận + ví đã bị trừ đúng số xu.
        const access = await readAccess()
        expect(access.purchased, "BE phải ghi nhận đã mua sau khi trả bằng Xu").toBe(true)
        const balanceAfter = await readWalletBalance()
        expect(balanceAfter).toBe(balanceBefore - Number(product?.priceCoin ?? 0))
    })

    test("sau khi mua: mở bài DOCUMENT trong /learn đọc được nội dung đầy đủ", async ({ page }) => {
        skipOnMobile()
        // Hậu điều kiện thật của cả hành trình. Đọc lại từ BE thay vì tin state của ca trước.
        // Điều kiện là QUYỀN HỌC (`enrolled`) chứ không riêng `purchased`: khi ca mua bị skip vì
        // student.test đã sở hữu khoá từ trước (mua ở lần chạy trước, hoặc được admin cấp cho spec
        // reader), ca này vẫn phải chứng minh người SỞ HỮU đọc được bài đầy đủ — đó mới là thứ
        // luồng mua tồn tại để đạt tới. Không sở hữu ⇒ đỏ, đúng như trước.
        const access = await readAccess()
        expect(
            access.enrolled || access.purchased,
            "student phải sở hữu khoá (mua ở ca trên, hoặc đã sở hữu từ trước) trước khi kiểm tra quyền học",
        ).toBe(true)

        // Tên bài đọc từ BE NGAY TRƯỚC khi mở (spec khác đổi tên bài này mỗi lần chạy).
        const docTitle = await readDocLessonName()
        expect(docTitle, "BE phải trả về tên bài DOCUMENT của khoá nghiệm thu").not.toBe("")

        await loginAs(page, "student")
        await page.goto(
            `/vi/courses/${COURSE_SLUG}/learn/content/modules/${SECTION_ID}/contents/${DOC_LESSON_ID}`,
        )

        // Route /learn nguội (SSR + gate session_hint) → timeout rộng.
        await expect(page.getByRole("heading", { name: docTitle })).toBeVisible({
            timeout: 90_000,
        })
        // Chờ DƯƠNG trên NỘI DUNG: con số bí mật chỉ nằm trong thân bài, bản học thử bị cắt
        // nên nhìn thấy nó = đã mở khoá thật (mạnh hơn "không thấy chữ paywall").
        await expect(page.getByText(new RegExp(SECRET)).first()).toBeVisible({ timeout: 60_000 })
    })
})

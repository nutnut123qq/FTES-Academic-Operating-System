import { RestError } from "@/modules/api/rest/client"
import {
    addCartItem,
    checkout,
    getCart,
    getProductBySlug,
    isPaidOrderStatus,
    removeCartItem,
    type CheckoutResult,
} from "@/modules/api/rest/commerce"
import type { PlanPurchaseTicket } from "./usePlanPurchase"

/**
 * Vì sao một lần mua gói KHÔNG tạo được đơn. Mỗi mã ứng đúng một câu trong
 * `profileSettings.purchase.coin.errors.*` — mọi câu đều nói rõ "chưa trừ tiền", vì đó là
 * điều duy nhất người mua cần biết ngay lúc đó.
 */
export type PlanCheckoutFailure =
    | "notOnSale"
    | "priceChanged"
    | "insufficientCoin"
    | "coinNotSupported"
    | "generic"

/** Lỗi có mã, để chỗ gọi dịch sang câu tiếng người qua messages. */
export class PlanCheckoutError extends Error {
    readonly failure: PlanCheckoutFailure

    constructor(failure: PlanCheckoutFailure) {
        super(failure)
        this.name = "PlanCheckoutError"
        this.failure = failure
    }
}

/**
 * Phân loại lỗi của một lần checkout gói.
 *
 * Chỉ hai mã của backend được dịch riêng, vì chỉ hai mã đó người mua tự xử lý được:
 * xin quá trần Xu (chọn mức thấp hơn) và áp Xu vào cổng không nhận Xu. Mọi thứ khác gom
 * về `generic` — đoán bừa nguyên nhân trên đường tiền còn tệ hơn nói "chưa trừ tiền, thử lại".
 */
export const planCheckoutFailure = (error: unknown): PlanCheckoutFailure => {
    if (error instanceof PlanCheckoutError) return error.failure
    if (error instanceof RestError) {
        if (error.errorCode === "COMMERCE_INSUFFICIENT_COIN") return "insufficientCoin"
        if (error.errorCode === "COMMERCE_UNSUPPORTED_PAY_METHOD") return "coinNotSupported"
    }
    return "generic"
}

/**
 * Đọc kết quả checkout thành cái vé mà hộp thoại theo dõi — hoặc `null` khi kết quả đó
 * KHÔNG phải một đơn dùng được.
 *
 * Luật "chỉ nhận là có đơn khi thật sự có đơn": thiếu `orderId` là không có gì để theo dõi.
 * Thiếu QR thì tuỳ: Xu phủ trọn đơn ⇒ đơn đã `PAID` và backend cố tình KHÔNG dựng QR 0đ
 * (ngân hàng không nhận), nên đó là vé hợp lệ; còn đơn chưa trả tiền mà không có QR thì
 * người mua không có đường nào để trả — thà báo lỗi còn hơn để họ ngồi nhìn màn hình chờ.
 */
export const planTicketOf = (result: CheckoutResult | null | undefined): PlanPurchaseTicket | null => {
    if (!result?.orderId) return null
    const amount = result.amount ?? 0
    const qrCode = result.qrCode ?? ""
    if (!qrCode && !isPaidOrderStatus(result.status)) return null
    return {
        orderId: result.orderId,
        qrCode,
        amount,
        // Số Xu backend THỰC SỰ trừ, không phải số FE xin — chênh nhau thì cái đúng là của backend.
        coinApplied: result.coinApplied ?? 0,
        coinDiscountVnd: result.coinDiscountVnd ?? 0,
    }
}

/**
 * Kết quả một lần mua gói. Thất bại mang MÃ chứ không mang câu chữ: dịch sang tiếng người
 * là việc của component (nơi có `useTranslations`), module này không được đẻ ra text.
 */
export type PlanCheckoutOutcome =
    | { ok: true; ticket: PlanPurchaseTicket; status?: string | null }
    | {
          ok: false
          failure: PlanCheckoutFailure
          /**
           * Khoá idempotency đã HỎNG, lần thử sau phải đổi khoá mới.
           *
           * Backend gắn đơn theo khoá và trả lại ĐƠN CŨ cho mọi lần gọi trùng khoá — kể cả
           * đơn vừa bị đánh FAILED. Giữ nguyên khoá sau một lần lỗi tức là mãi mãi nhận lại
           * đúng cái đơn hỏng đó, bấm bao nhiêu lần cũng vậy.
           *
           * `false` khi backend CHƯA chắc đã nhận (lỗi mạng, chưa có phản hồi): lúc đó phải
           * GIỮ khoá, vì đơn có thể đã được tạo và chỉ có khoá cũ mới lấy lại được nó thay
           * vì đẻ đơn thứ hai (và trừ Xu hai lần).
           */
          keyBurnt: boolean
      }

/** Tham số một lần mua gói qua giỏ → checkout. */
export interface StartPlanCheckoutInput {
    /** Slug của product gói (với gói AI, chính là `tier`). */
    slug: string
    /** Giá VND đang HIỂN THỊ trên thẻ gói — dùng để đối chiếu với giá thật của product. */
    expectedPriceVnd: number
    /** Số Xu muốn áp (đã kẹp theo trần của báo giá). `0` = không dùng Xu. */
    coinToApply: number
    /** Khoá chống tạo hai đơn cho một lần mua. */
    idempotencyKey: string
}

/**
 * Mua một gói bằng luồng giỏ → `POST /commerce/checkout`, kèm số Xu muốn áp.
 *
 * **Vì sao không dùng mutation GraphQL `purchaseAiSubscription` như trước:** mutation đó
 * không nhận `coinToApply` (xem hợp đồng backend), nên đường duy nhất áp được Xu là gọi
 * thẳng checkout. Đổi lại, những chốt an toàn mà `SubscriptionPurchaseService` làm hộ phải
 * được làm lại ở đây — và đây là chỗ dễ mất tiền nhất của màn này:
 *
 * - **Chỉ mua gói đang mở bán.** `POST /cart/items` KHÔNG kiểm `status`, nên nếu không chặn
 *   ở đây thì một gói đã rút khỏi sạp vẫn checkout được.
 * - **Giá phải khớp cái đang hiện trên thẻ.** Giá đổi giữa lúc mở màn và lúc bấm ⇒ dừng lại,
 *   không âm thầm thu một số tiền khác số người mua vừa đọc.
 * - **Đúng MỘT kỳ mỗi lần mua.** `addItem` CỘNG DỒN số lượng nếu gói đã nằm trong giỏ, nên
 *   phải dọn dòng cũ trước; không dọn thì lần bấm thứ hai (sau một lần lỗi) tính tiền gấp đôi.
 * - **Hỏng thì không để lại rác.** Checkout ném lỗi ⇒ gỡ dòng vừa thêm; checkout trả lại đơn
 *   CŨ theo idempotency ⇒ nó không tiêu dòng giỏ, cũng gỡ nốt.
 *
 * Số tiền cuối và số Xu bị trừ đều do backend tính lại; hàm này chỉ gửi lên SỐ XU.
 */
export const startPlanCheckout = async (
    input: StartPlanCheckoutInput,
): Promise<PlanCheckoutOutcome> => {
    try {
        const product = await getProductBySlug(input.slug)
        if (!product?.id || product.status !== "ACTIVE") {
            throw new PlanCheckoutError("notOnSale")
        }
        // So sánh ÉP SỐ: hai con số này đến từ hai đường khác nhau (GraphQL cho thẻ gói, REST cho
        // product), nên đừng để một bên trả chuỗi là chặn sạch mọi lần mua. Không có giá VND thì
        // coi như không bán được — mở checkout cho một số tiền không biết là chỗ hỏng nhất.
        const price = Number(product.priceVnd)
        if (!Number.isFinite(price) || price <= 0) {
            throw new PlanCheckoutError("notOnSale")
        }
        if (price !== Number(input.expectedPriceVnd)) {
            throw new PlanCheckoutError("priceChanged")
        }

        const cart = await getCart()
        for (const line of cart?.items ?? []) {
            if (line.productId === product.id) {
                await removeCartItem(line.id)
            }
        }
        const item = await addCartItem({ productId: product.id, quantity: 1 })

        let result: CheckoutResult
        try {
            result = await checkout({
                itemIds: [item.id],
                payMethod: "VIETQR",
                idempotencyKey: input.idempotencyKey,
                coinToApply: input.coinToApply > 0 ? input.coinToApply : undefined,
            })
        } catch (error) {
            await dropQuietly(item.id)
            return {
                ok: false,
                failure: planCheckoutFailure(error),
                // Backend đã TRẢ LỜI là hỏng ⇒ đơn của khoá này chết, phải đổi khoá. Không có
                // phản hồi (status 0 = mạng đứt) ⇒ chưa biết, giữ khoá để lần sau lấy lại đúng
                // đơn đó thay vì tạo đơn thứ hai.
                keyBurnt: error instanceof RestError && error.status > 0,
            }
        }
        // Đường thường: checkout đã xoá dòng giỏ ⇒ lệnh này 404, không phải lỗi. Đường
        // idempotency (trả lại đơn cũ): dòng còn đó ⇒ đây là chỗ dọn.
        await dropQuietly(item.id)

        const ticket = planTicketOf(result)
        // Có phản hồi nhưng không dùng được (đơn cũ đã chết theo khoá này) ⇒ khoá hỏng.
        if (!ticket) return { ok: false, failure: "generic", keyBurnt: true }
        return { ok: true, ticket, status: result.status }
    } catch (error) {
        // Hỏng TRƯỚC khi gọi checkout (gói ngừng bán, giá đổi, giỏ lỗi) ⇒ khoá chưa dùng đến.
        return { ok: false, failure: planCheckoutFailure(error), keyBurnt: false }
    }
}

/** Gỡ một dòng giỏ, nuốt lỗi: dòng đã bị checkout tiêu thì `removeItem` báo không tồn tại. */
const dropQuietly = async (itemId: string): Promise<void> => {
    try {
        await removeCartItem(itemId)
    } catch {
        // không sao — dòng giỏ đã được checkout dọn
    }
}

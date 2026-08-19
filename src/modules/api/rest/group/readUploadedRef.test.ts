import { describe, expect, it } from "vitest"

import { readUploadedRef } from "./group"

/**
 * Unit — {@link readUploadedRef}: rút định danh ảnh ra khỏi phản hồi của dịch vụ upload.
 *
 * Đây là mắt xích khiến ảnh nhóm "tải lên thành công" mà không bao giờ hiện (góp ý #13):
 * thiếu định danh này thì bước verify chỉ còn khoá backend tự sinh, và URL proxy dựng từ đó
 * luôn 404. Trả `null` ở đây là tín hiệu để `uploadGroupMediaFile` ném lỗi — im lặng đồng
 * nghĩa với việc lưu tiếp một ảnh chết.
 */
describe("readUploadedRef", () => {
    it("đọc được id ở dạng phẳng", () => {
        expect(readUploadedRef({ id: "img_123" })).toBe("img_123")
    })

    it("đọc được các tên trường khác mà dịch vụ upload có thể dùng", () => {
        expect(readUploadedRef({ imageId: "abc" })).toBe("abc")
        expect(readUploadedRef({ image_id: "abc" })).toBe("abc")
        expect(readUploadedRef({ url: "https://upload.ftes.vn/api/images/proxy/abc" }))
            .toBe("https://upload.ftes.vn/api/images/proxy/abc")
    })

    it("bóc được envelope `{ data: … }` kiểu backend nhà", () => {
        expect(readUploadedRef({ data: { id: "img_9" } })).toBe("img_9")
    })

    it("nhận cả phản hồi là một chuỗi trần", () => {
        expect(readUploadedRef("img_7")).toBe("img_7")
    })

    it("bỏ khoảng trắng thừa và coi chuỗi rỗng như không có", () => {
        expect(readUploadedRef({ id: "  img_1  " })).toBe("img_1")
        expect(readUploadedRef({ id: "   " })).toBeNull()
    })

    it("trả null khi không nhận ra trường nào — caller phải báo lỗi, không được nuốt", () => {
        expect(readUploadedRef({ somethingElse: "x" })).toBeNull()
        expect(readUploadedRef(null)).toBeNull()
        expect(readUploadedRef(undefined)).toBeNull()
        expect(readUploadedRef(42)).toBeNull()
    })

    it("bỏ qua trường đúng tên nhưng sai kiểu", () => {
        // Một dịch vụ trả `{ id: 123 }` (số) thì ghép vào URL sẽ ra khoá sai kiểu; thà báo
        // lỗi còn hơn lưu một khoá không dùng được.
        expect(readUploadedRef({ id: 123 })).toBeNull()
    })
})

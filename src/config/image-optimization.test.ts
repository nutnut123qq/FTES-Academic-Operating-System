import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

/**
 * Ảnh REMOTE phải đi qua optimizer, và ảnh `fill` phải khai `sizes`.
 *
 * <p><b>Vì sao ghim bằng test.</b> Cả hai lỗi đều KHÔNG làm gì đỏ, không log gì, và trên máy dev
 * với ảnh nhỏ thì không ai thấy. Đã trả giá thật: bốn chỗ vẽ ảnh bìa khoá học gắn `unoptimized`
 * từ thời bìa còn là ảnh picsum giả, kèm chú thích "drop when real covers land". Bìa thật lên rồi
 * mà cờ vẫn nằm đó — đo trên production: một thẻ 16:9 rộng ~300px tải nguyên bản gốc 2,2–4,0 MB,
 * cả trang danh mục 73 MB / 231 request. Qua optimizer ở w=640 còn ~73 KB.
 *
 * <p>`fill` mà thiếu `sizes` thì Next mặc định `100vw`: trình duyệt chọn ảnh to nhất trong srcset
 * cho một ô có khi chỉ 56px. Lỗi này im lặng y hệt.
 */
const SRC = join(process.cwd(), "src", "components")

const tsxFiles = (dir: string): Array<string> =>
    readdirSync(dir).flatMap((name) => {
        const full = join(dir, name)
        if (statSync(full).isDirectory()) {
            return tsxFiles(full)
        }
        return name.endsWith(".tsx") && !name.includes(".test.") ? [full] : []
    })

/** Mỗi phần tử `<Image ... />` trong file, kèm đường dẫn để báo lỗi chỉ đúng chỗ. */
const imageElements = (): Array<{ file: string; jsx: string }> =>
    tsxFiles(SRC).flatMap((file) => {
        const src = readFileSync(file, "utf8")
        if (!src.includes('from "next/image"')) {
            return []
        }
        return [...src.matchAll(/<Image\b[\s\S]*?\/>/g)].map((m) => ({
            file: relative(process.cwd(), file),
            jsx: m[0],
        }))
    })

describe("tối ưu ảnh (next/image)", () => {
    it("KHÔNG chỗ nào còn `unoptimized`", () => {
        const viPham = imageElements()
            .filter((el) => /\bunoptimized\b/.test(el.jsx))
            .map((el) => el.file)
        expect(viPham, "`unoptimized` = tải nguyên ảnh gốc; hãy thêm host vào remotePatterns "
            + "thay vì tắt optimizer").toEqual([])
    })

    it("mọi ảnh `fill` đều khai `sizes`", () => {
        const viPham = imageElements()
            .filter((el) => /\bfill\b/.test(el.jsx) && !/\bsizes=/.test(el.jsx))
            .map((el) => el.file)
        expect(viPham, "`fill` thiếu `sizes` ⇒ Next mặc định 100vw ⇒ trình duyệt tải bản to nhất "
            + "cho một ô nhỏ").toEqual([])
    })
})

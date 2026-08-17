// Rút gọn con số XP theo quy ước VIỆT: phần lẻ đứng SAU đơn vị.
//
//   1.000 → "1k"      1.300 → "1k3"     10.000 → "10k"
//   100.000 → "100k"  1.000.000 → "1m"  1.200.000 → "1m2"
//
// KHÔNG phải "1.3k" (kiểu Anh) — người đọc ở đây quen "1k3", và trộn hai quy ước
// trong cùng một bảng làm hai dòng cạnh nhau đọc ra hai hệ.

/** Đơn vị rút gọn, xét từ lớn xuống nhỏ. */
const UNITS: ReadonlyArray<{ threshold: number; suffix: string }> = [
    { threshold: 1_000_000, suffix: "m" },
    { threshold: 1_000, suffix: "k" },
]

/** Số không đọc được (NaN/Infinity) — hiện gạch ngang, KHÔNG in "NaNk". */
const UNKNOWN = "—"

/**
 * Rút gọn XP để hiển thị.
 *
 * ★ LUÔN LÀM TRÒN XUỐNG (về phía âm vô cực), không làm tròn gần nhất: 1.999 ra "1k9"
 * chứ KHÔNG ra "2k". Lý do không phải thẩm mỹ — bảng xếp hạng có phần thưởng thật, nên
 * con số hiện ra phải LUÔN ≤ số XP thật. Hiện nhiều hơn thực tế là hứa một phần thưởng
 * người dùng chưa đủ điều kiện nhận, và họ chỉ phát hiện ra lúc bị từ chối.
 *
 * Quy tắc này áp cho CẢ số âm (nếu về sau có đường trừ XP): −1.350 ra "−1k4" chứ không
 * "−1k3" — làm tròn về phía 0 sẽ khiến khoản trừ trông nhẹ hơn thực tế, đúng cùng kiểu
 * nói dối theo hướng có lợi cho hệ thống.
 *
 * @param value - số XP. Số lẻ bị sàn xuống trước khi rút gọn (cùng lý do trên).
 * @returns chuỗi đã rút gọn; `"—"` khi giá trị không phải số hữu hạn.
 */
export const formatXpShort = (value: number): string => {
    if (!Number.isFinite(value)) {
        return UNKNOWN
    }
    // Sàn TRƯỚC: 999,9 phải đọc là 999, không phải 1000 (chưa chạm mốc "1k").
    const floored = Math.floor(value)
    const magnitude = Math.abs(floored)

    const unit = UNITS.find((candidate) => magnitude >= candidate.threshold)
    if (!unit) {
        // Dưới 1.000 thì KHÔNG rút gọn: "999" đã ngắn, và "0k9" thì vô nghĩa.
        return String(floored)
    }

    // Đếm theo PHẦN MƯỜI của đơn vị rồi mới cắt — sàn ở đây chính là chỗ 1.999 thành 19
    // phần mười (1k9) thay vì 20 phần mười (2k).
    const tenths = Math.floor((floored * 10) / unit.threshold)
    // |tenths| ≥ 10 luôn đúng (đã qua ngưỡng), nên dấu âm nằm ở `whole`, không mất.
    const whole = Math.trunc(tenths / 10)
    const fraction = Math.abs(tenths % 10)

    return fraction > 0 ? `${whole}${unit.suffix}${fraction}` : `${whole}${unit.suffix}`
}

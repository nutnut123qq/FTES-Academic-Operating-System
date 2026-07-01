# UX brainstorm — rail TRÁI "chật quá" + ScrollShadow (2026-06-19)

> Vùng: `ContentMap` rail trái. Vấn đề thầy nêu: **nhìn chật**, scrollbar thô. Research web (rail chưa có ref density trong memory).

## Pain (từ screenshot)
1. **Scrollbar thô** ôm sát nội dung → bí. (thầy yêu cầu `ScrollShadow`.)
2. **Cuộn cả rail**: header (Hoàn thành/stats) + search trôi mất khi cuộn → mất "tôi đang ở đâu".
3. **Thanh progress lặp dưới MỌI module** = nhiễu thị giác (lines lặp).
4. **Rows san sát** (gap-0), tiêu đề 2 dòng ragged → "wall of text".

## Ref (web, đã search)
- **Whitespace > dividers — design restraint**: "bắt đầu bằng whitespace, chỉ thêm line khi cần; minimum visual weight"
  ([Medium grouping](https://medium.com/@abdulthedesigner1/3-methods-to-group-content-in-ui-design-containers-lines-and-white-space-7fb546795bf9), [icons8 dividers](https://icons8.com/blog/articles/visual-dividers-in-mobile-ui-design/)).
- **Sidebar spacing**: item cao 40–48px, label 14–16px, **cách group 16–24px**, "liếc 2s phải biết đang ở đâu + 3 mục chính"
  ([alfdesigngroup sidebar](https://www.alfdesigngroup.com/post/improve-your-sidebar-design-for-web-apps)).
- **Scannability**: whitespace + nhịp dọc đều → quét nhanh ([uxpin scannability](https://www.uxpin.com/studio/blog/website-design-for-scannability/)).

## Hướng

### Hướng A — Pin header + ScrollShadow + whitespace-first *(CHỐT)*
- **`ScrollShadow hideScrollBar`** bọc CHỈ danh sách module → bỏ scrollbar thô, fade trên/dưới.
- **Pin header (Hoàn thành + stats + "Tiếp tục") + search** ở trên, KHÔNG cuộn → luôn thấy tiến độ + tìm được ngay
  (đổi scroll từ outer container sang inner list; caller bỏ `overflow`, rail thành `flex-col` bounded `max-h`).
- **Whitespace thay line**: nới nhịp giữa module (cách group), row đủ cao ~44px; bớt cảm giác chật.
- **Thanh progress per-module**: để mảnh + nằm trong nhịp thoáng (giữ vì hữu ích), KHÔNG bỏ.
- Vì sao chốt: đúng "whitespace-first + pin nav", giải trực tiếp 4 pain, đáp yêu cầu ScrollShadow, rủi ro thấp, không đập tree.

### Hướng B — Bỏ thanh progress, chỉ count "n/m"
- Thay mọi thanh bằng text "n/m" muted bên phải header module → nhẹ nhất. Nhược: mất cảm giác tiến độ trực quan per-module.

### Hướng C — Gập hết trừ active, headers phẳng
- Rail = list module phẳng (không bar), expand 1 cái. Cực gọn nhưng mất overview nhiều module cùng lúc.

## Map (Hướng A — đều dùng đồ có sẵn)
| Việc | Cách |
|---|---|
| Bỏ scrollbar + fade | `ScrollShadow hideScrollBar` quanh list |
| Pin header/search | scroll dời vào inner ScrollShadow; caller `lg:flex lg:flex-col`, bỏ `overflow-y-auto` |
| Thoáng | nhịp dọc + cách group; giữ bar mảnh |

→ CHỐT A. Áp: ScrollShadow + pin header + nhịp thoáng. (B/C để dành nếu vẫn thấy nặng.)
Sources: [alfdesigngroup](https://www.alfdesigngroup.com/post/improve-your-sidebar-design-for-web-apps) · [grouping whitespace](https://medium.com/@abdulthedesigner1/3-methods-to-group-content-in-ui-design-containers-lines-and-white-space-7fb546795bf9) · [uxpin scannability](https://www.uxpin.com/studio/blog/website-design-for-scannability/).

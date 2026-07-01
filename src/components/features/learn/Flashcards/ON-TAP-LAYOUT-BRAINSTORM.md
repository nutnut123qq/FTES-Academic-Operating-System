# UX Brainstorm — Layout trang Ôn tập (`/learn/flashcards`)

> `/starci-fe-ux-brainstorm` · 2026-06-25 · FOCUS = LAYOUT (card FlipCard đã ok). KHÔNG code — chốt hướng rồi `/starci-fe-ux-apply`.

## Pain (layout lệch)
1. **2 mode "Học thẻ / Phỏng vấn thử" = tabs nhỏ trên** + nội dung xếp DỌC (due hero · Tiến bộ · lưới deck) → mỗi lần vào phải cuộn qua hero+progress; KHÔNG khớp pattern các trang `/learn` khác (nội dung/foundations dùng **rail trái nav + phải content**).
2. **Hàng chấm điểm `RatingBar`** (Quên/Khó/Được/Dễ): map grade→**4 variant KHÁC nhau** (danger solid · outline · secondary · primary) + Button KHÔNG `fullWidth` → không lấp ô grid → **không đều màu + lệch**.
3. Back-link "← Ôn tập" = pill clunky chiếm 1 hàng; grade bar trôi xa card; khối rời `gap-6` rời rạc.

## Hướng chốt (thầy đề xuất) — RAIL TRÁI như sidebar trang nội dung
Biến Ôn tập thành **2-pane learn-shell** (khớp `/learn/content`):
- **Rail TRÁI** (`LearnShell` `leftRail`): **mode** (Học thẻ / Phỏng vấn — nav trên) + **danh sách Bộ thẻ** (search + 15 deck + due count) dưới. = "render Học thẻ/Phỏng vấn dạng List bên trái" + gom luôn deck list.
- **Pane PHẢI**: surface active — ôn 1 deck (FlipCard) / due session / phỏng vấn. Default khi chưa chọn = overview (due-today + Tiến bộ).
- **Vì sao**: gom home-xếp-dọc → workspace tập trung; đồng bộ pattern `/learn` (trái nav, phải content); chọn deck nhanh, không cuộn lại hero mỗi lần.
- **Caveat**: 2 mode KHÔNG đủ nuôi 1 rail → rail PHẢI gồm cả deck list (mode = section header, deck = item — mirror content map: module→lesson).

### Quyết định cần thầy chốt
- **D1 — "Đến hạn hôm nay" + "Tiến bộ" để đâu?** (a) pane overview MẶC ĐỊNH bên phải khi chưa chọn deck *(đề xuất — gom gọn)*; hay (b) ghim item đầu rail ("Đến hạn · 21").
- **D2 — Mobile**: rail thu như content map (drawer/top-collapse) — giữ pattern `LearnShell`.

## Layout polish kèm (vẫn là layout)
- **`RatingBar` đều màu + cân**: 4 nút EQUAL-WIDTH lấp ô (`fullWidth`/grid stretch) + **1 treatment NHẤT QUÁN** theo thang ngữ nghĩa (Quên `danger` · Khó `warning` · Được `success` · Dễ `accent`), KHÔNG mỗi nút 1 variant. Ramp đỏ→xanh đọc ra "thang 4 bậc" (Anki-style: 4 nút đều + interval dưới nhãn). Ref [Anki answer buttons](https://docs.ankiweb.net/studying.html) · [memo.cards](https://www.memo.cards/blog/how-to-customize-anki-s-user-interface).
- **Gom control quanh card**: progress "Thẻ x/y" + chips ngay trên card; reveal→grade ngay dưới card (1 cụm), bỏ khoảng `gap-6` trôi.
- Back-link subtle (text + arrow) thay pill (leaf-page: 1 affordance lùi gọn).

## Data (đã research trước — đủ, 0 query mới)
Rail deck list = `flashcardDecksByCourse` (title, difficulty, `dueCount`); mode = local state; due = `myDueFlashcards(courseId)`; mastery/progress = `myFlashcardStats` + decks. Pane = reviewer/due/interview như cũ.

## States
- Rail empty (course chưa có deck) → empty hint. Pane chưa chọn → overview (due+progress). Mobile rail collapse. a11y: rail = nav list (`aria-current`), grade buttons label + interval.

## Sau khi thầy chốt D1/D2
`/starci-fe-ux-apply`: `learn/layout.tsx` bật `leftRail` cho segment `flashcards` (mode + deck list); pane phải = active surface; sửa `RatingBar` (fullWidth + ramp nhất quán); gom control quanh card. Rút nguyên tắc (rail-nav cho surface có nhiều item / grade-row đều) → `.claude/rules/drafts/`.

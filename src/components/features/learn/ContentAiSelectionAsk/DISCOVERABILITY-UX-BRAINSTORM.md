# UX Brainstorm — Dạy người dùng "bôi đen từ khóa để hỏi AI" (2026-06-28)

> Câu hỏi thầy: làm sao **hướng dẫn người dùng bôi đen keyword để AI giải thích**?
> Tính năng đã có (`ContentAiSelectionAsk`): bôi đen text trong `#lesson-article` → nút nổi "Hỏi AI về đoạn này" → mở chat. Bước này KHÔNG code — ra hướng + chốt.

## Vấn đề cốt lõi (grounded)
- **Chicken-and-egg:** nút "Hỏi AI về đoạn này" **CHỈ hiện SAU khi đã bôi đen** (`ContentAiSelectionAsk` nghe `mouseup`/`touchend`). Người chưa biết "có thể bôi đen" → **không bao giờ khám phá**. Không có hint nào trước đó.
- **FAB** (`ContentAiFab`, sparkle ở mép) chỉ có `aria-label="Hỏi AI"` — KHÔNG nhắc gì tới bôi đen.
- **Chưa có** hệ coachmark/onboarding/first-run nào trong app. Precedent gần nhất = `GithubLinkGate` (soft, 1 lần/session).
- Sẵn có để dùng: `LocalStorage.getItem/setItem<T>(LocalStorageId.X)` (+ thêm enum `HintSeenSelectionAsk`), i18n `contentAi.*`, anchor **ngay trên `#lesson-article`** (`ContentBodyV2`).

## Nguyên tắc (research)
- **Inline feature discovery** (gợi ý NGAY trong luồng, không che nội dung) > teaching bubble tự bật chen ngang (Primer · Notion).
- **Dạy đúng lúc có ý định** (Notion: bôi đen → menu AI hiện ngay; highlight input để hút mắt).
- **Restraint:** badge/tooltip/banner nhồi khắp nơi → mất nghĩa. Chỉ 1 tín hiệu, hiện 1 lần, tự tắt khi đã dùng. Không làm hành trình đọc nặng nề.

## 3 hướng
| | Mô tả | Ref | Trade-off |
|---|---|---|---|
| **A · gợi ý inline 1 lần trên bài** ⭐ | Callout mảnh trên `#lesson-article` (lesson đầu): "Mẹo: bôi đen đoạn bất kỳ để hỏi AI". Dismiss-once + tự tắt khi đã bôi đen lần đầu | Primer inline discovery, Notion | Trong luồng đọc, đúng nơi hành động; giải được cold-start. Tốn 1 hàng đầu bài (chỉ 1 lần) |
| **B · coachmark trỏ FAB** | First-visit popover trỏ FAB: "Hỏi AI về bài — hoặc bôi đen 1 đoạn" | teaching bubble | Nối FAB+bôi đen; nhưng FAB ở mép (ngoài luồng đọc), popover tự bật dễ phiền |
| **C · nhấn mạnh nút lần bôi đen ĐẦU** | Lần đầu nút "Hỏi AI" hiện → kèm nhãn "Mới"/pulse; sau đó bình thường | Notion "new" tag | 0 nhiễu cho người không bôi đen; dạy đúng lúc. Nhưng vẫn cần bôi đen TRƯỚC → không tự giải "tôi không biết có thể bôi đen" |

## CHỐT (đề xuất): **A (chính) + C (gia cố nhẹ)** — KHÔNG B
- **A** = giải cold-start: một callout inline, **1 lần**, trên bài đọc đầu tiên — "Mẹo: bôi đen bất kỳ đoạn nào để hỏi AI giải thích" + nút × dismiss. Token `bg-accent` + `text-accent` (đồng bộ chip), icon Phosphor (`TextAaIcon`/`CursorClickIcon`/`SparkleIcon` — KHÔNG emoji), sentence case.
- **C** = gia cố ở khoảnh khắc ý định: **lần đầu tiên** nút nổi xuất hiện → thêm 1 chip nhỏ "Mới" cạnh nhãn (hoặc 1 pulse ring nhẹ). Sau lần dùng đầu → bỏ.
- **Bỏ B**: FAB ở mép ngoài luồng đọc, popover tự bật = chen ngang, kém "seamless".
- **Restraint:** 2 tín hiệu này **CÙNG tắt vĩnh viễn ngay khi user bôi đen lần đầu** (đã khám phá → ngừng dạy). Không nhồi cả 3.

## Engineering (khi /apply — grounded, dùng primitive sẵn)
1. `LocalStorageId` thêm `HintSeenSelectionAsk = "hint:selection-ask"` (bool). Set `true` khi: user bấm × HOẶC lần đầu `setSelection` chạy (đã bôi đen) → cả A lẫn C tắt.
2. **A**: callout đặt trong `ContentBodyV2` NGAY trên `#lesson-article`, gate `!hasSeen && isReadingTab`. Dismiss → set flag. Component nhỏ, token-based (không lib, không dep coachmark).
3. **C**: `ContentAiSelectionAsk` đọc cùng flag → lần đầu thêm chip "Mới"/pulse vào nút; sau set flag thì thôi.
4. i18n mới: `contentAi.selectionHint` ("Bôi đen bất kỳ đoạn nào để hỏi AI giải thích." / "Select any passage to ask AI about it.") + `contentAi.new` ("Mới" / "New"). Tái dùng `askAboutSelection` cho nhãn nút.
5. Mobile: bôi đen + nút nổi vẫn chạy; callout A hiển thị tốt trên mobile (full-width hàng đầu bài).

## Nguồn
- [Primer — Feature onboarding (inline discovery + teaching bubbles)](https://primer.style/product/ui-patterns/feature-onboarding/)
- [Eleken — What is feature discovery](https://www.eleken.co/blog-posts/feature-discovery)
- [Medium — How Notion designs for AI feature discovery (highlight input, "new" tags)](https://medium.com/design-bootcamp/how-notion-utilize-visual-and-perceptual-design-principles-to-to-increase-new-ai-features-adoption-82e7f0dfcc4e)
- [Medium — Design interventions to enable feature discovery](https://medium.com/shuklaprakash/design-interventions-to-enable-feature-discovery-a3c815c9b778)

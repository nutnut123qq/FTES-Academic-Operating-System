# Modal padding — brainstorm chuẩn hoá (2026-06-24)

> Thầy hỏi (DevTools `AuthenticationModal`): *"tại sao lại có `p-3` ở đây, xóa đi chứ, áp dụng cho toàn bộ modals dc không"*.

## Gốc rễ (đọc HeroUI v3 `@heroui/styles/.../modal.css`)
HeroUI đã bake sẵn mô hình padding của modal — **dialog sở hữu gutter, body chỉ "thở" cho focus-ring**:

| slot | `@apply` thật | nghĩa |
|---|---|---|
| `.modal__dialog` | `p-6` | **gutter thật = 24px** mọi cạnh. Header/body/footer đều sống TRONG đây. |
| `.modal__header` | `flex flex-col gap-3` (`mb-0`) | không padding riêng. |
| `.modal__footer` | `flex flex-row justify-end gap-2` (`mt-0`) | không padding riêng. |
| `.modal__body` | `-m-[3px] my-0 overflow-visible p-[3px]` | **focus-ring breathing**: 3px padding + -3px margin ngang → **net indent = 0** (body thẳng mép header/footer), 3px chỉ để ring/box-shadow của input không bị `overflow` cắt. |

→ Modal "đúng" KHÔNG cần set padding gì cho body: `dialog p-6` lo gutter, `body p-[3px]/-m-[3px]` lo breathing.

## Bệnh
Nhiều modal **tự set `p-*` lên `Modal.Body`** (`p-3`, `p-4`, `p-2`, `p-0`) → đè `p-[3px]` nhưng **không đụng** `-m-[3px]` → body bị:
- **Double padding**: gutter dialog 24px + padding body (12–16px) chồng lên.
- **Lệch mép**: ngang = `24 - 3 + 12 = 33px` (body) vs `24px` (header/footer) → body thụt vào hơn tiêu đề & nút → chính là cái thầy thấy.

## Luật đề xuất (STRICT)
1. **KHÔNG set `p-*` lên `Modal.Body`.** Để HeroUI lo (dialog `p-6` + body breathing). Đây là áp luật StarCi "block/container sở hữu padding, feature chỉ placement" — `Modal` (block HeroUI) sở hữu padding, từng modal không tự chế.
2. **`gap` của nội dung body = wrapper TRONG body** (`<div class="flex flex-col gap-X">`), KHÔNG nhét `gap-*` lên chính `Modal.Body` (body không phải lúc nào cũng flex; HeroUI chỉ bake gap cho header/footer).
3. **Full-bleed là NGOẠI LỆ CÓ CHỦ ĐÍCH, không phải `p-2/p-0` rải bừa.** Search palette (cmd-k input tràn mép) / media preview (video, CV, ảnh) muốn sát mép → dùng pattern bleed có tên (giảm padding ở DIALOG hoặc wrapper bleed riêng), và ghi chú lý do — KHÔNG để `p-0`/`p-2` lẻ trông như drift.

## Inventory 24 modal → hành động
| Modal | `Modal.Body` hiện tại | Hành động |
|---|---|---|
| AuthenticationModal (Credentials/Otp×2/Registration) | `overflow-visible p-3` | **GỠ `p-3`** (body đã `overflow-visible` sẵn → bỏ luôn) |
| AdModal | `gap-3 p-4` | GỠ `p-4`; `gap-3` chuyển vào wrapper trong |
| PremiumGateModal | `gap-3 p-4` | GỠ `p-4`; `gap-3` → wrapper |
| LanguageModal | `gap-0 p-4` | GỠ `p-4 gap-0` |
| LivestreamCalendarModal | `gap-0 p-4` | GỠ `p-4 gap-0` |
| LessonVideoModal | `gap-0 p-4` | GỠ `p-4` (video bleed: nếu muốn sát mép → bleed wrapper có chủ đích) |
| CvPreviewModal | `p-2` | NGOẠI LỆ media-preview → quyết định: gutter chuẩn hay bleed có tên |
| GlobalSearchModal | `p-0 w-full overflow-hidden` | NGOẠI LỆ cmd-k full-bleed → GIỮ nhưng đánh dấu là pattern bleed cố ý |
| AIProcessingModal | default (inner `py-8 px-4`) | OK (đang comment out) |
| AiQuotaModal · ContentModal · FeedbackDetailsModal · FollowListModal · FoundationModal · HeadhunterModal · LinkGithubModal · ManagePinnedProjectsModal · PaymentModal · ShareModal · UserMilestoneTaskFeedbacksModal · CvReviewLevelDetailsModal · CvUpdateModal | default (không set `p-*`) | ✅ đã đúng (một số set `gap-6` body — cân nhắc chuyển gap vào wrapper, không gấp) |

**Tổng:** 7 modal cần gỡ override (`p-3`×1 Auth gồm 4 file state · `p-4`×4 · ), 2 ngoại lệ media/search cần quyết định, phần còn lại đã chuẩn.

## Bước sau
`/starci-fe-ux-apply` → gỡ `p-*`/`gap-*` ad-hoc trên `Modal.Body` theo bảng; chốt pattern bleed cho search + preview trước khi đụng 2 ngoại lệ. KHÔNG đụng dialog `p-6` (gutter chuẩn).

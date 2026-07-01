# UX-BRAINSTORM — Overlays (modals + drawers) toàn FE  (2026-06-18)

> Audit chéo MỌI overlay rồi thiết kế lại CÁCH CHỌN surface. Không code. Legacy = inventory.
> Hạ tầng hiện tại: 1 zustand `useOverlayStore` (32 `OverlayKey`) + `ModalContainer` + `DrawerContainer`
> mount global trong `InnerLayout`; accessor `useXxxOverlayState()`; payload qua `*Context`. **Hạ tầng tốt — giữ.**

## 0. Vấn đề gốc (vì sao brainstorm)
~25 **modal** đã bồi tụ, trộn 3 việc KHÁC NHAU vào cùng 1 surface (centered dialog) → triệu chứng:
- **Modal chồng modal**: `SubmissionAttemptsDrawer` (drawer) → mở `CvSubmissionAttemptAnalysisModal` (modal) đè lên → lạc ngữ cảnh, 2 backdrop.
- **Full-screen modal = trang KHÔNG có URL**: `ChallengeModal size=full`, `ContentModal`, `CvPreviewModal`, `AiQuotaModal` → mất deep-link / back-button / refresh-safe (đã có sẵn route `/profile/ai-usage` mà vẫn nhồi vào modal).
- **Mobile**: 4 drawer đều `placement="right"` → trên mobile nên là **bottom-sheet**; modal `xs` co cụm giữa màn mobile xấu.
- **2 cái lệch kiến trúc**: `AvatarUploadModal` mount cục bộ trong EditProfile (nên global); `E2eResultDrawer` dùng `useState` cục bộ (nên vào store + `DrawerContainer`).

## 1. Luật CHỌN SURFACE (đóng góp chính của brainstorm — 5 loại, mỗi việc 1 chỗ)
| Surface | Dùng khi | Đặc tính | A11y |
|---|---|---|---|
| **Popover** (anchored) | transient, nhẹ, gắn trigger, mất focus = đóng | KHÔNG backdrop nặng, không khoá nền | menu/listbox roles |
| **Modal** (centered dialog, `xs`) | **1 QUYẾT ĐỊNH** ngắn cần toàn tâm: confirm / auth / pay / share / form nhỏ | blocking, **1 primary action**, KHÔNG cuộn dài | focus-trap, Esc/backdrop đóng |
| **Drawer** (side desktop / **bottom-sheet mobile**) | **INSPECT / phụ trợ** giữ ngữ cảnh: list lịch sử, master-detail, mobile nav | trượt cạnh, có thể **stack nội bộ** (swap detail), không đẻ modal con | trap + restore focus |
| **Full-page route** | **IMMERSE / primary / cần deep-link**: làm challenge, đọc bài, dashboard, quản lý | có URL (share/back/refresh-safe) | trang thật |
| **In-place panel** (framer-motion) | co/giãn TẠI CHỖ (sidebar collapse) → KHÔNG drawer | reflow, `useReducedMotion()` | (đã có rule) |

**Heuristic 1 câu:** *Quyết định → modal · Soi/lịch sử → drawer · Đắm vào/nhiều thứ/đáng share → route · Menu nhanh → popover.*
Cờ đỏ: full-screen modal · modal mở từ drawer · modal cuộn 3 màn · form dài trong modal.

## 2. Phân loại lại overlay hiện có (reclassify)
**GIỮ modal (decision/short):** PremiumGate · Payment · Authentication · Share · LinkGithub · CvUpdate(form) · AvatarUpload(form, **move global**) · các confirm (reward-redeem, session-revoke).
**GIỮ popover:** NotificationBell · AccountMenu · các Autocomplete (content/milestone/global search). **→ Language nên đổi modal→popover** (chỉ là picker 2 lựa chọn).
**→ DRAWER (inspect, + bottom-sheet mobile, gộp stack):** FeedbackDetails · CvReviewLevelDetails · **CvSubmissionAttemptAnalysis** (gộp vào AttemptsDrawer kiểu master-detail thay vì modal-trên-drawer) · UserMilestoneTaskFeedbacks · Headhunter · Foundation(doc/video). 4 drawer attempts hiện có = đúng, chỉ thêm bottom-sheet mobile.
**→ ROUTE (immerse/deep-link):** **ChallengeModal**→`/.../challenge/[id]` (hoặc Next intercepting route giữ cảm giác overlay + có URL) · **ContentModal**→trang đọc bài · **CvPreviewModal**→route xem CV · **AiQuotaModal**→dùng `/profile/ai-usage` đã có (modal chỉ còn teaser link). ManagePinnedProjects: giữ modal multi-tab (quản lý ngắn) HOẶC route settings — để sau.
**MEDIA/loading (modal OK):** LessonVideo · Ad · AIProcessing (hoặc inline status).
**SỬA kiến trúc ngay:** AvatarUpload→`/modals/`+ModalContainer; E2eResult→`/drawers/`+store key `e2eResult`.

## 3. Hướng (≥2) + CHỐT
- **H1 — "3 surface discipline" + phân loại lại (CHỐT, phased).** Áp luật §1, re-platform các cờ-đỏ rõ ràng: full-screen modal→route, detail-modal-trên-drawer→drawer master-detail, thêm bottom-sheet mobile, fix 2 cái lệch. Lý do: trị tận gốc modal-hell + lấy lại deep-link/back, rủi ro vừa vì làm theo đợt.
- **H2 — cleanup tối thiểu.** Chỉ fix 2 cái lệch + chuẩn hoá chrome (header/footer/size) + bottom-sheet, KHÔNG re-platform. Rủi ro thấp, nhưng để lại full-screen-modal-no-URL → loại (nửa vời).
- **H3 — URL-first toàn bộ (Next intercepting/parallel routes).** Mọi overlay nặng có URL. Mạnh nhất nhưng đại phẫu router, rủi ro cao → để là tầm nhìn, không làm ngay.

**Chọn H1**, phân đợt: **P0** fix 2 lệch + bake luật §1 (draft) → **P1** bottom-sheet mobile cho drawer/large-modal + gộp attempt analysis vào drawer (bỏ modal chồng) → **P2** re-platform Challenge/Content/CvPreview/AiQuota sang route (intercepting route nếu muốn giữ overlay-feel).

> **SCOPE CHỐT (2026-06-18): làm P0 + P1.** P2 (re-platform sang route) ĐỂ SAU — `/ux-apply` lần này KHÔNG đụng routing.
> P0: (a) AvatarUploadModal → `src/components/modals/` + ModalContainer; (b) E2eResultDrawer → `src/components/drawers/` + key `e2eResult` trong store + DrawerContainer; (c) Language modal → popover; (d) chuẩn hoá chrome §4 + bake luật §1 thành draft.
> P1: (a) drawer + large-modal: `placement="right"` desktop / `bottom` mobile (bottom-sheet); (b) gộp `CvSubmissionAttemptAnalysisModal` vào AttemptsDrawer kiểu master-detail (bỏ modal-trên-drawer); rà các attempts drawer còn lại cùng pattern.

## 3b. CÁI NÀO **KHÔNG NÊN** LÀM MODAL (tách riêng cho thầy)
Tiêu chí loại khỏi modal: (a) nội dung dài/đọc lâu, (b) đáng deep-link/share/back, (c) là "soi chi tiết phụ trợ"
chứ không phải 1 quyết định, (d) đang mở modal-trên-drawer, (e) chỉ là picker nhẹ.

**→ ROUTE (P2, để sau — KHÔNG phải modal):**
- `ChallengeModal` (size=full) — app làm-bài đầy đủ, cần URL/back/refresh/share.
- `ContentModal` — đọc bài dài = trang.
- `CvPreviewModal` — xem CV full = trang.
- `AiQuotaModal` — dashboard usage; **đã có route `/profile/ai-usage`**, modal chỉ nên là teaser-link.

**→ DRAWER inspect (P1, làm đợt này — không nên modal):**
- `CvSubmissionAttemptAnalysisModal` — đang mở **trên** AttemptsDrawer (modal-chồng-drawer) → gộp vào drawer master-detail.
- `FeedbackDetailsModal`, `CvReviewLevelDetailsModal`, `UserMilestoneTaskFeedbacksModal` — soi chi tiết phụ trợ, giữ ngữ cảnh.
- `HeadhunterModal`, `FoundationModal` (doc/video) — panel chi tiết, hợp drawer hơn dialog giữa.

**→ POPOVER (P1 — không cần modal):**
- `LanguageModal` — picker 2 lựa chọn, anchored popover là đủ.

**VẪN LÀ MODAL (đúng — 1 quyết định/ngắn/form nhỏ/media):** PremiumGate · Payment · Authentication · Share ·
LinkGithub · CvUpdate(form) · AvatarUpload(form) · các confirm (reward-redeem, session-revoke) · LessonVideo · Ad ·
AIProcessing(loading). → Những cái này CHỈ rewrite-theo-rules (chrome §4 + AsyncContent + WithClassNames), KHÔNG đổi surface.

## 4. Chuẩn hoá chrome (mọi overlay, bake khi /ux-apply)
- Mỗi overlay đọc fetch → **`AsyncContent`** (loading skeleton mirror + empty `align="center"` + error+retry). KHÔNG ternary trần.
- Modal: header trái + subtitle · divider có label thường · **1 primary action** ở footer phải · `rounded-3xl`.
- Drawer: header + `Drawer.Body` cuộn (`ScrollShadow`) + footer action · desktop `right` / **mobile `bottom`** (1 prop theo breakpoint) · master-detail = swap trong body, không mở modal con.
- Popover: không khoá nền, đóng khi mất focus/Esc.
- Mọi cái: feature chỉ GHÉP (state qua `useXxxOverlayState`, không `useState` cục bộ), `*Props extends WithClassNames`, tôn trọng `useReducedMotion()`.

## 5. Section → dữ liệu (đã có sẵn, không bịa)
Mỗi overlay đã map query/mutation trong audit: Payment→`courseEnroll/purchaseAiSubscription/purchaseMembership` · FollowList→`userFollowers/Following` · attempts→`*SubmissionAttempts` · AiQuota→`myAiQuota` · ManagePinned→`setPinnedProjects` · feedback/review→các `query*`. Re-platform KHÔNG đổi data, chỉ đổi surface + thêm URL param.

## 6. Cắt / thêm
- **Thêm:** luật chọn-surface (§1) · bottom-sheet mobile · drawer master-detail (gộp analysis) · deep-link route cho 4 immerse · 2 fix kiến trúc.
- **Cắt:** modal chồng modal · full-screen-modal-no-URL · Language modal (→popover) · `useState` overlay cục bộ.
- **Giữ:** toàn bộ hạ tầng zustand+container (tốt) · decision modals · popovers · 4 attempts drawer.

## 7. A11y/state (tính từ đầu)
focus-trap + restore focus khi đóng (HeroUI lo) · Esc/backdrop đóng · route-surface = trang thật có `<h1>` · reduced-motion tắt slide · mobile bottom-sheet vuốt-đóng · mọi data-overlay bọc AsyncContent.

→ Thầy duyệt hướng (H1 + thứ tự P0→P2) → `/ux-apply`. Phản hồi của thầy → trò ghi `.claude/rules/drafts/`.
